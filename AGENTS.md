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

## Mở rộng sau này

- Thêm rule `.mdc` mới trong `.cursor/rules/` (một concern / file, &lt; 50 dòng).
- Cập nhật `reference.md` khi BE đổi contract.
- Skill cá nhân (mọi repo): copy `.cursor/skills/btms-fe/` → `~/.cursor/skills/btms-fe/`.

## Liên hệ spec BE

Khi BE đổi breaking (pagination, auth field), cập nhật đồng thời:

- `src/utils/pagination.js` (parse)
- `src/api/admin*Api.js`
- Skill `reference.md` + rule `btms-api.mdc`
