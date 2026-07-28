# Staff Public Profile + Public Staff/Referee List

> ⚠️ **PHẦN LỚN ĐÃ LỖI THỜI — đối chiếu 2026-07-28:**
> - Backend **đã sửa**: `config/PublicEndpoints.java` nay cho `/tournaments/**`, `/news/**`,
>   `/branches/**`, `/matches/**`, `/ws/**` chạy KHÔNG cần JWT → mục "Backend auth model" bên dưới SAI.
>   (`/participants/**` vẫn cần JWT.)
> - Route public `/staffs` **không còn** trong `src/constants/routes.js`; `src/pages/Public/StaffList/`
>   và `src/api/publicEmployeeApi.js` vẫn còn trên đĩa nhưng không được route tới → tính năng chưa lên `prod`.
> - Nhánh `thanh/feat/fixEventUI` không còn dùng; FE hiện ở `prod`. Trọng tâm hiện tại là app mobile.
> Giữ file này vì phần mô tả `StaffProfile` (các bug cố ý chưa sửa) vẫn còn giá trị.

Branch: `thanh/feat/fixEventUI`. Session 2026-07-09. **Chỉ sửa FE — user KHÔNG có quyền sửa backend.**

## Backend auth model (đã kiểm chứng qua fetch trực tiếp — ĐÃ LỖI THỜI, xem cảnh báo đầu file)
- Mọi endpoint `/api/v1/**` **bắt buộc JWT hợp lệ**; không token → **401** (kể cả `/tournaments`, `/news`).
- `GET /manager/accounts/staffs` — list staff, **chỉ MANAGER** (STAFF/OWNER → 403). Paged (Spring Page trong `data`).
- `GET /manager/employees/{id}` — chi tiết, **chỉ MANAGER** (200 với manager; 403 với staff/owner).
- `GET /owner/employees` — của OWNER.
- `GET /employees`, `/staffs`, `/referees` → **500** với manager (chưa có/chưa hoạt động) → coi như **chưa có endpoint public**.
- Phân loại: field **`bio`** = `"REFEREE"` → Trọng tài; còn lại (STAFF/null) → Nhân viên. (Tất cả đều role `STAFF`.)
- Tài khoản test: manager `thanhdeptrai@gmail.com`; staff `staff@gmail.com` (id=4, bio=null); owner `owner@gmail.com`.

## Staff Public Profile — LÀM CHƯA ĐÚNG (mismatch public vs manager-only)
- File `src/pages/Manager/StaffProfile/index.jsx`, route `/staffProfile/:slug` (`layout: null`, **không guard** = ngụ ý public). `:slug` thực chất là **`staff.id`** (navigate từ `Admin/StaffManagement` + list mới).
- Nhưng nó gọi **`/manager/employees/{id}` (manager-only)** → non-manager/khách bị 403, chỉ thấy placeholder. Tức "public" chỉ trên danh nghĩa. Đúng ra phải dùng endpoint public (pattern `GET /participants/{id}/profile`).
- **Đã sửa CSS** (session này): thêm `src/pages/Manager/StaffProfile/StaffProfile.scss` (flip-card đẹp, scope dưới `.staffProfilePage`), đổi class gốc `profilePage`→`staffProfilePage`, import scss. Trước đó file flip-card `src/pages/Profile/styles.scss` là **mồ côi, không ai import**.
- **Cố ý CHƯA sửa (user dặn để đó):** giới tính `null`→hiện "Nữ" (`gender==="MALE"?...:"Nữ"`); chức vụ dùng `bio` thay vì `role` (`bio==="STAFF"?"Nhân viên":"Trọng tài"` → null ra "Trọng tài" sai); dateOfBirth null hiện chữ "Ngày sinh"; thiếu try/catch + loading + guard.

## Public Staff/Referee List (mới, session này)
- Route public **`/staffs`** (`CommonLayout`, không guard) → `src/pages/Public/StaffList/index.jsx`: hero, **2 tab Nhân viên|Trọng tài** (lọc client theo `bio`), ô search, lưới thẻ responsive (avatar+badge+trạng thái, dark-mode), phân trang, states loading/rỗng/lỗi 401(→nút Đăng nhập)/lỗi chung(→"Danh sách tạm thời chưa khả dụng"+Thử lại). Click thẻ → `staffProfile/:id`.
- API `src/api/publicEmployeeApi.js`: `listPublicEmployees` gọi **`GET /employees`** (BE chưa mở → hiện error state graceful). Đã verify grid bằng cách TẠM trỏ `/manager/accounts/staffs` rồi revert.
- Nút **"ĐỘI NGŨ ĐIỀU HÀNH"** (pill đỏ, icon Users) thêm vào hero `src/pages/Event/index.jsx` → `navigate('/staffs')`; đã thêm `const navigate = useNavigate()` trong `EventPage`.
- Spec: `docs/superpowers/specs/2026-07-09-public-staff-referee-list-design.md` (đã commit). **Code FE CHƯA commit.**

## Cần BE mở (để luồng public chạy đúng) — user sẽ nhờ team BE
- `GET /employees?page&size&keyword&type` (mọi role có token) trả paged: `id, fullName, displayName, avatarUrl, bio, status`.
- `GET /employees/{id}` (mọi role) — thay `/manager/employees/{id}` cho trang chi tiết.
- Bước FE tiếp theo (nếu user đồng ý): đổi `StaffProfile` sang gọi `GET /employees/{id}` + xử lý lỗi.
