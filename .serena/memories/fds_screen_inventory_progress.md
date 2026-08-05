# FDS Screen Inventory — TIẾN ĐỘ & QUYẾT ĐỊNH ĐÃ CHỐT

> ⚠️ **TẠM DỪNG (2026-07-28)** — trọng tâm hiện tại là app mobile. Xem cảnh báo trong
> `fds_screen_inventory_task`: danh sách màn cần bổ sung Branch / Live TV / Public StaffList.

> Cập nhật 2026-07-08. Bổ sung cho `mem:fds_screen_inventory_task`. Đọc cả 2 file.

## QUYẾT ĐỊNH ĐÃ CHỐT VỚI USER (không hỏi lại)
1. **Ngôn ngữ:** viết mục 3 bằng **TIẾNG ANH** (khớp template). UI strings thật của app giữ nguyên tiếng Việt trong ngoặc kép “...” (vd “Đăng ký”, “Tìm giải đấu...”).
2. **Kiểu bảng:** ĐƠN GIẢN — `<table border="1">`, nhãn/tiêu đề cột in đậm, nền trắng. KHÔNG dùng header nền đậm như template.
3. **FT-ID/UC-ID:** để placeholder `FT-xx` / `UC-xx`.
4. **Không đụng** vào block user đã làm: **SCR-01 Home** (Done) và **SCR-02 Login** (header xong, UI Components trống). Giữ luôn các block template cũ (user chọn "chèn thêm, giữ block cũ").
5. **Scheme đánh số (user duyệt)** — bám theo các tham chiếu trong block Home user đã làm:
   - 01 Home(user) · 02 Login(user) · 03 Register · 04 Forgot password · 05 Profile(hồ sơ cá nhân) · 06 News List · 07 Article Detail · 08 Tournament List (public /event) · 09 Tournament Detail (public /event/:id) · 10 Player Profile (/event/players/:id) · 11 Staff Profile (/staffProfile/:slug) · 12 Admin Dashboard ... → tiếp tục 12-38 theo `mem:fds_screen_inventory_task` mục 5 (dịch số: routes cũ SCR-12→SCR-12 vẫn Admin Dashboard; về cơ bản các màn admin/owner/manager/staff/player giữ số như bảng cũ vì cũ cũng bắt đầu Admin ở 12).

### Map số đầy đủ (01-38)
01 Home✅user · 02 Login user · 03 Register · 04 Forgot · 05 Profile · 06 News List · 07 Article Detail · 08 Tournament List(pub) · 09 Tournament Detail(pub) · 10 Player Profile · 11 Staff Profile · 12 Admin Dashboard · 13 Quản lý tài khoản · 14 Thể thức giải · 15 Wizard thể thức · 16 Loại bi · 17 Config field catalog · 18 Registration field catalog · 19 Registration form template list · 20 Wizard template form · 21 Dashboard(Owner/Manager) · 22 Quản lý nhân viên · 23 DS giải(quản lý) · 24 Wizard giải · 25 Chi tiết giải(quản lý) · 26 Đăng ký giải(duyệt) · 27 Người tham gia · 28 Bốc thăm & Lịch đấu · 29 News CMS · 30 Soạn bài viết · 31 Staff Dashboard · 32 DS giải(Player) · 33 Chi tiết giải(Player) · 34 Đăng ký thi đấu · 35 Đăng ký của tôi · 36 Thanh toán của tôi · 37 Lịch thi đấu của tôi · 38 Kết quả thanh toán

## CÁCH ĐIỀN (đã kiểm chứng — RẤT hiệu quả)
- Doc mở bằng Claude Chrome, tab tài khoản thinhwtf55@gmail.com, có quyền sửa.
- **Phương pháp = clipboard HTML paste** (KHÔNG gõ tay bảng):
  1. Định vị cuối mục 3: click outline "4. External API Inventory" → con trỏ nhảy tới heading đó → key `Left` (về cuối đoạn trước) → key `Return` (tạo dòng trống style "Văn bản thường").
  2. `javascript_tool`: `navigator.clipboard.write([new ClipboardItem({'text/html':Blob,'text/plain':Blob})])` với HTML gồm `<hr>`+`<p><strong>SCR-xx — Name</strong></p>`+`<table border="1">`(Who/FT/UC/Purpose)+`<p><strong>UI Components</strong></p>`+`<table>`+`<p><strong>Navigation Flow</strong></p><ul>`+`<p><strong>Display Conditions</strong></p><ul>`+`<p><strong>Status:</strong> 🔄 In development · Sprint {{SPRINT}} · Tester: {{TESTER}} · Sign-off: {{SIGNOFF}}</p>`.
  3. `computer` key `ctrl+v` → Google Docs dán ra bảng + bullet + bold ĐÚNG.
  - Có thể gộp nhiều màn trong 1 clipboard (đã paste 5 màn/lần OK). Ranh giới mục 3: sau "2.2 Navigation Flow by Role", trước "4. External API Inventory".
- **Undo** 1 lần `ctrl+z` xoá trọn 1 lần paste (đã dùng để thay bản tiếng Việt→Anh).
- Mock: user muốn mô tả CHỨC NĂNG ĐÍCH (điều hướng thật sẽ có), KHÔNG ghi "mock/static".
- Trạng thái mặc định mọi màn: 🔄 In development.

## ĐÃ LÀM XONG
- **SCR-06..10 (nhóm Public content)** — DONE, tiếng Anh, đã paste vào cuối mục 3. Doc 15→20 trang.
  - 06 News List→07 · 07 Article Detail→06 · 08 Tournament List→09 · 09 Tournament Detail→08/34/10 · 10 Player Profile→09/08.
- Code đã đọc & mô tả chuẩn: Home(index+Banner/News/Schedule/Ranked), Event/index, PlayerProfilePage, News/NewsListPage, News/ArticleDetailPage, Event/EventDetailPage.

## CÒN LẠI (chưa làm)
- SCR-03 Register, 04 Forgot, 05 Profile, 11 Staff Profile (đọc code: pages/Auth/*, pages/Profile, pages/Manager/StaffProfile).
- SCR-12→38 (Admin, Owner/Manager, Staff, Player+Payment) — đọc code từng component trước khi viết. Xem `mem:fds_screen_inventory_task` mục 5 để biết file component.
- (Tùy chọn) dọn các block template TalentHub cũ + cập nhật mục 2.1 Screen Index (vẫn là TalentHub) — HỎI user trước.
