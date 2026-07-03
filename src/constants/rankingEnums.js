/**
 * Hằng số dùng cho tab Xếp hạng (FE).
 * Giá trị chuỗi khớp với enum backend — entity vẫn lưu String, FE so sánh qua đây.
 */

/** Trạng thái giải liên quan tới xếp hạng (khớp TournamentStatus backend). */
export const TournamentStatus = {
  COMPLETED: "COMPLETED",
  IN_PROGRESS: "IN_PROGRESS",
};

/**
 * Nhãn hạng hiển thị kiểu WNT.
 * CHAMPION dùng để tách vô địch ra hero card riêng.
 */
export const RankLabel = {
  PREFIX: "#",
  CHAMPION: "#1",
};

/** Badge trạng thái bảng xếp hạng trên UI. */
export const RankingBadge = {
  OFFICIAL: "Kết quả chính thức",
  PROVISIONAL: "Xếp hạng tạm thời",
};

/** Thông báo khi chưa có dữ liệu xếp hạng. */
export const RankingEmptyMessage = {
  NO_DATA_COMPLETED: "Giải chưa có dữ liệu bracket.",
  NO_DATA_IN_PROGRESS: "Xếp hạng sẽ cập nhật khi có kết quả trận đấu.",
  LOAD_ERROR: "Không tải được bảng xếp hạng.",
  NO_PLAYERS: "Chưa có xếp hạng",
  SEARCH_NOT_FOUND: "Không tìm thấy cơ thủ.",
};

/** Avatar mặc định khi cơ thủ chưa có ảnh (file trong public/). */
export const DEFAULT_PLAYER_AVATAR = "/player-default.webp";

/** Quốc gia hiển thị tạm (chưa có field country từ API). */
export const DEFAULT_COUNTRY = {
  flag: "🇻🇳",
  name: "Việt Nam",
};
