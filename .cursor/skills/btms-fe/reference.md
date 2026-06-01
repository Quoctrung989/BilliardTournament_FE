# BTMS FE — Reference

## Cây thư mục chính

```text
src/
  api/           axiosClient, *Api.js (unwrap / unwrapPaged)
  store/         authStore.js (Zustand)
  utils/         auth.js, apiError.js, pagination.js, wizardDirty.js, formatSetup.js
  constants/     routes.js, adminNav.js, auth.js, tournamentConfig.js
  components/
    guards/      AdminRoute, StaffRoute
    admin/       AdminLayout, AdminSidebar, ui/*, withAdminPage.jsx
    staff/       withStaffPage.jsx
  pages/
    Admin/       Dashboard, tournament-config/*
    Staff/       Dashboard
    Auth/        Login, Register, ForgotPassword
  styles/        admin.css, global.css
  routes/        index.jsx (map ROUTES)
```

## Env

```env
# .env (root) — origin only
REACT_APP_API_URL=http://localhost:8080
```

`axiosClient.baseURL` = `${REACT_APP_API_URL}/api/v1`

## Roles & routes

| Role | Home sau login |
|------|----------------|
| ADMIN | `/admin/dashboard` |
| STAFF | `/staff/dashboard` |
| PLAYER | `/` |

Admin tournament-config:

| Path | Page |
|------|------|
| `/admin/tournament-config/formats` | FormatListPage |
| `/admin/tournament-config/formats/new` | FormatWizardPage |
| `/admin/tournament-config/formats/:code/edit` | FormatWizardPage |
| `/admin/tournament-config/game-types` | GameTypeListPage |
| `/admin/tournament-config/config-field-catalog` | ConfigFieldCatalogPage |

## Admin UI classes

- Layout: `admin-card`, `admin-label`, `admin-input`, `admin-select`, `admin-btn`
- Table: `admin-table`, `admin-table-wrap`, `admin-table-action`
- Toggle: `admin-toggle` + `data-on={boolean}`

## Pagination utils

```js
import { buildListParams, DEFAULT_PAGE_SIZE, parsePagedResponse } from "../utils/pagination";

const result = await getFormats(buildListParams({ page: 0, size: 10, isActive: true }));
// result.content, result.totalElements, result.totalPages, result.page
```

`parsePagedResponse` chấp nhận `data.content` hoặc fallback mảng thuần.

## Format API (admin formats)

| Method | Path |
|--------|------|
| GET (paged) | `/admin/formats` |
| GET | `/admin/formats/:code` |
| POST | `/admin/formats` |
| PUT | `/admin/formats/:code` |
| PATCH | `/admin/formats/:code` (active) |
| GET/PUT | `/admin/formats/:code/config-fields` |
| GET/PUT | `/admin/formats/:code/race-to-rules` |
| GET | `/admin/formats/:code/setup-summary` |
| POST | `/admin/formats/:code/activate` |
| POST | `/admin/formats/:code/bootstrap-defaults` |

Game types: `GET /admin/game-types` (paged), `PUT /admin/game-types/:code`

Catalog: `GET /admin/config-field-catalog` (paged), `GET /admin/config-field-catalog/:fieldKey`

## Auth API (tham khảo)

- `POST /auth/login`, `GET /auth/me`
- Session build: `buildSessionFromAuthPayload` in `utils/auth.js`
