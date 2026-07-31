/* ============================================================================
   DỮ LIỆU MẪU CHO CÁC TRANG PUBLIC — CẦN GỠ TRƯỚC KHI BÀN GIAO

   Các trang public đã nối API thật (`/news`, `/news/categories`, `/tournaments`,
   `/branches`, `/tournaments/:id/rankings`). Khi backend chưa chạy hoặc chưa có
   bản ghi nào, các khối sẽ rỗng và trang trông như hỏng. File này cấp dữ liệu
   mẫu để UI vẫn dựng đủ hình hài khi phát triển và khi demo.

   ⚠️ ĐÂY LÀ DỮ LIỆU GIẢ. Không tên người thật, không con số thật.

   NƠI ĐANG DÙNG (6 file — nhớ gỡ hết):
     · pages/Home/components/News.jsx      → khối "Tin mới nhất từ CAPSTONE"
     · pages/Home/components/Marquee.jsx   → dải "TIN MỚI" và 2 dải giải đấu
     · pages/Home/components/Schedule.jsx  → khối "Lịch thi đấu"
     · pages/Home/components/Ranked.jsx    → khối "Top tay cơ"
     · pages/Home/components/Banner.jsx    → dải số liệu hero
     · pages/News/NewsListPage.jsx         → trang /news (bài viết + chuyên mục)

   Ba khối tin tức (News trang chủ, marquee "TIN MỚI", trang /news) dùng CHUNG
   một nguồn `DEMO_POSTS` — publish bài thật là cả ba tự chuyển sang dữ liệu thật.

   CÁCH GỠ KHI BE ĐÃ CÓ DỮ LIỆU THẬT:
     1. Đặt `DEMO_ENABLED = false` — UI lập tức chỉ còn dữ liệu thật, các khối
        rỗng quay lại hiện thông báo "Chưa có ...".
     2. Khi chắc chắn không cần nữa: xoá file này và bỏ mọi lời gọi `withDemo`
        trong 6 file kể trên.

   Dữ liệu mẫu CHỈ được dùng khi API trả về rỗng hoặc lỗi — có dữ liệu thật thì
   dữ liệu thật luôn thắng, không bao giờ trộn lẫn hai nguồn.
   ========================================================================== */

export const DEMO_ENABLED = true;

/** Cảnh báo một lần cho mỗi khối, tránh spam console mỗi lần render. */
const warned = new Set();

const warnOnce = (block) => {
  if (warned.has(block)) return;
  warned.add(block);
  // eslint-disable-next-line no-console
  console.warn(
    `[Trang chủ] Khối "${block}" đang hiển thị DỮ LIỆU MẪU vì API không trả về bản ghi nào. ` +
      `Xem src/constants/demoData.js để tắt.`
  );
};

/**
 * Trả dữ liệu thật nếu có, ngược lại trả dữ liệu mẫu.
 *
 * @param {Array|null} real Dữ liệu từ API.
 * @param {Array} demo Dữ liệu mẫu tương ứng.
 * @param {string} block Tên khối, dùng cho cảnh báo console.
 */
export const withDemo = (real, demo, block) => {
  if (real && real.length > 0) return real;
  if (!DEMO_ENABLED) return real || [];
  warnOnce(block);
  return demo;
};

/* ── Tin tức — khớp shape của GET /news ─────────────────────────────────── */
export const DEMO_POSTS = [
  {
    id: "demo-post-1",
    title: "Giải Billiards CAPSTONE Mùa 2026 chính thức khởi tranh",
    slug: "demo-giai-capstone-2026-khoi-tranh",
    thumbnailUrl: "/images/tournaments/vn-player-1.jpg",
    categoryName: "Giải đấu",
    publishedAt: "2026-07-28T09:00:00Z",
  },
  {
    id: "demo-post-2",
    title: "Nhìn lại những đường cơ đẹp nhất vòng bảng tuần qua",
    slug: "demo-duong-co-dep-nhat-vong-bang",
    thumbnailUrl: "/images/tournaments/action-1.jpg",
    categoryName: "Kết quả",
    publishedAt: "2026-07-25T14:30:00Z",
  },
  {
    id: "demo-post-3",
    title: "Hướng dẫn đăng ký thi đấu trực tuyến chỉ trong 3 bước",
    slug: "demo-huong-dan-dang-ky-thi-dau",
    thumbnailUrl: "/images/tournaments/pool-4.jpg",
    categoryName: "Thông báo",
    publishedAt: "2026-07-22T08:15:00Z",
  },
  {
    id: "demo-post-4",
    title: "Hệ thống CAPSTONE mở rộng thêm cụm bàn thi đấu tiêu chuẩn",
    slug: "demo-mo-rong-cum-ban-thi-dau",
    thumbnailUrl: "/images/tournaments/pool-6.jpg",
    categoryName: "Tin hệ thống",
    publishedAt: "2026-07-19T11:00:00Z",
  },
  {
    id: "demo-post-5",
    title: "Luật thi đấu 9-Ball áp dụng từ mùa giải mới có gì thay đổi?",
    slug: "demo-luat-9-ball-mua-giai-moi",
    thumbnailUrl: "/images/tournaments/action-2.jpg",
    categoryName: "Chuyên môn",
    publishedAt: "2026-07-15T16:45:00Z",
  },
  {
    id: "demo-post-6",
    title: "Bí quyết giữ ổn định tâm lý trong những ván cờ quyết định",
    slug: "demo-tam-ly-van-quyet-dinh",
    thumbnailUrl: "/images/tournaments/pool-2.jpg",
    categoryName: "Chuyên môn",
    publishedAt: "2026-07-11T10:20:00Z",
  },
  {
    id: "demo-post-7",
    title: "Tổng kết vòng bảng: những con số đáng chú ý",
    slug: "demo-tong-ket-vong-bang",
    thumbnailUrl: "/images/tournaments/action-1.jpg",
    categoryName: "Kết quả",
    publishedAt: "2026-07-08T13:05:00Z",
  },
  {
    id: "demo-post-8",
    title: "Cách chọn cơ phù hợp cho người mới bắt đầu",
    slug: "demo-chon-co-cho-nguoi-moi",
    thumbnailUrl: "/images/tournaments/pool-4.jpg",
    categoryName: "Chuyên môn",
    publishedAt: "2026-07-04T09:40:00Z",
  },
  {
    id: "demo-post-9",
    title: "Lịch bảo trì hệ thống đặt bàn trực tuyến tháng này",
    slug: "demo-lich-bao-tri-dat-ban",
    thumbnailUrl: "/images/tournaments/pool-6.jpg",
    categoryName: "Thông báo",
    publishedAt: "2026-07-01T07:00:00Z",
  },
];

/** Chuyên mục — khớp shape của GET /news/categories */
export const DEMO_CATEGORIES = [
  { id: "demo-cat-1", name: "Giải đấu" },
  { id: "demo-cat-2", name: "Kết quả" },
  { id: "demo-cat-3", name: "Thông báo" },
  { id: "demo-cat-4", name: "Chuyên môn" },
  { id: "demo-cat-5", name: "Tin hệ thống" },
];

/* ── Giải đấu — khớp shape của GET /tournaments ─────────────────────────── */
export const DEMO_TOURNAMENTS = [
  {
    id: "demo-t1",
    name: "CAPSTONE Masters 2026",
    status: "IN_PROGRESS",
    startAt: "2026-05-26T00:00:00Z",
    endAt: "2026-05-31T00:00:00Z",
    gameType: "9-Ball",
    formatName: "Double Elimination",
    thumbnailUrl: "/images/tournaments/pool-2.jpg",
    maxParticipants: 64,
    approvedCount: 58,
  },
  {
    id: "demo-t2",
    name: "Giải Billiards Mở Rộng Mùa Hè",
    status: "OPEN_FOR_REGISTRATION",
    startAt: "2026-08-10T00:00:00Z",
    endAt: "2026-08-14T00:00:00Z",
    gameType: "10-Ball",
    formatName: "Single Elimination",
    thumbnailUrl: "/images/tournaments/action-1.jpg",
    maxParticipants: 32,
    approvedCount: 12,
  },
  {
    id: "demo-t3",
    name: "CAPSTONE NXT Gen Cup",
    status: "COMPLETED",
    startAt: "2026-03-01T00:00:00Z",
    endAt: "2026-03-05T00:00:00Z",
    gameType: "8-Ball",
    formatName: "Group + Playoff",
    thumbnailUrl: "/images/tournaments/pool-4.jpg",
    maxParticipants: 48,
    approvedCount: 48,
  },
  {
    id: "demo-t4",
    name: "Giải Giao Hữu Các Chi Nhánh",
    status: "REGISTRATION_CLOSED",
    startAt: "2026-09-02T00:00:00Z",
    endAt: "2026-09-07T00:00:00Z",
    gameType: "9-Ball",
    formatName: "Round Robin",
    thumbnailUrl: "/images/tournaments/pool-6.jpg",
    maxParticipants: 24,
    approvedCount: 24,
  },
];

/* ── Xếp hạng — khớp shape của GET /tournaments/:id/rankings ────────────── */
export const DEMO_RANKING_TOURNAMENT = DEMO_TOURNAMENTS[2];

export const DEMO_RANKING_ENTRIES = [
  "Cơ Thủ Số Một",
  "Cơ Thủ Số Hai",
  "Cơ Thủ Số Ba",
  "Cơ Thủ Số Bốn",
  "Cơ Thủ Số Năm",
  "Cơ Thủ Số Sáu",
  "Cơ Thủ Số Bảy",
  "Cơ Thủ Số Tám",
  "Cơ Thủ Số Chín",
].map((displayName, index) => ({
  participantId: `demo-p${index + 1}`,
  displayName,
  avatarUrl: null,
  rankLabel: `#${index + 1}`,
}));

/* ── Số liệu hero ───────────────────────────────────────────────────────── */
export const DEMO_HERO_STATS = [
  { label: "Giải đấu", value: 24 },
  { label: "Đang diễn ra", value: 3 },
  { label: "Đã hoàn thành", value: 18 },
  { label: "Chi nhánh", value: 6 },
];
