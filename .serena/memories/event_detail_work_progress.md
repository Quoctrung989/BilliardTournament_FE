# Tiến trình công việc — Khu vực Sự kiện/Giải đấu (Event)

> ⚠️ **ĐÃ HOÀN TẤT & MERGE — lưu để tham khảo, không phải việc đang làm** (đối chiếu 2026-07-28).
> Nhánh `thanh/feat/fixEventUI` không còn dùng; repo FE hiện ở `prod`. `src/pages/Event/eventTheme.css`
> và toàn bộ file Event đã có trên `prod` → phần "ĐÃ LÀM" bên dưới coi như xong.
> Trọng tâm dự án hiện tại là **app mobile** (`SU26_SEP490_G2_MOBILE`).

> Ghi ngày 2026-07-06. Nhánh: `thanh/feat/fixEventUI`.
> Mục đích: đọc file này là nắm được toàn bộ context công việc đang làm ở khu vực Event để tiếp tục.

## Phạm vi đang làm
Tinh chỉnh UI/UX và thêm dark mode cho khu vực giải đấu bi-a (public):
- `src/pages/Event/index.jsx` — trang danh sách `/event`
- `src/pages/Event/EventDetailPage.jsx` — trang chi tiết giải `/event/:id` (chứa InfoTab, PlayersTab)
- `src/pages/Event/MatchesTab.jsx` — tab Trận đấu (Danh sách/Sơ đồ bracket/Bảng điểm)
- `src/pages/Event/RankingTab.jsx` — tab Xếp hạng
- `src/pages/Event/PlayerProfilePage.jsx` — trang hồ sơ cơ thủ `/event/players/:participantId`
- `src/pages/Event/eventTheme.css` — **MỚI**: biến CSS cho theme sáng/tối

## ĐÃ LÀM (hoàn tất, đã kiểm tra diagnostics sạch)
1. **Cuộn lên đầu khi vào trang/đổi tab + fix F5 tự cuộn xuống cuối**: trong `EventDetailPage`, effect `useEffect(() => { window.history.scrollRestoration="manual"; window.scrollTo(0,0); }, [id, activeTab, loading])`. Tắt scrollRestoration để trình duyệt không khôi phục vị trí cũ khi F5.
2. **Thay toàn bộ ảnh nền/banner dính logo WNT/Matchroom** bằng ảnh bi-a self-host tại `public/images/tournaments/`. Ưu tiên ảnh cơ thủ/không khí thi đấu (theo yêu cầu). File ảnh hiện dùng: `vn-player-1.jpg` (ảnh cơ thủ VN do user cấp), `action-1.jpg`, `action-2.jpg`, `pool-2.jpg`, `pool-4.jpg`, `pool-6.jpg`. (Đã xóa `pool-1/3/5.jpg`.)
   - `BANNER_POOL` + hàm `bannerFor(id) = BANNER_POOL[id % len]` ở EventDetailPage, PlayerTournamentDetailPage, index.jsx → **mỗi giải một ảnh cố định theo id** (không random).
   - CÒN TỒN (ngoài phạm vi đã chốt): `src/pages/Home/components/Ranked.jsx` vẫn dùng ảnh chân dung cơ thủ từ `matchroompool.com`; các file Home (Schedule/News/Banner) vẫn còn **chữ** branding (UK Open, CAPSTONE, Matchroom, "World Nineball Tour", Prize Fund $225,000) — user chỉ yêu cầu thay ẢNH, chưa xử lý chữ.
3. **MatchesTab — áp diff user cung cấp + fix bug**: đã có `computeStandings`, `StandingTable`, `StandingView`, `standingGroups`, render group_stage/round_robin (Lịch đấu/Bảng điểm/Playoff). Đã **sửa bug crash tab Sơ đồ**: `BracketCard` dùng `isDone` mà chưa khai báo → thêm `const isDone = match?.status === "done";`. Giữ `flashIds`/`ws-flash` (realtime WebSocket).
4. **Màu thắng/thua + tương phản** trong MatchesTab: tên thắng vàng gold (dark) / `amber-600` (light), tỉ số đỏ `#ef342a`; người thua làm mờ (`text-white/45` / `text-white/40`). Tăng tương phản chữ xanh (mã bàn, giờ, `#num/W#/L#`) từ `sky-400/50~70` → `sky-300` (dark) / `sky-600` (light).
5. **Avatar cơ thủ**: nếu không có `avatarUrl` → hiển thị **avatar chữ cái** (2 chữ đầu tên, màu nền ổn định theo tên) thay vì ảnh xám mặc định. Có ở PlayersTab (EventDetailPage) và RankingTab (`AVATAR_COLORS`, `initialsOf`, `avatarColor`). Nếu có `avatarUrl` thật thì hiện ảnh thật. **User đã xác nhận logic này đúng.**
6. **Bỏ in nghiêng tên cơ thủ** ở PlayersTab và RankingTab (đổi `fontStyle: "italic"` → `"normal"` cho phần tên; giữ IN HOA đậm).
7. **Bấm tên cơ thủ trong tab Trận đấu → mở info**: thêm `id` (=participantId) vào p1/p2 trong `apiMatchToComp`; tên bấm được ở MatchRow, BracketCard, StandingTable → `navigate('/event/players/:id')`. Đã xác minh `m.player1.id === participantId` qua `DrawPage.jsx`.
8. **Quay lại về đúng tab**: `activeTab` được đồng bộ vào URL `?tab=` qua `changeTab()` (dùng `setSearchParams(..., {replace:true})`). Khi mở info cơ thủ rồi Quay lại (`navigate(-1)` trong PlayerProfilePage) sẽ về đúng tab đang đứng thay vì về Thông tin.
9. **Dark mode toàn bộ khu vực Event** (ăn theo nút sáng/tối ở Header — dùng `useThemeStore`, class `.dark` trên `<html>`, tailwind `darkMode:'class'`). ĐÃ HOÀN TẤT cho: trang `/event` (index.jsx), tab Thông tin, Cơ thủ, Xếp hạng, và Trận đấu (Danh sách + Sơ đồ + Bảng điểm + bộ lọc/toggle + empty states).

## CÁCH LÀM THEME (quan trọng để tiếp tục nhất quán)
- File `src/pages/Event/eventTheme.css` định nghĩa biến trong `:root {}` (giá trị **SÁNG = màu cũ**, nên chế độ Sáng KHÔNG đổi gì) và `:root.dark {}` (bản tối). Import vào: EventDetailPage, index.jsx, RankingTab, MatchesTab.
- Token: `--evt-page-bg, --evt-card-bg, --evt-card-border, --evt-subtle, --evt-box-bg, --evt-accent, --evt-heading, --evt-text, --evt-text-2, --evt-text-3, --evt-text-4, --evt-name, --evt-row-hover, --evt-filter-bg, --evt-card-footer, --evt-bracket-line`.
- Quy ước: phần dùng **inline style** → thay literal bằng `var(--evt-*)`; phần dùng **Tailwind class** → thêm cặp `light dark:...` (ví dụ `text-white/70` → `text-slate-600 dark:text-white/70`).
- **Giữ tối có chủ đích ở cả 2 chế độ** (KHÔNG theme): header đỏ trong MatchesTab (`linear-gradient(135deg,#9b1c1c,#7f1616)` + chữ trắng), khối nhà vô địch (ChampionHero) trong RankingTab, banner CTA đăng ký trong InfoTab. Chữ trắng trên các nền này giữ nguyên.
- Muốn chỉnh sắc độ đồng loạt → sửa 1 dòng trong `eventTheme.css`.

## CẦN LÀM / CÓ THỂ LÀM TIẾP (chưa làm)
- `FormatBadge` (chip loại giải, bg-blue-50...) và badge "Realtime" trong MatchesTab: hiện là chip sáng, ở dark mode nhìn hơi chói — chưa thêm dark variant (để sau nếu user muốn).
- `AdminPagination` (component dùng chung ở index.jsx & News): chưa theme dark.
- Xử lý phần **chữ** branding WNT/Matchroom còn sót trong Home (Schedule/News/Banner/Event hero text) và ảnh cơ thủ trong `Ranked.jsx` — nếu user yêu cầu.
- Cân nhắc `ScrollToTop` component toàn cục (dùng `useLocation`) thay vì fix lẻ từng trang (hiện chỉ fix ở EventDetailPage).

## KIỂM TRA
- Không chạy được browser automation (extension Claude for Chrome chưa kết nối). Verify chủ yếu qua `mcp__ide__getDiagnostics` — tất cả file Event hiện **sạch lỗi**.
- App chạy ở `http://localhost:3000`. Nút chuyển sáng/tối nằm ở Header (`src/components/layouts/Header.jsx`), store `src/store/themeStore.js`.

## LƯU Ý DỮ LIỆU
- `m.player1.id` / `m.player2.id` trong match = `participantId` (khớp route `/event/players/:participantId` và `getParticipantProfile`).
- Route: `constants/routes.js` → `/event/players/:participantId` → `PlayerProfilePage`.
- Bracket/standings tính từ `getPublicStages(tournamentId)`; xếp hạng từ `getPublicTournamentRankings`.
