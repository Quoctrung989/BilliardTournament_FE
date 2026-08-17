# Runbook — Deploy Frontend lên Cloudflare Pages

> Ngày soạn: 2026-08-07 · Phạm vi: **chỉ FE**. Backend vẫn giữ nguyên CI/CD sẵn có trên EC2.
> File này dùng để truy vết: mỗi lần thay đổi hạ tầng, ghi thêm vào mục [Nhật ký thay đổi](#9-nhật-ký-thay-đổi).

---

## 0. Điền thông số trước khi bắt đầu

| Thông số | Giá trị | Ghi chú |
|---|---|---|
| Domain mua ở Mắt Bão | `biliardtournament.cloud` | mua trên Mắt Bão, NS vẫn ở `ns1/ns2.matbao.com` tính tới 2026-08-08 |
| Domain FE (production) | `https://biliardtournament.cloud` | + `www.biliardtournament.cloud` redirect về apex |
| Domain BE (API + WebSocket) | `https://api.biliardtournament.cloud` | **phải là HTTPS**, xem §1 |
| Domain ảnh (MinIO) | `https://cdn.biliardtournament.cloud` | **phải là HTTPS**, xem §1 |
| EC2 public IP | `18.138.158.94` | lấy từ `.github/workflows/deploy.yml` |
| Repo FE | `Quoctrung989/SU26_SEP490_G2_FE` | |
| Nhánh production | `prod` | trùng nhánh trigger của workflow hiện tại |
| Cloudflare account | `______________` | |

---

## 1. Hai điểm chặn phải xử lý TRƯỚC khi deploy

Đây là phần dễ mất thời gian nhất. Cloudflare Pages **chỉ phục vụ qua HTTPS**, không thể tắt.
Trang HTTPS gọi tài nguyên HTTP sẽ bị trình duyệt chặn (mixed content) — không phải lỗi code, không sửa được ở FE.

### 1.1. Backend đang chạy HTTP thuần

Hiện tại FE build với `REACT_APP_API_URL: http://18.138.158.94:8080`
(`.github/workflows/deploy.yml`). Sau khi lên Pages:

- `https://biliardtournament.cloud` gọi `http://18.138.158.94:8080` → **toàn bộ API bị chặn**, app trắng/không đăng nhập được.
- WebSocket cũng vậy: `src/constants/websocket.js` đổi `http`→`ws`, thành `ws://` — trang HTTPS chỉ chấp nhận `wss://`.

**Bắt buộc: BE phải có endpoint HTTPS.**

### 1.2. Ảnh MinIO cũng đang HTTP

BE trả **presigned URL tuyệt đối** dựng từ `MINIO_ENDPOINT`
(`MinioStorageServiceImpl.java:121`). Nếu endpoint là `http://<ip>:9000` thì mọi avatar,
ảnh tin tức, ảnh giải đấu đều là link HTTP → Chrome chặn/không hiện ảnh.

**Bắt buộc: MinIO cũng phải có hostname HTTPS.**

### 1.3. Cách xử lý — đã chốt: Caddy trên EC2

**Quyết định (2026-08-07): dùng Caddy cài trên host EC2**, không dùng Cloudflare Tunnel.
Toàn bộ việc này thuộc phần backend và có runbook riêng:

> 📘 **[`infra/deploy-be-https-runbook.md`](../../infra/deploy-be-https-runbook.md)** — làm xong runbook đó trước, rồi mới quay lại file này.

Tóm tắt kết quả sau khi chạy xong runbook BE:

| Hostname | Phục vụ bởi | Dùng cho |
|---|---|---|
| `https://api.biliardtournament.cloud` | Caddy → `localhost:8080` | REST API + WebSocket `wss://api.biliardtournament.cloud/ws` |
| `https://cdn.biliardtournament.cloud` | Caddy → `localhost:9000` | Ảnh MinIO |

Kiểm tra nhanh trước khi làm tiếp: `curl -i https://api.biliardtournament.cloud/api/v1/health` phải trả `200`
với chứng chỉ hợp lệ.

⚠️ **Ảnh hưởng tới bước đổi nameserver ở §4:** vì Caddy tự xin Let's Encrypt qua thử thách HTTP-01,
các bản ghi A của `api`, `cdn` và apex **phải để mây xám (DNS only)** sau khi domain về Cloudflare.
Bật proxy (mây cam) sẽ khiến Caddy không cấp được chứng chỉ. Chỉ riêng bản ghi CNAME mà Cloudflare
Pages tự tạo cho FE là được proxy — Pages tự lo TLS.

---

## 2. Chuẩn bị phía repo FE

- [x] **`public/_redirects`** — đã tạo sẵn trong commit này:

  ```
  /*    /index.html   200
  ```

  Không có file này, deep link (`/player/tournaments/5`, `/payment/success`) sẽ **404 khi F5 hoặc khi PayOS redirect về**.
  Đây chính là thứ thay cho `try_files $uri /index.html` trong `nginx.conf`.
  Đã verify: CRA copy nguyên file từ `public/` sang `build/` khi chạy `npm run build`.

- [x] **Không cần sửa code cho WebSocket.** `getWebSocketUrl()` suy ra từ `REACT_APP_API_URL`
  bằng `replace(/^http/, "ws")`, nên khi biến là `https://api.biliardtournament.cloud` nó tự thành
  `wss://api.biliardtournament.cloud/ws` — đúng.

- [ ] **Không commit file `.env`.** Repo hiện không có `.env` và nên giữ vậy; `REACT_APP_API_URL`
  đặt bằng biến môi trường của Pages (§3).

---

## 3. Tạo project trên Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **bấm đúng tab `Pages`** → *Connect to Git*.

   > ⚠️ **Bẫy đã dính một lần (2026-08-08):** giao diện Cloudflare mặc định đẩy sang **Workers**,
   > và luồng Workers cũng có mục "Connect to a Git repository" trông rất giống. Dấu hiệu nhận
   > biết bạn đang ở nhầm chỗ: màn hình ghi *"Connect your **Worker** to a Git repository"*,
   > build config hiện `Deploy command: npx wrangler deploy` và có mục **API token**.
   >
   > Pages **không** có `wrangler deploy` và **không** hỏi API token. Nếu lỡ tạo Worker thì
   > `npx wrangler deploy` sẽ fail vì repo không có `wrangler.toml`/`wrangler.jsonc`.

2. Authorize GitHub, chọn repo `Quoctrung989/SU26_SEP490_G2_FE`.
3. Cấu hình build:

   | Trường | Giá trị |
   |---|---|
   | Production branch | **`prod`** — mặc định Cloudflare điền `main`, PHẢI đổi |
   | Framework preset | `Create React App` |
   | Build command | `npm run build` |
   | Build output directory | `build` |
   | Root directory | *(để trống)* |

4. **Environment variables** — thêm cho cả **Production** và **Preview**:

   | Biến | Production | Vì sao |
   |---|---|---|
   | `REACT_APP_API_URL` | `https://api.biliardtournament.cloud` | CRA nhúng vào bundle **lúc build**, đổi biến là phải build lại |
   | `CI` | `false` | **Bắt buộc.** Pages đặt `CI=true`, CRA sẽ biến ESLint warning thành error và build fail. Repo đang có sẵn warning `no-unused-vars`. Workflow EC2 hiện tại cũng đang phải set `CI: false` |
   | `NODE_VERSION` | `20` | Khớp Node của workflow hiện tại |

5. **Save and Deploy**. Build đầu tiên sẽ ra `https://<project>.pages.dev`.

> Preview deployment (mỗi PR một URL `*.pages.dev`) sẽ bị CORS chặn nếu BE chỉ allow domain production — xem §5.

---

## 4. Trỏ domain Mắt Bão sang Cloudflare

Cloudflare Pages custom domain hoạt động gọn nhất khi domain dùng nameserver của Cloudflare.

1. Cloudflare Dashboard → **Add a site** → nhập `biliardtournament.cloud` → chọn gói **Free**.
2. Cloudflare quét DNS hiện có → **kiểm tra kỹ danh sách này**, đặc biệt bản ghi **MX** nếu domain đang nhận email,
   và các bản ghi trỏ về EC2. Thiếu bản ghi ở bước này là mất mail/mất service.
3. Cloudflare hiện 2 nameserver dạng `xxx.ns.cloudflare.com`.
4. Vào trang quản trị Mắt Bão → **Quản lý tên miền** → chọn `biliardtournament.cloud` → **Nameserver / DNS** →
   chuyển sang *Sử dụng nameserver khác* → dán 2 NS của Cloudflare → lưu.
5. Chờ NS có hiệu lực (thường 15 phút – vài giờ, tối đa 24–48h). Kiểm tra:
   `nslookup -type=ns biliardtournament.cloud`.
6. Khi Cloudflare báo **Active**: quay lại Pages project → tab **Custom domains** →
   *Set up a domain* → thêm `biliardtournament.cloud` và `www.biliardtournament.cloud`. Cloudflare tự tạo CNAME và cấp SSL.

> Nếu chưa muốn đổi nameserver, có thể tạm test bằng `https://<project>.pages.dev` — nhưng
> vẫn phải đổi NS trước khi dùng domain thật, vì `api.` và `cdn.` ở §1 cũng cần Cloudflare quản DNS.

---

## 5. Cập nhật biến môi trường Backend trên EC2

Sửa `/opt/deploy/.env` rồi `docker compose up -d backend`. Tất cả tên biến dưới đây lấy trực tiếp từ
`application.yml` / `application-prod.yml` của BE:

| Biến | Giá trị mới | Không sửa thì hỏng gì |
|---|---|---|
| `CORS_ALLOWED_ORIGIN` | `https://biliardtournament.cloud` | Mọi request từ FE bị CORS chặn |
| `FRONTEND_BASE_URL` | `https://biliardtournament.cloud` | Link trong email tự động (xác nhận đăng ký, lịch thi đấu…) vẫn trỏ `localhost:3000` |
| `PAYOS_RETURN_URL` | `https://biliardtournament.cloud/payment/success` | Thanh toán xong PayOS đá về `localhost:3000` → người dùng mất dấu đơn |
| `PAYOS_CANCEL_URL` | `https://biliardtournament.cloud/payment/cancel` | Tương tự khi huỷ thanh toán |
| `MINIO_PUBLIC_HOST` | `cdn.biliardtournament.cloud` | Presigned URL vẫn trỏ `http://minio:9000` → ảnh hỏng (§1.2). `docker-compose.yml` dựng `MINIO_ENDPOINT` và `extra_hosts` từ biến này — **không có `https://`, không có `/` cuối** |

**Về `CORS_ALLOWED_ORIGIN`:** `application-prod.yml` khai báo list chỉ có **một** phần tử,
nên không thể nhét nhiều domain bằng dấu phẩy. Muốn allow thêm `www` và preview `*.pages.dev`,
dùng biến môi trường dạng chỉ số (Spring Boot ưu tiên env hơn yml):

```
APP_CORS_ALLOWEDORIGINPATTERNS_0=https://biliardtournament.cloud
APP_CORS_ALLOWEDORIGINPATTERNS_1=https://www.biliardtournament.cloud
APP_CORS_ALLOWEDORIGINPATTERNS_2=https://*.pages.dev
```

**Đăng ký lại webhook PayOS**: nếu URL webhook trong dashboard PayOS đang trỏ `http://18.138.158.94:8080/api/v1/payments/payos/webhook`,
đổi sang `https://api.biliardtournament.cloud/api/v1/payments/payos/webhook`.

WebSocket phía BE không cần sửa: `WebSocketConfig` đang `setAllowedOriginPatterns("*")`.

---

## 6. Dọn dẹp đường deploy cũ

Sau khi Pages chạy ổn, `.github/workflows/deploy.yml` vẫn sẽ build & restart container `frontend`
trên EC2 mỗi lần push `prod` — hai bản FE cùng tồn tại, dễ nhầm khi debug.

- [ ] Xoá job `deploy` trong `.github/workflows/deploy.yml`, **giữ lại job `build-check`** làm CI cho PR.
- [ ] Gỡ service `frontend` khỏi `/opt/deploy/docker-compose.yml`, `docker compose rm -sf frontend`.
- [ ] Giữ `Dockerfile` + `nginx.conf` trong repo làm phương án dự phòng (không xoá).
- [ ] Nếu container `frontend` đang giữ port 80/443 mà Tunnel không cần nữa → rà lại Security Group EC2,
      đóng các port không còn dùng.

---

## 7. Checklist nghiệm thu

Chạy trên `https://biliardtournament.cloud`, mở DevTools → Console + Network, **không được có lỗi mixed content**.

- [ ] Trang chủ load, không lỗi console
- [ ] **Deep link**: mở thẳng `https://biliardtournament.cloud/event` và F5 ở trang chi tiết giải → không 404 (kiểm tra `_redirects`)
- [ ] Đăng nhập player thành công, F5 vẫn giữ phiên (`/auth/me` trả 200)
- [ ] Ảnh đại diện / ảnh tin tức hiện được (kiểm tra MinIO qua `cdn.`)
- [ ] Mở trang đăng ký giải → **form tự điền sẵn tên + SĐT từ hồ sơ**, sửa được (tính năng vừa làm)
- [ ] Đăng ký giải **miễn phí** → thành công
- [ ] Đăng ký giải **có phí** → redirect PayOS → thanh toán → quay về `/payment/success` đúng domain
- [ ] Trang trận đấu trực tiếp: WebSocket `wss://api.biliardtournament.cloud/ws` ở tab Network trạng thái **101 Switching Protocols**, tỉ số cập nhật realtime
- [ ] Email tự động nhận được, link trong email trỏ `https://biliardtournament.cloud`

---

## 8. Rollback

| Tình huống | Cách xử lý |
|---|---|
| Bản FE mới lỗi | Pages → **Deployments** → chọn bản trước → *Rollback*. Không cần build lại |
| Cloudflare/Pages có sự cố | Bật lại service `frontend` trong docker-compose trên EC2, trỏ DNS `biliardtournament.cloud` về EC2 IP |
| API không gọi được sau khi đổi domain | Kiểm tra theo thứ tự: mixed content trong Console → CORS header → `sudo journalctl -u caddy -n 50` → `docker logs backend` |
| Đổi `REACT_APP_API_URL` mà không thấy tác dụng | CRA nhúng biến lúc build → phải **Retry deployment**, không đủ nếu chỉ sửa biến |

---

## 9. Nhật ký thay đổi

| Ngày | Người làm | Nội dung |
|---|---|---|
| 2026-08-07 | | Soạn runbook. Thêm `public/_redirects` cho SPA fallback (đã verify build ra `build/_redirects`) |
| 2026-08-07 | | Chốt phương án HTTPS cho BE là **Caddy trên EC2** (không dùng Cloudflare Tunnel). §1.3 viết lại, trỏ sang `infra/deploy-be-https-runbook.md` |
| 2026-08-08 | | BE đã lên HTTPS xong: `https://api.biliardtournament.cloud` trả 200, chứng chỉ Let's Encrypt hợp lệ. §1 hết là điểm chặn |
| 2026-08-08 | | Điền domain thật `biliardtournament.cloud` vào toàn bộ file, bỏ placeholder `<domain>` |
| 2026-08-08 | | Ghi lại bẫy **Worker vs Pages**: lần đầu tạo nhầm Worker (`npx wrangler deploy`, có API token) thay vì Pages, và Cloudflare mặc định điền production branch là `main` trong khi repo deploy từ **`prod`** (`main` cũ hơn `prod` 1 tuần) |
| | | |
