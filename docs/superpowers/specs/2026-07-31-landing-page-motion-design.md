# Landing page — chuyển động & tinh chỉnh thị giác

Ngày: 2026-07-31
Trạng thái: đã triển khai

> **Đã thay đổi so với spec này sau khi triển khai** — spec giữ nguyên làm hồ sơ thiết kế ban đầu, phần khác biệt ghi ở đây:
> - Dải số liệu hero **không còn hardcode**: lấy thật từ `GET /tournaments` và `GET /branches` (`size=1`, đọc `totalElements`). Hai ô "Tay cơ" / "Trận đã đấu" đổi thành "Đang diễn ra" / "Đã hoàn thành" vì không có endpoint public nào tổng hợp được hai con số đó.
> - Bỏ ảnh nền sọc ở light mode, dùng nền trắng trơn.
> - Padding ngang ba section thống nhất `px-6 md:px-16`.
> - Biên độ hover nâng mạnh hơn spec, thêm `hm-sheen` và `hm-cta`.
>
> Tài liệu sống để làm màn hình mới theo phong cách này là `docs/landing-page-playbook.md`.

## Vấn đề

Landing page (`src/pages/Home/`) hiện đứng yên hoàn toàn. `Banner.jsx` là một thẻ `<img>` trần trong khung cao 400px, không tiêu đề, không CTA. `News`, `Schedule`, `Ranked` chỉ có duy nhất `group-hover:scale-105` trên ảnh. Không có chuyển động khi cuộn, không có trật tự xuất hiện, không có điểm nhấn thị giác. Kết quả: trang đọc như một khung sườn dựng sẵn chứ không như sản phẩm có người thiết kế.

## Mục tiêu

Trang chủ có nhịp chuyển động rõ ràng — nội dung xuất hiện theo trật tự khi cuộn, hero có điểm nhấn động, tương tác hover có phản hồi — mà không thêm dependency, không đổi dữ liệu, không đổi layout hiện có.

## Ngoài phạm vi

- Nối API cho News / Schedule / Ranked (dữ liệu vẫn hardcode như hiện tại).
- Đổi `routes.js`, `tailwind.config.js`, hay bất kỳ trang nào ngoài `src/pages/Home/`.
- Thiết kế lại bố cục các section.

## Quyết định kỹ thuật

**CSS thuần + IntersectionObserver, không thêm thư viện.** `package.json` hiện không có thư viện motion nào; `AGENTS.md` ghi rõ repo hạn chế thêm công cụ mới. framer-motion sẽ thêm ~35KB gzip cho nhu cầu mà `@keyframes` + `IntersectionObserver` đáp ứng đủ.

**CSS đặt trong file riêng của Home, không vào `global.css`.** `global.css` nạp cho toàn app; thêm keyframes ở đó là rò rỉ style sang admin/player. `src/pages/Home/home-motion.css` chỉ được import bởi `Home/index.jsx`.

**Mọi class prefix `hm-`** (home motion) để không đụng tên với `admin.css`, `tvLive.css`, `eventTheme.css`.

## Kiến trúc

### File mới

| File | Vai trò | Phụ thuộc |
|---|---|---|
| `src/pages/Home/home-motion.css` | `@keyframes` + utility class chuyển động | không |
| `src/hooks/useReveal.js` | Trả `ref`; gắn class `is-in` khi phần tử vào viewport | không |
| `src/hooks/useCountUp.js` | Trả `{ ref, value }`; đếm tăng khi vào viewport | không |
| `src/pages/Home/components/Marquee.jsx` | Dải chữ chạy ngang ngăn giữa 2 section | `home-motion.css` |

### File sửa

| File | Thay đổi |
|---|---|
| `src/pages/Home/components/Banner.jsx` | Viết lại thành hero có overlay, CTA, dải thống kê |
| `src/pages/Home/components/News.jsx` | Bọc class reveal + stagger, tinh chỉnh hover |
| `src/pages/Home/components/Schedule.jsx` | Bọc class reveal + stagger, tinh chỉnh hover |
| `src/pages/Home/components/Ranked.jsx` | Bọc class reveal + stagger, hover viền accent |
| `src/pages/Home/index.jsx` | Import `home-motion.css`, chèn `<Marquee />` |

### Hợp đồng `useReveal`

```js
const ref = useReveal(options)
```

- `options.threshold` (mặc định `0.15`) — tỉ lệ phần tử phải lọt viewport.
- `options.rootMargin` (mặc định `"0px 0px -10% 0px"`) — kích hoạt hơi sớm trước khi chạm đáy màn hình.
- Gắn `is-in` vào `ref.current` khi giao cắt, rồi `unobserve` phần tử đó — chạy đúng một lần, không nhấp nháy khi cuộn ngược.
- `disconnect()` trong hàm dọn dẹp của `useEffect`.
- Nếu `IntersectionObserver` không tồn tại (môi trường test/jsdom), gắn `is-in` ngay lập tức.

Phần tử dùng hook đặt class nền `hm-reveal`; CSS định nghĩa trạng thái đầu (mờ, dịch xuống) và trạng thái `.hm-reveal.is-in` (rõ, về vị trí).

### Hợp đồng `useCountUp`

```js
const { ref, value } = useCountUp(target, { duration = 1600 })
```

- Không chạy cho tới khi phần tử vào viewport (dùng chung cơ chế observer với `useReveal`).
- `requestAnimationFrame` + easing `easeOutCubic`.
- Nếu `matchMedia("(prefers-reduced-motion: reduce)").matches` → trả thẳng `target`, không animate.
- Huỷ rAF khi unmount.

### Stagger

Không cần hook. Phần tử cha nhận `ref` từ `useReveal`; mỗi con đặt `style={{ "--i": index }}` và CSS tính:

```css
.hm-reveal.is-in .hm-stagger { transition-delay: calc(var(--i, 0) * 70ms); }
```

## Thiết kế từng phần

### Hero (`Banner.jsx`)

Cấu trúc: khung `relative min-h-[440px] md:min-h-[560px]` chứa 3 lớp chồng — ảnh nền, overlay gradient, nội dung.

- **Ảnh nền**: `object-cover` + animation Ken Burns (`scale(1)` → `scale(1.08)`, 18s, `alternate`, `ease-in-out`) và parallax dịch dọc theo scroll.
- **Parallax**: listener `scroll` với cờ rAF (không chạy quá 1 lần/frame), đặt `transform: translate3d(0, Ypx, 0)` với `Y = min(scrollY * 0.25, 120)`. Gỡ listener khi unmount. Tắt khi reduced-motion.
- **Overlay**: gradient từ đen 70% ở đáy/trái sang trong suốt — bảo đảm tương phản chữ ở cả light lẫn dark, vì ảnh nền không đổi theo theme.
- **Nội dung** vào lúc mount theo trật tự 0 / 90 / 180 / 260ms:
  1. Eyebrow: `CAPSTONE • MÙA GIẢI 2026`
  2. `<h1>` in hoa, đậm, cỡ lớn
  3. Phụ đề một dòng
  4. Hai CTA: `Xem giải đấu` (đặc, màu `--wnt25-color-red`) → `/event`; `Hệ thống chi nhánh` (viền) → `/branches`
- **Dải thống kê** dưới nội dung: 4 ô dùng `useCountUp` — Giải đấu, Tay cơ, Trận đã đấu, Chi nhánh. Con số hardcode, đồng bộ với việc phần còn lại của trang cũng hardcode.
- **Chỉ báo cuộn**: mũi tên nảy nhẹ ở đáy giữa, lặp vô hạn, biên độ nhỏ.

Hai CTA dùng `<Link>` của `react-router-dom`. Đích lấy từ `src/constants/routes.js`: các route public cấp một hiện có là `/event`, `/news`, `/branches`. **Không có route bảng xếp hạng toàn cục** — `RankingTab` chỉ render bên trong `/event/:id` khi `tournament.isPublicRatio` bật, nên CTA thứ hai trỏ `/branches` thay vì bảng xếp hạng.

### News / Schedule / Ranked

Không đổi cấu trúc DOM ngoài việc thêm class và `style={{ "--i": index }}`.

- Header section: trượt vào từ trái (`translateX(-24px)` → `0`).
- Lưới card: fade + `translateY(24px)` → `0`, stagger 70ms theo `--i`.
- Hover card: nâng `translateY(-6px)`, đổ bóng sâu hơn, chuyển tiếp 280ms.
- Hover nút `↗`: trượt chéo `translate(2px, -2px)`, đảo màu nền/chữ.
- Hover tiêu đề: đổi sang `--wnt25-color-red`.
- `Ranked` bổ sung: viền accent dưới ảnh chạy gradient khi hover; số hạng `#n` phóng nhẹ.

### Marquee

Dải cao ~44px, nền `--wnt25-color-dark`, chữ sáng in hoa, đặt giữa `Schedule` và `Ranked`. Danh sách tên giải lặp hai lần trong track để cuộn liền mạch; animation `translateX(0)` → `translateX(-50%)`, 30s, tuyến tính, vô hạn. `:hover` đặt `animation-play-state: paused`. Ẩn hoàn toàn khi reduced-motion.

## Hiệu năng

- Chỉ animate `transform` và `opacity` — cả hai chạy trên compositor, không gây reflow.
- `will-change: transform` chỉ đặt trên phần tử Ken Burns và track marquee, không rải toàn trang.
- Một `IntersectionObserver` cho mỗi phần tử reveal, `unobserve` ngay sau lần kích hoạt đầu.
- Parallax là listener `scroll` duy nhất của trang, đã throttle bằng rAF.

## Khả năng tiếp cận

Khối `@media (prefers-reduced-motion: reduce)` cuối `home-motion.css`:

- `.hm-reveal` → `opacity: 1; transform: none;` (không thể kẹt ở trạng thái vô hình nếu observer lỗi).
- Ken Burns, marquee, nảy, parallax → `animation: none`.
- `useCountUp` trả thẳng giá trị đích.

Chữ trên hero phải đạt tương phản tối thiểu 4.5:1 nhờ overlay gradient. CTA là `<Link>` thật, tới được bằng bàn phím, có `focus-visible` rõ ràng.

## Kiểm thử

Không có bộ test UI cho trang này và spec không thêm logic nghiệp vụ, nên xác minh theo các bước sau:

1. `npm run build` — không lỗi, không cảnh báo mới.
2. Mắt thường ở light mode và dark mode: hero, ba section, marquee.
3. Cuộn từ đầu tới cuối: mỗi section xuất hiện đúng một lần, không phần tử nào kẹt mờ.
4. Bật "Emulate prefers-reduced-motion" trong DevTools, tải lại: nội dung hiển thị đầy đủ, không chuyển động.
5. Thu hẹp còn 375px: hero không tràn ngang, dải thống kê xuống hàng gọn.
6. Tab bàn phím qua hero: hai CTA nhận focus với viền rõ.

## Rủi ro

| Rủi ro | Giảm thiểu |
|---|---|
| Observer không chạy trong jsdom nếu sau này viết test | Hook gắn `is-in` ngay khi thiếu `IntersectionObserver` |
| Nội dung kẹt vô hình nếu JS lỗi | Khối reduced-motion đặt `opacity: 1`; ngoài ra reveal chỉ dùng `opacity`/`transform`, nội dung vẫn nằm trong DOM và đọc được bởi trình đọc màn hình |
| Chữ hero khó đọc trên ảnh sáng | Overlay gradient tối cố định, không phụ thuộc theme |
| Tên class đụng CSS khác | Prefix `hm-` và file chỉ import trong Home |
