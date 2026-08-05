# NHIỆM VỤ: Điền mục "3. Screen Inventory" của Functional Design Spec (Google Doc)

> ⚠️ **TẠM DỪNG — đối chiếu 2026-07-28.** Nhiệm vụ chưa xong (xem `fds_screen_inventory_progress`),
> nhưng trọng tâm hiện tại là **app mobile**. Danh sách 38 màn ở mục 5 **đã thiếu** so với FE `prod`:
> nay còn có `src/pages/Branch/`, `src/pages/Live/` (màn TV tỉ số trực tiếp) và `src/pages/Public/StaffList/`.
> Nhánh `thanh/feat/fixEventUI` không còn dùng. Nếu làm tiếp: đọc lại `src/constants/routes.js` trước.

> Ghi 2026-07-07. Người dùng sẽ mở SESSION MỚI (có Claude Chrome) để tiếp tục. Đọc kỹ file này là đủ để làm tiếp, không cần hỏi lại từ đầu.

## 1. Mục tiêu
Điền **toàn bộ mục "3. Screen Inventory"** của tài liệu FDS cho hệ thống **BiliardsManager** (FE React này).

**Link Google Doc (công khai đọc được):**
`https://docs.google.com/document/d/1aOxeLLsagD2s-g3AHNNDmdAxXXXfDGJO/edit`

⚠️ **QUAN TRỌNG:** Doc hiện đang là **TEMPLATE GỐC với ví dụ hệ tuyển dụng "TalentHub"** (SCR-01 Sign In → SCR-19 Pipeline Report, toàn bộ về recruitment — KHÔNG liên quan bi-a). Mục 3 phải **viết mới hoàn toàn** cho BiliardsManager theo đúng format template. Nghĩa là thay thế nội dung ví dụ, không phải điền vào chỗ trống có sẵn.

### Cách đọc nội dung doc mà KHÔNG cần Chrome (đã kiểm chứng):
Doc share công khai → export text qua WebFetch:
`https://docs.google.com/document/d/1aOxeLLsagD2s-g3AHNNDmdAxXXXfDGJO/export?format=txt`
(WebFetch sẽ báo redirect sang host googleusercontent — gọi WebFetch lần 2 với URL redirect đó. WebFetch hay tóm tắt; ép prompt "verbatim, do not summarize".)

## 2. QUYẾT ĐỊNH CỦA NGƯỜI DÙNG (đã chốt — không hỏi lại)
- **Cách giao kết quả: ĐIỀN THẲNG VÀO GOOGLE DOC** bằng Claude Chrome (mcp__claude-in-chrome__*). KHÔNG chọn cách "soạn text để paste". → Session mới có Chrome, thao tác trực tiếp trong doc. NHỚ: mọi thao tác ghi/submit trên doc phải HỎI XÁC NHẬN người dùng trước (rule an toàn: publishing/modifying content).
- **Owner & Manager dùng CHUNG component** → GỘP thành 1 màn hình mỗi loại, ghi "Who can see: Owner, Manager" và nêu khác biệt (Owner quản Manager+Staff; Manager chỉ quản Staff). KHÔNG tách riêng.

## 3. FORMAT CHUẨN của MỖI màn hình (trích verbatim từ template)
Mỗi entry Screen Inventory gồm các phần nhãn:
- **Who can see:** (vai trò nào thấy màn này)
- **FT-ID ref:** (tham chiếu Functional, vd FT-02)
- **UC-ID ref:** (tham chiếu Use-case, vd UC-02)
- **Purpose:** (1 câu mục đích)
- **UI Components:** bảng 3 cột `| Component | Type | Description |`
- **Navigation Flow:** các gạch đầu dòng dạng `Action → SCR-ID`
- **Display Conditions:** các gạch đầu dòng điều kiện hiển thị/logic
- **Status:** dòng cuối: `{icon} · Sprint {{SPRINT}} · Tester: {{TESTER}} · Sign-off: {{SIGNOFF}}`
  - Icon trạng thái: ⬜ Not started · 🔄 In development · ✅ Done

### Ví dụ TalentHub trong template (để tham khảo văn phong):
SCR-01 Sign In — Who can see: "All — accessible only when not signed in"; FT-ID: FT-02 (Sign in), FT-05 (Account lockout); UC-ID: UC-02; Purpose: "Allows any user to authenticate and reach their role-specific area". UI Components có: System logo (Image), Page title (H1), Email field (Input text), Password field (Input password, show/hide toggle), Sign In button (Button primary), "Forgot password?" link, Error banner (Alert), Lockout banner (Alert). Navigation: "Sign in success (Admin) → SCR-06", v.v. Status: "✅ Done · Sprint {{SPRINT}} · Tester: {{TESTER}} · Sign-off: {{SIGNOFF}}".

## 4. CÂU HỎI CÒN MỞ (hỏi người dùng ở session mới TRƯỚC khi điền)
- **FT-ID / UC-ID KHÔNG suy ra được từ code** — tham chiếu tài liệu Functional/Use-case riêng của nhóm. Hỏi: để trống `FT-xx`/`UC-xx` cho user tự điền, HAY user gửi danh sách FT/UC để map? (Chưa được trả lời.)
- Định dạng mẫu SCR-05 (xem mục 6) đã trình cho user nhưng CHƯA nhận phản hồi duyệt. Có thể xác nhận nhanh lại.

## 5. DANH SÁCH ~38 MÀN HÌNH (nguồn: src/constants/routes.js) — xương sống Screen Inventory
Đánh SCR-ID theo thứ tự này (Owner/Manager đã gộp):

| SCR | Màn hình | Route | Who can see | Component file |
|----|----|----|----|----|
| 01 | Trang chủ | `/` | Tất cả | pages/Home/index |
| 02 | Danh sách tin tức | `/news` | Tất cả | pages/News/NewsListPage |
| 03 | Chi tiết bài viết | `/news/:slug` | Tất cả | pages/News/ArticleDetailPage |
| 04 | Danh sách giải (public) | `/event` | Tất cả | pages/Event/index |
| 05 | Chi tiết giải (public) | `/event/:id` | Tất cả | pages/Event/EventDetailPage |
| 06 | Hồ sơ cơ thủ (public) | `/event/players/:participantId` | Tất cả | pages/Event/PlayerProfilePage |
| 07 | Đăng nhập | `/login` | Chưa đăng nhập | pages/Auth/LoginPage |
| 08 | Đăng ký tài khoản | `/register` | Chưa đăng nhập | pages/Auth/RegisterPage |
| 09 | Quên mật khẩu | `/forgot-password` | Chưa đăng nhập | pages/Auth/ForgotPasswordPage |
| 10 | Hồ sơ cá nhân | `/profile` | Đã đăng nhập | pages/Profile |
| 11 | Hồ sơ nhân viên (public) | `/staffProfile/:slug` | Tất cả | pages/Manager/StaffProfile |
| 12 | Admin Dashboard | `/admin/dashboard` | Admin | pages/Admin/Dashboard |
| 13 | Quản lý tài khoản | `/admin/accounts` | Admin | pages/Admin/accounts/AccountListPage |
| 14 | Thể thức giải | `/admin/tournament-config/formats` | Admin | pages/Admin/tournament-config/FormatListPage |
| 15 | Wizard thể thức (tạo/sửa) | `.../formats/new` + `/:code/edit` | Admin | FormatWizardPage |
| 16 | Loại bi | `.../game-types` | Admin | GameTypeListPage |
| 17 | Catalog trường cấu hình | `.../config-field-catalog` | Admin | ConfigFieldCatalogPage |
| 18 | Catalog field đăng ký | `/admin/registration-form/field-catalog` | Admin | RegistrationFieldCatalogPage |
| 19 | Template form đăng ký | `.../templates` | Admin | RegistrationFormTemplateListPage |
| 20 | Wizard template form (tạo/sửa) | `.../templates/new` + `/:id/edit` | Admin | RegistrationFormTemplateWizardPage |
| 21 | Dashboard (Owner/Manager) | `/owner\|manager/dashboard` | Owner, Manager | pages/shared/DashboardPage |
| 22 | Quản lý nhân viên | `/owner\|manager/employees` | Owner, Manager | Owner/employees/EmployeeListPage; Manager/employees/StaffListPage |
| 23 | Danh sách giải đấu | `/owner\|manager/tournaments` | Owner, Manager | pages/shared/tournaments/TournamentListPage |
| 24 | Wizard giải (tạo/cấu hình) | `.../tournaments/new` + `/:id/edit` | Owner, Manager | TournamentWizardPage |
| 25 | Chi tiết giải (quản lý) | `.../tournaments/:id` | Owner, Manager | TournamentDetailPage |
| 26 | Đăng ký giải (duyệt) | `.../:id/registrations` | Owner, Manager | shared/registrations/TournamentRegistrationListPage |
| 27 | Người tham gia | `.../:id/participants` | Owner, Manager | shared/participants/ParticipantListPage |
| 28 | Bốc thăm & Lịch đấu | `.../:id/draw` | Owner, Manager | shared/matches/DrawPage |
| 29 | Tin tức & Bài viết (CMS) | `/owner\|manager/news` | Owner, Manager | shared/news/NewsCMSPage |
| 30 | Soạn bài viết | `/owner\|manager/news/:id` | Owner, Manager | shared/news/ArticleEditorPage |
| 31 | Staff Dashboard | `/staff/dashboard` | Staff | pages/Staff/Dashboard |
| 32 | Danh sách giải (Player) | `/player/tournaments` | Player | pages/Player/PlayerTournamentListPage |
| 33 | Chi tiết giải (Player) | `/player/tournaments/:id` | Player | pages/Player/PlayerTournamentDetailPage |
| 34 | Đăng ký thi đấu | `/player/tournaments/:id/register` | Player | pages/Player/TournamentRegisterPage |
| 35 | Đăng ký của tôi | `/player/registrations` | Player | pages/Player/MyRegistrationsPage |
| 36 | Thanh toán của tôi | `/player/payments` | Player | pages/Payment/MyPaymentsPage |
| 37 | Lịch thi đấu của tôi | `/player/matches` | Player | pages/Player/PlayerMatchSchedulePage |
| 38 | Kết quả thanh toán | `/payment/success` | Player/Guest (PayOS redirect) | pages/Payment/PaymentSuccessPage |

Ghi chú thêm:
- Route `/admin/accounts` là bản dùng thật; `StaffManagement` và `/admin/users` đã bị COMMENT OUT trong routes.js → KHÔNG đưa vào inventory.
- Có `pages/NotFound` (404) — có thể thêm nếu muốn đầy đủ, nhưng không nằm trong ROUTES array.
- Admin/Owner/Manager/Staff dùng HOC wrapper: withAdminPage/withOwnerPage/withManagerPage/withStaffPage (title + subtitle truyền vào — xem routes.js để lấy title/subtitle tiếng Việt sẵn có cho từng màn, RẤT hữu ích cho cột Purpose).
- Guard: PlayerRoute bọc các màn /player/*. Layout public dùng CommonLayout.

## 6. MẪU ĐÃ VIẾT (SCR-05) — dùng làm chuẩn văn phong cho 37 màn còn lại
Đã đọc EventDetailPage.jsx. Cấu trúc đúng:
- Who can see: Tất cả — công khai, không cần đăng nhập (`/event/:id`).
- Purpose: Hiển thị chi tiết một giải công khai với 5 tab (Thông tin, Cơ thủ, Trận đấu, Trực tiếp, Xếp hạng); cho phép Player đăng ký thi đấu.
- UI Components: Hero banner (Image, fallback theo id, chỉ tab info/live) · Nút "Giải đấu" back (Button→/event) · Chỉ báo "Trực tiếp" (Badge/Button, chỉ khi status=IN_PROGRESS) · Tên giải (H1 in hoa nghiêng) · Thanh 4 cột (Ngày diễn ra · Loại bi · Thể thức+loại tham gia · Tổng giải thưởng) · Nội dung tab · Thanh tab dưới cố định 5 tab · Nút "Đăng ký" (chỉ Player chưa đăng ký, trong InfoTab).
- Navigation Flow: back→SCR-04; Đăng ký→SCR-34 (/player/tournaments/:id/register); bấm tên cơ thủ→SCR-06 (/event/players/:participantId); đổi tab cập nhật URL ?tab=.
- Display Conditions: banner+thẻ info chỉ ở tab info/live; tab "Trận đấu" disabled khi status=OPEN_FOR_REGISTRATION (tooltip "Lịch thi đấu chưa được xếp"); chỉ báo Trực tiếp chỉ khi IN_PROGRESS; nút Đăng ký chỉ Player chưa đăng ký; tải lỗi→toast+về /event.
- Status: 🔄 In development · Sprint {{SPRINT}} · Tester: {{TESTER}} · Sign-off: {{SIGNOFF}}
- TABS const (line 85): info/players/matches/live/ranking. Data: getPublicTournamentDetail(id) + listPublicParticipants(id). status enum liên quan: IN_PROGRESS (live), OPEN_FOR_REGISTRATION (khóa tab Trận đấu).

## 7. QUY TRÌNH LÀM (khuyến nghị cho session mới)
1. Bật/nối Claude Chrome, mở doc, xác định vị trí mục 3 trong doc (đọc verbatim để biết cấu trúc heading + phần nào cần thay).
2. Hỏi user về FT-ID/UC-ID (mục 4) + xác nhận mẫu SCR-05.
3. Viết đặc tả CHÍNH XÁC: với MỖI màn, ĐỌC CODE component tương ứng (dùng Serena get_symbols_overview + find_symbol) để lấy đúng UI elements / actions / validation / API / navigation. KHÔNG bịa. routes.js đã cho sẵn title/subtitle tiếng Việt → tận dụng cho Purpose.
4. Làm THEO NHÓM để user duyệt dần: Public (01-06) → Auth (07-11) → Admin (12-20) → Owner/Manager (21-30) → Staff (31) → Player+Payment (32-38).
5. Điền vào doc qua Chrome, XÁC NHẬN trước mỗi lần ghi. Cân nhắc: gõ bảng trong Google Docs qua automation rất chậm/dễ lỗi định dạng — nếu user đồng ý có thể chuyển sang soạn text để paste.

## 8. Liên quan
- Context công việc UI Event: xem `mem:event_detail_work_progress`.
- Contract RankingTab: xem `mem:ranking-tab-contract` (dùng khi mô tả SCR tab Xếp hạng / SCR-06).
- Nhánh hiện tại: thanh/feat/fixEventUI.
