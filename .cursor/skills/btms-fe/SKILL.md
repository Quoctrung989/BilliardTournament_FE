---
name: btms-fe
description: >-
  Develop BTMS billiards tournament frontend (SU26_SEP490_G2_FE): React 19 +
  JavaScript CRA, axios ApiResponse, Zustand auth, Admin/Staff guards, server-side
  pagination. Use when adding features, admin modules, API clients, auth, or
  tournament-config in this repo.
---

# BTMS Frontend (SU26_SEP490_G2_FE)

## Stack (bắt buộc)

| Item | Giá trị |
|------|---------|
| Framework | React 19, **JavaScript** (`.jsx` / `.js`) — **không TypeScript** |
| Build | Create React App (`react-scripts`) — **không Vite** |
| Env | `REACT_APP_API_URL` = origin only (vd. `http://localhost:8080`) |
| HTTP | `axiosClient` → `${REACT_APP_API_URL}/api/v1` |
| State auth | Zustand `src/store/authStore.js` |
| Router | react-router-dom v7, config `src/constants/routes.js` |
| UI admin | Tailwind + `src/styles/admin.css` + `Admin*` components |
| Toast | `react-toastify` + `getApiErrorMessage(err)` |

## API contract

```text
Request:  Authorization: Bearer {btms_token}
Response: { success, message, code?, data }
```

- Unwrap: `getApiData(response)` → `data`
- Errors: `catch` → `toast.error(getApiErrorMessage(err))`
- List (server-side): `data` = Spring Page — `content`, `page` (0-based), `size`, `totalElements`, `totalPages`
- **Không** dùng `{ items, total }` (đã bỏ)

```js
// API module pattern
import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (p) => p.then((res) => getApiData(res));
const unwrapPaged = (p, size) =>
  p.then((res) => parsePagedResponse(getApiData(res), size));

export const getThings = (params) =>
  unwrapPaged(axiosClient.get("/admin/things", { params }));
```

Query list: `buildListParams({ page, size, ...filters })` từ `src/utils/pagination.js`.

## Auth

| Key | Mục đích |
|-----|----------|
| `btms_token` | JWT access |
| `btms_user` | `{ role: ADMIN \| STAFF \| PLAYER, ... }` |

- Login payload: `accessToken`, `user.role`
- `App.jsx` gọi `hydrateAuth()` — đợi `authReady` trước redirect
- Guards: `AdminRoute` / `StaffRoute` — không redirect sớm khi `!authReady`
- Route theo role: `getHomeRouteForRole` trong `src/utils/auth.js`

## Thêm trang Admin

1. Page trong `src/pages/Admin/<module>/`
2. API trong `src/api/admin<Feature>Api.js`
3. Đăng ký `ROUTES` + `src/constants/adminNav.js`
4. Bọc: `withAdminPage(Page, "Tiêu đề", "Mô tả", { fullWidth?: true })`

List page checklist:

- State: `page`, `pageSize`, `totalElements`, `totalPages`, `content[]`
- `load` trong `useCallback` + `useEffect`
- Filter đổi → `setPage(0)`
- `<AdminPagination />` cuối `AdminCard`

## Wizard / form phức tạp

- Dirty: `src/utils/wizardDirty.js` — chỉ PUT khi đổi; nút «Tiếp tục» vs «Lưu & tiếp»
- Setup status: `src/utils/formatSetup.js`
- Tham chiếu: `FormatWizardPage.jsx`

## Cấm / tránh

- `VITE_*`, TypeScript, đổi stack sang Vite
- `REACT_APP_API_URL` có suffix `/api`
- Fetch thô bỏ qua `axiosClient` / `getApiData`
- Commit/push khi user không yêu cầu
- Scope creep — chỉ sửa file liên quan task

## Verify

```bash
npm run build
```

PowerShell: `cd path; npm run build` (không dùng `&&`).

## Tài liệu thêm

- Chi tiết cây thư mục & endpoint mẫu: [reference.md](reference.md)
- Template prompt / PR / feature: [templates.md](templates.md)
