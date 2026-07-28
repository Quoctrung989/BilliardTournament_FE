/**
 * Dữ liệu giả cho màn chiếu TV — chỉ dùng khi URL có `?mock=<số trận>`,
 * ví dụ `/live/tournament/24?mock=16`. Dùng để soi bố cục lưới mà không cần
 * dựng đủ trận thật trên backend.
 *
 * Khi bật mock, trang không gọi API và không mở socket.
 */

const PLAYER_NAMES = [
  "Nguyễn Văn Hòa",
  "Trần Quốc Bảo",
  "Phạm Văn Đức",
  "Vũ Công Thành",
  "Lê Minh Quân",
  "Đặng Hữu Phước",
  "Bùi Thanh Tùng",
  "Hoàng Anh Dũng",
  "Ngô Gia Huy",
  "Đỗ Trung Kiên",
  "Lý Nhật Nam",
  "Trịnh Bá Long",
  "Phan Thế Vinh",
  "Dương Khánh Duy",
  "Mai Xuân Trường",
  "Tạ Quang Hiếu",
  "Chu Văn Lâm",
  "Đinh Tiến Đạt",
  "Hồ Sỹ Nguyên",
  "Cao Bá Khoa",
  "Lâm Chí Cường",
  "Tô Vĩnh Phúc",
  "Đoàn Minh Nhật",
  "Huỳnh Tấn Lộc",
  "Võ Hoài Sơn",
  "Kiều Đăng Khôi",
  "Nghiêm Xuân Bách",
  "Ưng Hoàng Vũ",
  "Thái Bảo Lâm",
  "Quách Tuấn Kiệt",
  "Đỗ Hải Đăng",
  "Lương Sĩ Phú",
];

const STAGE_NAMES = ["Vòng bảng", "Vòng 1/8", "Tứ kết", "Bán kết"];

/** Số giả ổn định theo seed — cùng một trận luôn ra cùng tỉ số. */
function pseudoRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * @param {number} count số trận cần sinh (1–32)
 * @param {number} tournamentId gán vào từng trận để qua được bộ lọc giải
 * @returns {object[]} danh sách trận đúng dạng MatchResponse của backend
 */
export function buildMockLiveMatches(count, tournamentId) {
  const total = Math.min(Math.max(Number(count) || 0, 1), 32);
  const raceTo = 7;

  return Array.from({ length: total }, (_, i) => {
    const r1 = pseudoRandom(i + 1);
    const r2 = pseudoRandom(i + 101);

    // Vài trận cố tình sát điểm thắng để thấy trạng thái "Sắp kết thúc".
    const nearEnd = i % 5 === 0;
    const s1 = nearEnd ? raceTo - 1 : Math.floor(r1 * raceTo);
    const s2 = nearEnd
      ? Math.max(0, raceTo - 2 - Math.floor(r2 * 2))
      : Math.floor(r2 * raceTo);

    return {
      id: 900_000 + i,
      matchCode: `M-${String(i + 1).padStart(2, "0")}`,
      tournamentId,
      tournamentName: "Giải mô phỏng — dữ liệu thử",
      stageName: STAGE_NAMES[i % STAGE_NAMES.length],
      roundNo: (i % 4) + 1,
      raceTo,
      status: "IN_PROGRESS",
      scheduledAt: null,
      tableNo: i + 1,
      player1: {
        id: 800_000 + i * 2,
        displayName: PLAYER_NAMES[(i * 2) % PLAYER_NAMES.length],
        seedNo: i + 1,
      },
      player2: {
        id: 800_001 + i * 2,
        displayName: PLAYER_NAMES[(i * 2 + 1) % PLAYER_NAMES.length],
        seedNo: total + i + 1,
      },
      player1Score: s1,
      player2Score: s2,
      winner: null,
    };
  });
}

/**
 * TẠM THỜI: số trận giả dựng sẵn khi mở màn TV mà không truyền `?mock=`.
 * Đang bật để xem và chỉnh giao diện khi chưa có trận thật.
 *
 * ĐỔI VỀ `null` LÀ TẮT — trang quay lại lấy tỉ số thật từ API + socket.
 */
export const TEMP_DEFAULT_MOCK_COUNT = 16;

/**
 * Đọc `?mock=` từ query string.
 * @returns {number|null|0} số trận; `0` nghĩa là yêu cầu tắt mock
 *   (`?mock=0` hoặc `?mock=off`); `null` nghĩa là URL không nhắc tới mock.
 */
export function readMockCount(search) {
  const raw = new URLSearchParams(search).get("mock");
  if (raw == null) return null;
  if (raw === "off" || raw === "false") return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(Math.floor(n), 32);
}
