export const SETUP_STATUS_STYLES = {
  INFO_DONE: "bg-gray-200 text-gray-700",
  CONFIG_FIELDS_DONE: "bg-blue-100 text-blue-800",
  RACE_TO_DONE: "bg-orange-100 text-orange-800",
  READY_TO_ACTIVATE: "bg-purple-100 text-purple-800",
  ACTIVE: "bg-green-100 text-green-800",
};

export const SETUP_STATUS_LABELS = {
  INFO_DONE: "Thông tin",
  CONFIG_FIELDS_DONE: "Config fields",
  RACE_TO_DONE: "Race-to",
  READY_TO_ACTIVATE: "Sẵn sàng kích hoạt",
  ACTIVE: "Đang hoạt động",
};

export const SEEDING_OPTIONS = [
  { value: "RANDOM", label: "Ngẫu nhiên" },
  { value: "MANUAL", label: "Thủ công" },
  { value: "ELO", label: "Theo ELO" },
];

export const PARTICIPANT_TYPES = [
  { value: "SINGLE", label: "Đơn" },
  { value: "DOUBLE", label: "Đôi" },
  { value: "TEAM", label: "Đội" },
];

export const TOURNAMENT_STATUS_LABELS = {
  DRAFT: "Nháp",
  OPEN_FOR_REGISTRATION: "Mở đăng ký",
  REGISTRATION_CLOSED: "Đóng đăng ký",
  DRAW_PREVIEW: "Xem trước bracket",
  DRAW_DONE: "Đã bốc thăm",
  FINAL_BRACKET_READY: "Sẵn sàng chung kết",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const TOURNAMENT_STATUS_STYLES = {
  DRAFT:                "bg-slate-100  text-slate-600  ring-1 ring-slate-300",
  OPEN_FOR_REGISTRATION:"bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  REGISTRATION_CLOSED:  "bg-amber-50   text-amber-700  ring-1 ring-amber-200",
  DRAW_PREVIEW:         "bg-yellow-50  text-yellow-700 ring-1 ring-yellow-300",
  DRAW_DONE:            "bg-blue-50    text-blue-700   ring-1 ring-blue-200",
  FINAL_BRACKET_READY:  "bg-cyan-50    text-cyan-700   ring-1 ring-cyan-200",
  IN_PROGRESS:          "bg-violet-50  text-violet-700 ring-1 ring-violet-200",
  COMPLETED:            "bg-teal-50    text-teal-700   ring-1 ring-teal-200",
  CANCELLED:            "bg-rose-50    text-rose-700   ring-1 ring-rose-200",
};

/** tournament_results.note / ranking entry note — BE lưu enum.name() (English), dịch sang VN ở
 * đây. Dùng `RANKING_NOTE_LABELS[note] ?? note` khi render: dòng dữ liệu cũ (lưu sẵn text tiếng
 * Việt trước khi BE đổi sang name()) không khớp key thì fallback hiển thị nguyên văn. */
export const RANKING_NOTE_LABELS = {
  CHAMPION: "Vô địch",
  RUNNER_UP: "Á quân",
  THIRD_PLACE: "Hạng 3",
  FOURTH_PLACE: "Hạng 4",
  SEMI_FINAL: "Bán kết",
  GROUP_LEADER: "Dẫn đầu bảng",
};

export const BRACKET_PHASES = [
  { value: "KNOCKOUT", label: "Knockout" },
  { value: "WINNERS", label: "Winners" },
  { value: "LOSERS", label: "Losers" },
  { value: "GRAND_FINAL", label: "Grand Final" },
  { value: "GROUP", label: "Group" },
  { value: "PLAYOFF", label: "Playoff" },
];
