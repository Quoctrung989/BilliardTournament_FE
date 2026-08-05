# Dữ liệu mẫu (Trang chủ + Tin tức) — cần thay bằng dữ liệu thật

**Cập nhật:** 2026-07-31
**File cần gỡ:** `src/constants/demoData.js`
*(trước ở `src/pages/Home/homeDemoData.js`, đã chuyển ra `constants/` khi trang
Tin tức cũng cần dùng — nếu tìm theo tên cũ sẽ không thấy)*

## Tình trạng

Các trang public đã nối API thật cho **tất cả** khối. Khi một khối không có bản
ghi nào, nó dựng dữ liệu mẫu để UI không trống.

Kiểm tra thực tế 2026-07-31 (BE chạy ở `localhost:8080`):

| Endpoint | totalElements | Khối dùng | Đang chạy |
|---|---|---|---|
| `GET /tournaments` | **8** | Lịch thi đấu, 2 marquee, số liệu hero, `/event` | ✅ THẬT |
| `GET /branches` | **2** | Số liệu hero | ✅ THẬT |
| `GET /tournaments/:id/rankings` | có entries | Top tay cơ | ✅ THẬT |
| `GET /news` | **0** | Tin tức (trang chủ) + `/news` + marquee "TIN MỚI" | ⚠️ **MẪU** |
| `GET /news/categories` | 0 | Chip lọc ở `/news` | ⚠️ **MẪU** |

**Việc cần làm: đăng bài thật qua CMS** (`/manager/news` hoặc `/owner/news`
→ tạo → **Publish**). `GET /news` chỉ trả bài đã publish; bài nháp/ẩn không tính.
Có bài thật thì khối tự chuyển sang dữ liệu thật, không cần sửa code.

## Nơi đang dùng

- `src/pages/Home/components/` — News, Schedule, Ranked, Marquee, Banner
- `src/pages/News/NewsListPage.jsx` — bài viết + chuyên mục

## Cách hoạt động

`withDemo(real, demo, block)`:
- Có dữ liệu thật (mảng khác rỗng) → **luôn** dùng dữ liệu thật
- Rỗng hoặc API lỗi → dùng mẫu + `console.warn` một lần nêu tên khối
- **Không bao giờ trộn** hai nguồn trong cùng một khối

Riêng `/news`: khi chạy mẫu, bộ lọc chuyên mục và ô tìm kiếm được lọc
**client-side** qua `filterDemoPosts` — nếu không, bấm chuyên mục sẽ gọi API rỗng
rồi lại rơi về mẫu đầy đủ và bộ lọc trông như hỏng.

Nhận biết đang xem mẫu: DevTools Console → tìm dòng
`[Trang chủ] Khối "..." đang hiển thị DỮ LIỆU MẪU`.

Tên tay cơ mẫu cố ý đặt "Cơ Thủ Số Một/Hai/..." để không nhầm với người thật.

## Cách gỡ

1. Tạm tắt: `DEMO_ENABLED = false` trong `demoData.js`.
2. Gỡ hẳn: xoá file và bỏ mọi lời gọi `withDemo` ở 6 file kể trên.

**Phải gỡ trước khi bàn giao / lên production** — dữ liệu mẫu nhìn y hệt dữ liệu
thật trên UI, không có nhãn cảnh báo nào cho người dùng cuối.

## Liên quan

- Playbook phong cách + attribute BE: `docs/landing-page-playbook.md`
- Spec thiết kế ban đầu: `docs/superpowers/specs/2026-07-31-landing-page-motion-design.md`
- Khối "Top tay cơ" lấy xếp hạng giải gần nhất (ưu tiên `COMPLETED`, không có thì
  `IN_PROGRESS`) vì hệ thống **chưa có bảng xếp hạng toàn cục** — mục "Bảng Xếp
  Hạng" trên header vẫn là `path: null`.
