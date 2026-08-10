# AGENTS.md — SU26_SEP490_G2_FE (BTMS)

Hướng dẫn cho AI Agent (Cursor, Copilot, v.v.) khi làm việc trên repo này.

## Đọc trước khi code

| Tài nguyên | Đường dẫn | Khi nào |
|------------|-----------|---------|
| **Skill chính** | `.cursor/skills/btms-fe/SKILL.md` | Feature admin, API, auth, tournament-config |
| **Reference** | `.cursor/skills/btms-fe/reference.md` | Endpoint, cây thư mục, routes |
| **Templates prompt** | `.cursor/skills/btms-fe/templates.md` | Cách mô tả task / PR / commit |
| **Rules** | `.cursor/rules/*.mdc` | Luôn áp dụng + theo glob file |

Skill `btms-fe`: gõ `@btms-fe` hoặc mô tả task BTMS — Agent nên load skill khi sửa repo này.

## Dự án trong một dòng

Billiards Tournament Management System — frontend CRA, React 19 JS, REST `/api/v1`, phân quyền ADMIN / STAFF / PLAYER.

## Lệnh

```bash
npm start    # dev :3000
npm run build
npm test
```

## Quyết định kiến trúc (đã chốt)

1. **Không** Vite / TypeScript trừ khi team migrate có kế hoạch.
2. HTTP chỉ qua `axiosClient` + unwrap `getApiData`.
3. List admin = **server-side pagination** (Spring `content` + `totalElements`).
4. Auth persist `btms_token` + `btms_user`; hydrate trước khi guard redirect.
5. Admin module mới = API file + page + `routes.js` + `adminNav.js`.

## Dark mode — BA cơ chế, trang mới phải trúng một

Rà toàn bộ 82 trang ngày 2026-08-10. Không có cơ chế chung duy nhất, nên khi thêm trang phải biết mình rơi vào nhánh nào:

| Cơ chế | Áp cho | Cách dùng |
|---|---|---|
| `.dark .admin-shell` | 29 trang khu Admin/Owner/Manager/Staff | Khai route qua `withAdminPage` / `withOwnerPage` / `withManagerPage` / `withStaffPage` là **tự có**. `admin.css` còn override cả `.bg-white` bên trong `.admin-content`, nên `bg-white` cứng vẫn đúng. |
| `.content-dark` | 5 trang Player/Payment | Phải **tự gắn class** `content-dark` lên phần tử gốc. Quên là trang trắng nguyên — đúng lỗi của `/profile` trước 2026-08-10. |
| class `dark:` | 14 trang public | Tự viết từng cặp `bg-white dark:bg-[#161a22]`. |

**Mốc màu là trang chủ, không phải `.dark body`.** `pages/Home/index.jsx` ghi đè body bằng `dark:bg-[#0b0d12]`, thẻ `#161a22`. Còn `.dark body` để `#0a1220` là thang navy cũ — lấy nhầm nó thì trang mới ngả xanh trong khi trang chủ vẫn đen.

**Ba khu cố ý tối ở cả hai chế độ, đừng "sửa"**: màn chiếu TV (`pages/Live/`), trang Auth, và màn chấm điểm của trọng tài (`StaffScoringPage`, nền `#0a0e14`).

## Mở rộng sau này

- Thêm rule `.mdc` mới trong `.cursor/rules/` (một concern / file, &lt; 50 dòng).
- Cập nhật `reference.md` khi BE đổi contract.
- Skill cá nhân (mọi repo): copy `.cursor/skills/btms-fe/` → `~/.cursor/skills/btms-fe/`.

## Liên hệ spec BE

Khi BE đổi breaking (pagination, auth field), cập nhật đồng thời:

- `src/utils/pagination.js` (parse)
- `src/api/admin*Api.js`
- Skill `reference.md` + rule `btms-api.mdc`
