# Theme mặc định Light Mode (session 2026-07-09)

Yêu cầu: dark/light mode luôn **mặc định light**, và sau khi **đăng xuất → đăng nhập lại** phải về light bất kể trước đó dùng gì.

## Đã sửa (FE)
- `src/store/themeStore.js`:
  - `getInitialTheme()`: bỏ theo `prefers-color-scheme` hệ thống → khi chưa có giá trị lưu thì luôn trả `"light"`.
  - Thêm action `resetTheme()` (apply light + lưu localStorage).
- `src/store/authStore.js`: import `useThemeStore`; gọi `resetTheme()` trong cả `logout()` và `setSession()` (đăng nhập) → mỗi lần đăng xuất/đăng nhập đều về light.
- Không vòng lặp import (themeStore không import authStore).

Ghi chú: từng lỗi build do `replace_symbol_body` để lại `const const getInitialTheme` — đã fix. Trong phiên, người dùng vẫn bật dark tùy ý; chỉ reset khi logout/login. Code này CHƯA commit (branch `thanh/feat/fixEventUI`).

Liên quan: `mem:staff_public_profile_and_list`.
