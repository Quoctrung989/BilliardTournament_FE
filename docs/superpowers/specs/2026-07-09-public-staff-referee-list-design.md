# Public Staff/Referee List — Design

Ngày: 2026-07-09
Branch: thanh/feat/fixEventUI

## Mục tiêu
Tạo màn hình công khai liệt kê **Nhân viên** và **Trọng tài**, mọi role (đã đăng nhập) đều truy cập được, và thêm 1 nút trên trang Event dẫn tới màn hình này. Click 1 người → trang chi tiết flip-card `staffProfile/:id` đã có.

## Bối cảnh / Ràng buộc (đã kiểm chứng trên backend đang chạy)
- Backend **bắt buộc JWT hợp lệ cho mọi API** (không token → 401 với mọi endpoint, kể cả `/tournaments`).
- Endpoint list nhân viên duy nhất đang chạy là `GET /manager/accounts/staffs`, **chỉ Manager** (Staff/Owner → 403).
- Chưa có endpoint trả list nhân viên/trọng tài cho non-manager.
- Phân loại Nhân viên vs Trọng tài dựa vào field **`bio`**: `"REFEREE"` = Trọng tài, còn lại = Nhân viên (khớp `Admin/StaffManagement`).

## Quyết định
- Phương án: **trang public độc lập** (không tái dùng `AccountManagementPage` vốn cho admin).
- Nguồn dữ liệu: **build sẵn UI, wire vào endpoint public thống nhất**, xử lý lỗi để chạy được ngay cả khi backend chưa mở API.
- Cấu trúc: **1 trang, 2 tab** (Nhân viên | Trọng tài).
- Nút điều hướng: đặt ở **hero trang Event**, nhãn **"Đội ngũ điều hành"**.
- Click item → `staffProfile/:id`.
- Route: **`/staffs`**, layout `CommonLayout`, không guard.

## Hợp đồng API (backend cần mở — FE wire sẵn)
`GET /api/v1/employees?page&size&keyword&type` — mọi role có token gọi được.
Trả paged; mỗi item: `id, fullName, displayName, avatarUrl, bio ("STAFF"|"REFEREE"), status, email?, phone?`.
FE tạo `src/api/publicEmployeeApi.js` gọi `/employees` (dùng `unwrapPaged`). `type` = `STAFF`/`REFEREE` theo tab (fallback lọc client theo `bio`).

## UI trang `/staffs`
- Hero nhỏ + tiêu đề "Nhân viên & Trọng tài".
- Thanh 2 tab: `Nhân viên | Trọng tài` + ô tìm kiếm theo tên.
- Lưới thẻ responsive: avatar tròn (ảnh mặc định nếu thiếu), họ tên, badge loại, trạng thái (Hoạt động/Nghỉ). Cả thẻ click được.
- Phân trang dùng `AdminPagination` (đã có).
- Style khớp thẩm mỹ trang Event (Tailwind, hỗ trợ dark mode).

## Trạng thái loading / rỗng / lỗi
- Loading: skeleton/spinner.
- Rỗng: "Chưa có nhân viên/trọng tài nào."
- 401 (chưa đăng nhập): thông báo + nút Đăng nhập.
- 403/500/endpoint chưa có: "Danh sách tạm thời chưa khả dụng." (không vỡ trang).

## Nút trên trang Event
Thêm nút trong hero `src/pages/Event/index.jsx`, style pill khớp tông (đỏ `#ef342a`/tối), `navigate('/staffs')`, không phá layout.

## Phạm vi KHÔNG bao gồm
- Không sửa logic dữ liệu hiển thị của trang chi tiết `staffProfile` (giới tính/chức vụ) — theo yêu cầu để lại.
- Không tự thêm endpoint backend.

## Files dự kiến
- Thêm: `src/api/publicEmployeeApi.js`
- Thêm: `src/pages/Public/StaffList/index.jsx` (+ style nếu cần)
- Sửa: `src/constants/routes.js` (route `/staffs`)
- Sửa: `src/pages/Event/index.jsx` (nút hero)
