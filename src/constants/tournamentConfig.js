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
  DRAW_DONE: "Đã bốc thăm",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

export const TOURNAMENT_STATUS_STYLES = {
  DRAFT: "bg-slate-100 text-slate-700",
  OPEN_FOR_REGISTRATION: "bg-emerald-100 text-emerald-800",
  REGISTRATION_CLOSED: "bg-amber-100 text-amber-800",
  DRAW_DONE: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-violet-100 text-violet-800",
  COMPLETED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-red-100 text-red-700",
};

export const BRACKET_PHASES = [
  { value: "KNOCKOUT", label: "Knockout" },
  { value: "WINNERS", label: "Winners" },
  { value: "LOSERS", label: "Losers" },
  { value: "GRAND_FINAL", label: "Grand Final" },
  { value: "GROUP", label: "Group" },
  { value: "PLAYOFF", label: "Playoff" },
];
