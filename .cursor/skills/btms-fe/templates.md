# BTMS FE — Prompt & deliverable templates

Copy và điền `[...]` khi giao việc cho Agent hoặc viết ticket.

---

## 1. Feature mới (Admin module)

```markdown
## Mục tiêu
[Mô tả ngắn — ai dùng, business value]

## API (backend đã có / sẽ có)
- Method + path: `GET /admin/...`
- Query: page (0-based), size, filters: [...]
- Response data: [paste JSON mẫu hoặc Spring Page fields]
- Mutations: POST/PUT/PATCH body: [...]

## UI
- Route: `/admin/...`
- Sidebar label: [...]
- Loại màn: [ ] List + pagination  [ ] Form  [ ] Wizard  [ ] Read-only catalog
- fullWidth wizard: [ ] có  [ ] không

## Ràng buộc
- Giữ stack BTMS (CRA, JS, axiosClient, toast)
- Không commit trừ khi tôi yêu cầu
```

---

## 2. Tích hợp API list (phân trang)

```markdown
Cập nhật [tên màn] theo API phân trang server-side.

- Endpoint: `GET [path]`
- Query: page, size, [filters]
- Response `data`: { content, page, size, totalElements, totalPages }
- Dùng: admin*Api.js + parsePagedResponse + AdminPagination
- Đổi filter → reset page = 0
```

---

## 3. Sửa lỗi

```markdown
## Triệu chứng
[URL, role, bước tái hiện]

## Kỳ vọng / thực tế
- Kỳ vọng: ...
- Thực tế: ...

## Gợi ý (nếu có)
File nghi ngờ: [...]
Network/Console: [...]
```

---

## 4. Pull request (team)

```markdown
## Summary
- ...
- ...

## Test plan
- [ ] `npm run build`
- [ ] Login ADMIN → [route]
- [ ] Login STAFF → không vào /admin/*
- [ ] F5 giữ session (`btms_token`, `btms_user.role`)
- [ ] List: ?page=0&size=10, chuyển trang / đổi page size
```

---

## 5. Commit message (gợi ý)

```text
feat(admin): [mô tả ngắn — why]

fix(auth): [mô tả — triệu chứng đã sửa]

refactor(api): align list endpoints with server-side pagination
```

Scope: `admin`, `auth`, `staff`, `api`, `ui` — imperative, tiếng Anh hoặc Việt nhất quán trong repo.

---

## 6. Scaffold file (agent tự tạo theo pattern)

**`src/api/adminExampleApi.js`**

```js
import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (p) => p.then((res) => getApiData(res));
const unwrapPaged = (p, size) =>
  p.then((res) => parsePagedResponse(getApiData(res), size));

export const getExamples = (params) =>
  unwrapPaged(axiosClient.get("/admin/examples", { params }));
```

**Route entry** (`constants/routes.js`):

```js
{
  path: "/admin/examples",
  component: withAdminPage(ExampleListPage, "Tiêu đề", "Mô tả phụ"),
},
```
