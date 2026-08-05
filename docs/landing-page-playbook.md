# Playbook — Dựng màn hình "có hồn" theo phong cách landing page BTMS

Tài liệu này mổ xẻ landing page vừa làm (`src/pages/Home/`), rút ra hệ thống chuyển động đứng sau nó, và đưa quy trình + prompt để tái lập phong cách đó cho bất kỳ màn hình nào khác trong dự án.

Viết cho người sẽ ra lệnh cho AI agent làm màn hình mới, và cho người review kết quả.

---

## Phần 0 — Vì sao trang cũ trông như "máy dựng"

Trước khi sửa, `Home` có đủ nội dung nhưng vẫn chết cứng. Nguyên nhân không phải thiếu màu hay thiếu ảnh, mà là **không có thời gian**: mọi thứ xuất hiện cùng lúc, ở đúng chỗ, và không phản hồi lại gì cả.

Cụ thể, ba khuyết tật:

1. **Hero rỗng.** `Banner.jsx` chỉ là `<img>` trong khung cao 400px. Không tiêu đề, không CTA, không chiều sâu. Đây là thứ đập vào mắt đầu tiên và nó nói "chưa ai thiết kế trang này".
2. **Không có trật tự xuất hiện.** Cuộn tới đâu nội dung đã nằm sẵn đó. Mắt không được dẫn dắt.
3. **Phản hồi hover yếu tới mức vô hình.** Chỉ có `group-hover:scale-105` trên ảnh — 5% zoom là thứ người dùng không nhận ra.

Bài học chung: **cảm giác "AI dựng" đến từ việc thiếu tầng thời gian, không phải thiếu tầng thị giác.**

---

## Phần 1 — Giải phẫu bản đã sửa

### 1.1 Bốn tầng chuyển động

Trang hoàn chỉnh có bốn tầng, xếp theo thứ tự người dùng gặp:

| Tầng | Khi nào chạy | Ví dụ trong trang | Class |
|---|---|---|---|
| **Ambient** | Liên tục, không cần tương tác | Ken Burns trên ảnh hero, marquee, mũi tên nảy | `hm-kenburns`, `hm-marquee-track`, `hm-bob` |
| **Entrance** | Một lần lúc mount | Eyebrow → tiêu đề → phụ đề → CTA | `hm-rise` + `--i` |
| **Scroll-reveal** | Khi cuộn vào viewport | Từng section, từng card | `hm-reveal`, `hm-reveal-left`, `hm-stagger` |
| **Interaction** | Khi trỏ/focus | Card nhấc, sheen quét, mũi tên trượt, số hạng phóng | `hm-card`, `hm-player`, `hm-sheen`, `hm-arrow`, `hm-title`, `hm-rank`, `hm-cta` |

Thiếu tầng nào cũng thấy được: thiếu ambient thì trang "đứng hình" khi người dùng không làm gì; thiếu interaction thì trang "chết" khi họ có làm gì.

### 1.2 Bảng tra class

Toàn bộ nằm ở `src/pages/Home/home-motion.css`, prefix `hm-`, chỉ import trong `Home/index.jsx`.

| Class | Tác dụng | Đặt ở đâu |
|---|---|---|
| `hm-reveal` | Mờ + dịch lên 24px → rõ | Phần tử nhận `ref` từ `useReveal` |
| `hm-reveal-left` | Trượt vào từ trái 24px | Header section, trong vùng đã `is-in` |
| `hm-stagger` | Con vào lần lượt theo `--i` (70ms/bậc) | **Cha** của card, không bao giờ cùng phần tử với `hm-card` |
| `hm-rise` | Vào lúc mount, delay theo `--i` (90ms/bậc) | Nội dung hero |
| `hm-kenburns` | Zoom 1 → 1.08 trong 18s, đảo chiều | `<img>` nền hero |
| `hm-bob` | Nảy dọc 8px, lặp | Mũi tên chỉ báo cuộn |
| `hm-card` | Nhấc 14px + phóng 1.025 + bóng sâu + viền đỏ | Card (con của `hm-stagger`) |
| `hm-player` | Nhấc 16px + phóng 1.07 + `drop-shadow` | Thẻ tay cơ đã tách nền |
| `hm-sheen` | Vệt sáng quét chéo | Phần tử đã có `overflow-hidden` |
| `hm-cta` | Nhấc 4px + phóng 1.03 + bóng | Nút hero |
| `hm-arrow` | Trượt chéo + đảo màu sang đỏ | Nút `↗` trong `.group` |
| `hm-title` | Đổi màu sang đỏ | Tiêu đề trong `.group` |
| `hm-rank` | Phóng 1.25 từ góc phải trên | Số hạng `#n` |
| `hm-marquee-track--rev` | Marquee chạy ngược chiều | Track của dải xen kẽ |
| `hm-skeleton` | Khung xám shimmer lúc tải | Chỗ giữ nội dung chưa về |
| `ui-underline` | Gạch chân đỏ chạy từ trái | Nav link, footer link, nút text — **ở `global.css`** |
| `ui-icon-lift` | Icon nhấc + chuyển đỏ | Cụm mạng xã hội footer — **ở `global.css`** |
| `hm-accent-bar` | Tăng sáng + bão hoà | Thanh màu dưới ảnh tay cơ |

### 1.3 Hai hook

Cả hai đều trả **callback ref**, không phải ref object — xem bẫy số 4 để hiểu vì sao điều này bắt buộc.

**`useReveal(options)` → `setRef`**

Gắn `is-in` khi phần tử vào viewport rồi `unobserve` ngay. Chạy đúng một lần nên cuộn ngược không làm nội dung nhấp nháy. Không có `IntersectionObserver` (jsdom, trình duyệt cổ) thì gắn `is-in` luôn.

**`useCountUp(target, { duration })` → `{ ref, value }`**

Đếm tăng bằng `requestAnimationFrame` + `easeOutCubic`, chỉ khởi động khi vào viewport. Đọc `matchMedia("(prefers-reduced-motion: reduce)")` và nhảy thẳng đích nếu người dùng đã tắt chuyển động.

### 1.4 Hằng số của hệ thống

Muốn màn hình mới "cùng nhà" với landing page thì phải dùng đúng bộ số này:

```
Easing vào       cubic-bezier(0.22, 1, 0.36, 1)     — giảm tốc mượt, không nảy
Easing nẩy       cubic-bezier(0.34, 1.4, 0.5, 1)    — vượt đà nhẹ, dùng cho hover
Reveal           700ms
Stagger          70ms mỗi bậc
Entrance         800ms, delay 90ms mỗi bậc
Hover            340ms
Sheen            850ms
Nhấc card        -14px, scale 1.025
Nhấc thẻ nổi     -16px, scale 1.07
Nhấc nút         -4px,  scale 1.03
Ken Burns        18s, scale 1 → 1.08, alternate
Marquee          30s, linear, vô hạn
```

---

## Phần 1b — Màn ứng dụng khác trang marketing

Trang chủ là nơi người dùng **ngắm**. Các màn Player/Staff/Manager là nơi họ **làm việc** — vào để xem đăng ký, kiểm lịch thi đấu, chấm điểm. Bê nguyên bộ hiệu ứng của trang chủ sang đó là sai:

- **Hiệu ứng nền chạy liên tục** (Ken Burns, marquee) gây mệt khi người dùng ở lại lâu.
- **Reveal biên độ lớn + stagger chậm** làm cảm giác thao tác nặng nề khi lướt danh sách hằng ngày.
- **Card nhấc 14px** trong lưới dày sẽ va vào nhau, gây nhiễu.

Nên có bộ primitive riêng ở `src/styles/motion.css` (prefix `ui-`, nạp trong `index.js`), biên độ giảm khoảng một nửa:

| | Trang chủ (`hm-`) | Màn ứng dụng (`ui-`) |
|---|---|---|
| Reveal | 24px / 700ms | 18px / 550ms |
| Stagger | 70ms/bậc | 50ms/bậc |
| Card hover | −14px, scale 1.025 | −6px, không scale |
| Hiệu ứng nền | Ken Burns, marquee, sheen | **không có** |

Class có sẵn: `ui-reveal`, `ui-stagger` (+ `ui-stagger--fast` cho danh sách dài), `ui-card`, `ui-row` (dịch ngang 4px, hợp nhịp đọc dọc), `ui-press` (nút, có phản hồi `:active`), `ui-arrow-x`, `ui-modal-panel` / `ui-modal-backdrop`, `ui-skeleton`.

**Hai quy tắc bắt buộc:**

1. **Chặn trần stagger.** `--i` nhân 50ms, danh sách 30 dòng thì dòng cuối đợi 1,5 giây. Luôn kẹp: `style={{ "--i": Math.min(index, 11) }}`.
2. **Không stagger từng ô nhập trong form.** Người dùng vào để điền; ô nhảy vào lần lượt sẽ cản việc điền. Stagger ở mức khối (header / thông báo / card form), không xuống tới field.

Màn thao tác nhanh (chấm điểm trực tiếp, bấm giờ) thì **chỉ dùng `ui-press`** — bỏ hẳn reveal và stagger. Trọng tài cần phản hồi tức thì, không cần nội dung trôi vào.

## Phần 2 — Quy trình 7 bước, kèm prompt

Mỗi bước có prompt copy-paste được. Thay phần trong `<>` bằng nội dung thật.

### Bước 1 — Khảo sát trước khi đề xuất

> Đọc `<đường dẫn màn hình>` và mọi component con của nó. Cho tôi biết: (a) cấu trúc section hiện tại, (b) dữ liệu đến từ đâu — hardcode hay API nào, (c) đã có chuyển động gì chưa, (d) file CSS/biến màu nào đang chi phối. Chưa sửa gì cả, chỉ báo cáo.

Vì sao bước này bắt buộc: phong cách này dựa vào `.group` của Tailwind và biến CSS `--wnt25-*`. Không biết trang đang dùng gì thì mọi class thêm vào đều là đoán.

### Bước 2 — Chốt phạm vi và cường độ

> Tôi muốn `<màn hình>` có chuyển động cùng phong cách landing page (`src/pages/Home/`). Giữ nguyên bố cục, chỉ thêm tầng chuyển động và tinh chỉnh hover. Dùng CSS thuần + `useReveal`/`useCountUp` đã có, **không thêm thư viện**. Trước khi code, đề xuất cho tôi: những section nào nhận reveal, phần tử nào nhận stagger, phần tử nào nhận hover mạnh.

Chốt "không thêm thư viện" ngay từ đầu — nếu không, agent sẽ mặc định đề xuất framer-motion và bạn mất một vòng thương lượng.

### Bước 3 — Dựng file CSS riêng cho màn hình

> Tạo `src/pages/<Tên>/<ten>-motion.css` theo đúng khuôn `src/pages/Home/home-motion.css`: prefix class riêng, chỉ animate `transform`/`opacity`, và **bắt buộc** có khối `@media (prefers-reduced-motion: reduce)` ở cuối đặt `opacity: 1; transform: none` cho mọi class reveal. Import trong file index của màn hình.

**Đừng hiểu nhầm về mức độ cô lập.** CRA gộp mọi `.css` vào một bundle duy nhất (`build/static/css/main.*.css`) — không có CSS Modules cho file `.css` thường. Import ở `Home/index.jsx` **không** ngăn class đó áp dụng cho admin hay player; nó chỉ quyết định file nào chứa khai báo.

Thứ thực sự ngăn xung đột là **prefix class**, không phải vị trí import. File riêng vẫn đáng làm vì hai lý do khác: dễ tìm, và giữ `global.css` khỏi phình ra thành bãi rác.

Hệ quả khi chọn chỗ đặt:

| Loại class | Đặt ở đâu | Ví dụ |
|---|---|---|
| Chỉ một màn hình dùng | File motion riêng của màn hình | `hm-kenburns`, `hm-player` |
| Layout dùng (Header/Footer) hoặc từ hai màn hình trở lên | `src/styles/global.css`, prefix `ui-` | `ui-underline`, `ui-icon-lift` |

Vì Header và Footer nằm ngoài mọi page component, hiệu ứng cho chúng **phải** ở `global.css` — không có file màn hình nào "sở hữu" chúng.

### Bước 4 — Gắn reveal và stagger

> Với mỗi section: cho phần tử gốc nhận `ref` từ `useReveal()`, các card con nhận class stagger kèm `style={{ "--i": index }}`.
>
> **Ràng buộc cứng: class stagger và class hover không bao giờ được đặt trên cùng một phần tử.** Stagger đặt `transition-delay` theo `--i`, delay đó sẽ áp luôn cho hover khiến card càng ở sau càng chậm nhấc lên. Stagger ở cha, hover ở con — nếu cần thì thêm một `<div>` bọc.

### Bước 5 — Tầng hover

> Thêm hover theo đúng biên độ của landing page: card nhấc `-14px` scale `1.025` kèm bóng sâu và viền `var(--wnt25-color-red)`; ảnh zoom `scale-110` trong 500ms; nút `↗` trượt chéo và đảo sang nền đỏ; tiêu đề đổi sang đỏ. Với ảnh người đã tách nền thì dùng `drop-shadow` thay `box-shadow` để bóng bám theo hình chứ không bám khung chữ nhật, và nâng `z-index` để thẻ nổi khỏi lưới.

### Bước 6 — Nối dữ liệu thật

> Thay số/nội dung hardcode bằng API. Chỉ dùng endpoint **public** (không có tiền tố `/owner`, `/manager`, `/admin`, `/staff`) vì màn này người chưa đăng nhập cũng xem được. Dùng `Promise.allSettled` để một endpoint hỏng không xoá cả khối, và ẩn khối khi không có dữ liệu thay vì hiện số 0. Nếu không có endpoint nào cấp được con số tôi yêu cầu, **báo lại và đề xuất chỉ số thay thế đếm được thật** — tuyệt đối không bịa số.

Câu cuối là câu quan trọng nhất trong cả playbook. Số bịa trên trang chủ là thứ đi thẳng vào buổi demo.

### Bước 7 — Nghiệm thu

> Chạy `npm run build` và báo cáo mọi cảnh báo phát sinh ở file vừa sửa. Sau đó mở trang thật trên trình duyệt và xác minh: reveal chạy đúng một lần khi cuộn, không phần tử nào kẹt mờ, hover đúng biên độ, `scrollWidth === clientWidth` (không tràn ngang), console không có lỗi từ trang. Kiểm ở **cả light lẫn dark**. Báo rõ cái gì đã xác minh và cái gì chưa.

---

## Phần 3 — Mười một cái bẫy

Tất cả đều gặp thật khi làm landing page này, không phải liệt kê lý thuyết.

### 1. Animation ghi đè `transform` của Tailwind

`hm-bob` có keyframes đặt `transform: translateY(...)`. Phần tử cũng mang `-translate-x-1/2` để căn giữa. Animation thắng, phần tử lệch sang trái.

Cùng lỗi với `hm-kenburns` và `scale-105`.

> **Cách xử lý:** một phần tử chỉ được có một nguồn `transform`. Cần hai hiệu ứng thì bọc hai lớp: lớp ngoài căn vị trí, lớp trong chạy animation.

### 2. `transition-delay` của stagger rò sang hover

`.is-in .hm-stagger { transition-delay: calc(var(--i) * 70ms) }` áp cho **mọi** transition của phần tử đó. Card thứ tư sẽ đợi 210ms mới nhấc lên khi hover — cảm giác lag mà không rõ vì sao.

> **Cách xử lý:** tách lớp. Đây là lý do `hm-player` nằm trên `<div>` bọc riêng chứ không nằm cùng `hm-stagger`.

### 3. `.hm-reveal-left` không bao giờ sáng

Hook chỉ gắn `is-in` lên **phần tử mang ref**. Nếu CSS chỉ có `.hm-reveal-left.is-in` thì phần tử con không bao giờ khớp.

> **Cách xử lý:** viết cả hai dạng — `.hm-reveal-left.is-in` (tự nó có ref) **và** `.is-in .hm-reveal-left` (nằm trong vùng đã reveal).

### 4. Observer không bao giờ được gắn khi component render có điều kiện

Đây là bẫy nguy hiểm nhất trong danh sách, vì triệu chứng của nó là **trang trắng trơn** chứ không phải một lỗi nhỏ.

Kịch bản: component tải dữ liệu, lúc `loading` thì `return` sớm ra nhánh skeleton. Nhánh đó không mang `ref`. Nếu hook gắn observer trong `useEffect` chạy một lần lúc mount, thì lúc đó `ref.current === null`, effect thoát sớm, **observer không bao giờ được tạo**. Tải xong, ref mới gắn vào node thật nhưng effect không chạy lại → không ai gắn `is-in` → toàn bộ nội dung kẹt ở `opacity: 0` vĩnh viễn.

Đây chính xác là chuyện đã xảy ra khi nối News/Schedule/Ranked vào API: build sạch, console sạch, không lỗi nào — mà trang trắng.

> **Cách xử lý:** hook trả về **callback ref**, không phải ref object. React gọi callback đúng lúc node vào/ra DOM nên trường hợp render có điều kiện được xử lý tự nhiên. Cả `useReveal` và `useCountUp` trong dự án đều theo pattern này — đừng đổi ngược lại.

```js
const setRef = useCallback((node) => {
  observerRef.current?.disconnect();
  if (!node) return;
  const observer = new IntersectionObserver(/* ... */);
  observer.observe(node);
  observerRef.current = observer;
}, [threshold, rootMargin]);
```

Hệ quả cần nhớ: **thêm skeleton vào một component đang dùng scroll-reveal là thay đổi có rủi ro**, không phải việc trang trí vô hại. Luôn kiểm lại bằng mắt sau khi thêm.

### 5. Nội dung kẹt vô hình

Reveal đặt `opacity: 0` bằng CSS và trông chờ JS gỡ ra. JS lỗi, observer không chạy, hoặc môi trường không có `IntersectionObserver` → nội dung biến mất vĩnh viễn.

> **Cách xử lý:** hook phải gắn `is-in` ngay khi thiếu `IntersectionObserver`, và khối reduced-motion phải đặt `opacity: 1 !important`.

### 6. `mx-auto` không có `w-full`

`Schedule` từng có `<div className="mx-auto grid ...">`. Grid không chiếm hết chiều ngang nên co lại rồi tự căn giữa — nhìn như bị "bo vào trong" so với các section khác.

> **Cách xử lý:** grid/flex con của một container đã căn giữa thì cần `w-full`, không cần `mx-auto` lần nữa.

### 7. Padding ngang không đồng bộ giữa các section

Ba section từng dùng `px-6`, `p-6`, `px-16`. Từng cái nhìn riêng đều ổn, ghép lại thì lệch hàng và trông cẩu thả.

> **Cách xử lý:** chốt một cặp giá trị cho cả trang (`px-6 md:px-16`) và kiểm bằng cách đo `getBoundingClientRect().left` của tiêu đề từng section — phải bằng nhau.

### 8. Link tới route không tồn tại

CTA hero suýt trỏ tới "Bảng xếp hạng". Nhưng `RankingTab` chỉ render bên trong `/event/:id` và còn phụ thuộc cờ `tournament.isPublicRatio` — **không có trang xếp hạng toàn cục**.

> **Cách xử lý:** mọi đích điều hướng phải đối chiếu `src/constants/routes.js` trước khi viết. Route public cấp một hiện có: `/`, `/news`, `/news/:slug`, `/event`, `/event/:id`, `/branches`, `/branches/:id`, `/login`, `/register`, `/forgot-password`, `/profile`.

### 9. Gọi nhầm endpoint cần quyền

`analyticsApi` và `dashboardApi` đều có tiền tố `/owner` hoặc `/manager`. Gọi từ trang public thì khách chưa đăng nhập nhận 401, và interceptor trong `axiosClient` sẽ **đá họ về `/login`**.

> **Cách xử lý:** trang public chỉ dùng endpoint không có tiền tố vai trò. Xem bảng ở Phần 4.

### 10. `threshold` quá cao cho section cao

`IntersectionObserver` với `threshold: 0.15` trên một section cao 1500px cần 225px lọt viewport mới kích hoạt. Trên màn hình thấp, người dùng sẽ thấy khoảng trắng trước khi nội dung hiện.

> **Cách xử lý:** giữ `threshold` thấp (0.1–0.15) và bù bằng `rootMargin` âm ở đáy (`0px 0px -10% 0px`) để kích hoạt sớm hơn là muộn.

### 11. `will-change` rải khắp nơi

`will-change: transform` tạo layer riêng trên GPU. Đặt cho 50 card là 50 layer, ăn VRAM và làm cuộn giật trên máy yếu.

> **Cách xử lý:** chỉ đặt cho phần tử animate **liên tục** — trong trang này là ảnh Ken Burns và track marquee. Hover và reveal không cần.

---

## Phần 4 — Lưu ý về backend

### 4.1 Bao bì response

Mọi endpoint trả về `ApiResponse`, dữ liệu thật nằm ở `response.data.data`. Luôn bóc qua `getApiData` (`src/utils/apiError.js`) — **không đọc `res.data` trực tiếp**.

Endpoint danh sách trả Spring `Page`. Luôn chuẩn hoá bằng `parsePagedResponse` (`src/utils/pagination.js`) vì BE có lúc trả `page`, có lúc `number`, có lúc mảng trần.

```js
const unwrap      = (p) => p.then((res) => getApiData(res));
const unwrapPaged = (p, size) => p.then((res) => parsePagedResponse(getApiData(res), size));
```

Sau khi chuẩn hoá luôn có: `{ content, page, size, totalElements, totalPages, first, last, numberOfElements }`.

### 4.2 Mẹo lấy số đếm rẻ

Cần **số lượng** chứ không cần bản ghi thì gọi `size=1` và chỉ đọc `totalElements`. BE vẫn trả metadata phân trang đầy đủ. Đây là cách dải số liệu hero hoạt động — bốn con số thật với bốn request cực nhẹ.

### 4.3 Endpoint public dùng được cho trang không cần đăng nhập

| Việc | Hàm | Đường dẫn |
|---|---|---|
| Danh sách giải | `listPublicTournaments(params)` | `GET /tournaments` |
| Chi tiết giải | `getPublicTournamentDetail(id)` | `GET /tournaments/:id` |
| Xếp hạng trong giải | `getPublicTournamentRankings(id)` | `GET /tournaments/:id/rankings` |
| Hồ sơ tay cơ | `getParticipantProfile(id)` / `getPlayerProfileByUserId(userId)` | `GET /participants/...` |
| Danh sách chi nhánh | `listPublicBranches(params)` | `GET /branches` |
| Chi tiết chi nhánh | `getPublicBranchDetail(id)` | `GET /branches/:id` |
| Tin đã đăng | `listPublishedPosts(params)` | `GET /news` |
| Bài theo slug | `getPostBySlug(slug)` | `GET /news/:slug` |
| Chuyên mục tin | `listPublicCategories()` | `GET /news/categories` |
| Trận trong giải | `getPublicMatches(tournamentId)` | `GET /tournaments/:id/matches` |
| Vòng đấu | `getPublicStages(tournamentId)` | `GET /tournaments/:id/stages` |

### 4.4 Attribute thật của các entity chính

Lấy từ code đang chạy, không phải từ tài liệu.

**Tournament** (dùng ở `Event/index.jsx`)

`id`, `name`, `status`, `startAt`, `endAt`, `gameType`, `formatName`, `thumbnailUrl`, `maxParticipants`, `approvedCount`, `isPublicRatio`

**News post** (dùng ở `News/NewsListPage.jsx`)

`id`, `title`, `slug`, `thumbnailUrl`, `categoryName`, `publishedAt`

**Branch** (dùng ở `Branch/index.jsx`)

`id`, `name`, `address`, `phone`, `description`, `thumbnailUrl`

### 4.5 Enum trạng thái giải

Nguồn: `src/constants/tournamentConfig.js`. Dùng làm giá trị cho tham số `status`.

`DRAFT`, `OPEN_FOR_REGISTRATION`, `REGISTRATION_CLOSED`, `DRAW_PREVIEW`, `DRAW_DONE`, `FINAL_BRACKET_READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`

Nhãn tiếng Việt đã có sẵn ở `TOURNAMENT_STATUS_LABELS` — **đừng viết lại chuỗi tiếng Việt trong component**.

### 4.6 Ba cái bẫy đặc thù của BE này

1. **Interceptor 401 sẽ điều hướng.** `axiosClient` gặp 401 là gọi `logout()` rồi `window.location.href = "/login"`, trừ khi đang ở `/login`, `/register`, `/forgot-password` hoặc `/live/*`. Một request thừa cần quyền trên trang public sẽ **đá khách ra khỏi trang**. Đây là hậu quả nặng nhất trong danh sách này.
2. **`REACT_APP_API_URL` có thể không được đặt.** Mặc định là `http://localhost:8080`. Máy không chạy BE thì mọi request fail — giao diện phải chịu được điều đó, không được vỡ layout hay hiện `NaN`.
3. **Ảnh có thể `null`.** `thumbnailUrl` không được bảo đảm. Luôn có ảnh dự phòng, vì `<img>` hỏng trong card đã `overflow-hidden` sẽ để lại một mảng trống rất xấu.

---

## Phần 5 — Bổ sung nên có cho landing page

Xếp theo tỉ lệ giá trị trên công sức.

### Nên làm sớm

**`<img loading="lazy">` cho ảnh dưới màn đầu.** Trang này nhiều ảnh lớn; ảnh hero thì để `eager`, còn lại lazy.

**Cờ quốc gia hiển thị theo dữ liệu thật.** Hiện `rankingEnums.DEFAULT_COUNTRY` hardcode Việt Nam vì API xếp hạng chưa trả field quốc tịch. Khi BE bổ sung thì thay ở đây. Lưu ý phụ: Windows không có font emoji cờ quốc gia nên `🇻🇳` hiện thành chữ `VN` — đó là hạn chế nền tảng, không phải lỗi code; macOS/iOS/Android hiện đúng.

**Phân trang hoặc "xem thêm" cho News.** Đang lấy cứng 5 bài đầu.

*(Đã xong: nối News/Schedule/Ranked/Marquee vào API thật, skeleton lúc tải, trạng thái rỗng.)*

### Đáng cân nhắc

**Đếm ngược tới giải gần nhất.** Lấy `startAt` của giải `OPEN_FOR_REGISTRATION` sớm nhất, hiện `còn 3 ngày 4 giờ`. Rất hợp với trang giải đấu và tận dụng đúng field đã có.

**Dải "đang diễn ra" nối WebSocket.** Dự án đã có `useTournamentSocket`. Một dải tỉ số cập nhật trực tiếp trên trang chủ là điểm nhấn mạnh hơn mọi animation.

**Ảnh hero đổi theo giải nổi bật** thay vì ảnh tĩnh — dùng `thumbnailUrl` của giải đang diễn ra.

### Cân nhắc kỹ trước khi làm

**Parallax nhiều lớp.** Hiện chỉ một lớp. Thêm nữa thì tốn CPU và dễ giật trên máy yếu.

**Con trỏ tuỳ biến / hiệu ứng magnetic.** Trông ấn tượng trong demo nhưng phá trải nghiệm trên thiết bị cảm ứng và gây khó cho người dùng bàn phím.

---

## Phần 6 — Checklist nghiệm thu

Trước khi coi màn hình là xong:

**Chuyển động**
- [ ] Đủ bốn tầng: ambient, entrance, scroll-reveal, interaction
- [ ] Reveal chạy đúng một lần; cuộn ngược không nhấp nháy
- [ ] Không phần tử nào kẹt ở `opacity: 0`
- [ ] Không phần tử nào mang hai nguồn `transform`
- [ ] Không phần tử nào vừa `hm-stagger` vừa class hover

**Khả năng tiếp cận**
- [ ] Có khối `prefers-reduced-motion` và đã thử bằng DevTools
- [ ] Nội dung chữ trên ảnh đạt tương phản ≥ 4.5:1
- [ ] CTA là `<Link>`/`<a>` thật, tab tới được, có `focus-visible`
- [ ] Phần tử trang trí (marquee, mũi tên) có `aria-hidden="true"`

**Dữ liệu**
- [ ] Không còn số hoặc nội dung bịa
- [ ] Chỉ gọi endpoint public
- [ ] Có trạng thái tải, rỗng, và lỗi
- [ ] Ảnh có dự phòng khi `thumbnailUrl` null

**Kỹ thuật**
- [ ] `npm run build` không thêm cảnh báo mới
- [ ] `scrollWidth === clientWidth` (không tràn ngang)
- [ ] Console sạch lỗi từ trang
- [ ] Đúng ở cả light và dark
- [ ] Class riêng của màn hình nằm ở file motion của màn hình; class dùng chung (`ui-`) ở `global.css`
- [ ] Mọi class đều có prefix — đây mới là thứ ngăn xung đột, không phải vị trí import
- [ ] `will-change` chỉ đặt cho animation chạy liên tục

---

## Phụ lục — Prompt một phát cho màn hình mới

Dùng khi muốn giao trọn gói thay vì đi từng bước:

> Làm `<màn hình>` có chuyển động cùng phong cách landing page tại `src/pages/Home/`.
>
> **Đọc trước:** `docs/landing-page-playbook.md`, `src/pages/Home/home-motion.css`, `src/hooks/useReveal.js`, `src/hooks/useCountUp.js`.
>
> **Yêu cầu:** giữ nguyên bố cục hiện có; đủ bốn tầng chuyển động (ambient / entrance / scroll-reveal / interaction); CSS thuần trong file riêng của màn hình với prefix class riêng; tái dùng `useReveal` và `useCountUp`, không thêm thư viện; tôn trọng `prefers-reduced-motion`.
>
> **Ràng buộc cứng:** class stagger và class hover không được đặt cùng phần tử; một phần tử chỉ có một nguồn `transform`; chỉ gọi endpoint public; đối chiếu `src/constants/routes.js` trước khi viết bất kỳ đích điều hướng nào; **không bịa số liệu** — không có API cấp được thì báo lại và đề xuất chỉ số thay thế.
>
> **Nghiệm thu:** chạy `npm run build`, mở trang thật kiểm ở cả light và dark, rồi báo rõ cái gì đã xác minh và cái gì chưa.
