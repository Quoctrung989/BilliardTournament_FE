export const EMAIL_TEMPLATE_CATEGORIES = [
  { value: "SYSTEM", label: "Hệ thống" },
  { value: "TOURNAMENT", label: "Giải đấu" },
  { value: "MARKETING", label: "Marketing" },
  { value: "TRANSACTIONAL", label: "Giao dịch" },
];

export const EMAIL_EVENT_TYPES = [
  { value: "USER_REGISTERED", label: "Người dùng đăng ký tài khoản mới" },
  { value: "REGISTRATION_SUBMITTED", label: "Đăng ký mới được gửi" },
  { value: "REGISTRATION_APPROVED", label: "Đăng ký được duyệt" },
  { value: "REGISTRATION_REJECTED", label: "Đăng ký bị từ chối" },
  { value: "REGISTRATION_CANCELLED", label: "Đăng ký bị hủy" },
  { value: "PAYMENT_SUCCESS", label: "Thanh toán thành công" },
  { value: "PAYMENT_FAILED", label: "Thanh toán thất bại" },
  { value: "TOURNAMENT_REGISTRATION_OPEN", label: "Giải đấu mở đăng ký" },
  { value: "TOURNAMENT_REGISTRATION_CLOSING_SOON", label: "Sắp đóng đăng ký" },
  { value: "TOURNAMENT_DRAW_COMPLETED", label: "Đã bốc thăm xong" },
  { value: "TOURNAMENT_STATUS_CHANGED", label: "Trạng thái giải đấu thay đổi" },
  { value: "MATCH_SCHEDULED_REMINDER", label: "Nhắc lịch thi đấu" },
  { value: "MATCH_STARTING_SOON", label: "Trận đấu sắp bắt đầu" },
  { value: "MATCH_COMPLETED", label: "Trận đấu đã kết thúc" },
  { value: "PARTICIPANT_WITHDRAWN", label: "Vận động viên rút lui" },
  { value: "STAFF_ACCOUNT_CREATED", label: "Tài khoản nhân viên được tạo" },
  { value: "MANAGER_ACCOUNT_CREATED", label: "Tài khoản quản lý được tạo" },
  { value: "CUSTOM_MANUAL_SEND", label: "Gửi thủ công" },
];

/** Recipient type owner/manager được chọn khi gửi thủ công (loại trừ PLAYER/MATCH_PLAYERS — chỉ dùng nội bộ cho automation). */
export const EMAIL_MANUAL_RECIPIENT_TYPES = [
  { value: "ALL_PARTICIPANTS", label: "Tất cả vận động viên đang thi đấu" },
  { value: "REGISTRATION_USER", label: "Người đăng ký đã duyệt" },
  { value: "CUSTOM_LIST", label: "Danh sách email tự nhập" },
];

export const EMAIL_RECIPIENT_TYPES = [
  ...EMAIL_MANUAL_RECIPIENT_TYPES,
  { value: "PLAYER", label: "Người chơi liên quan" },
  { value: "MATCH_PLAYERS", label: "2 vận động viên của trận đấu" },
  { value: "ROLE_STAFF", label: "Toàn bộ nhân viên" },
];

export const EMAIL_TRIGGER_TYPE_LABELS = {
  MANUAL: "Gửi thủ công",
  AUTOMATION: "Tự động theo sự kiện",
  SYSTEM: "Hệ thống / lịch định kỳ",
};

export const EMAIL_SEND_STATUS_LABELS = {
  QUEUED: "Đang chờ gửi",
  SENT: "Đã gửi",
  FAILED: "Gửi thất bại",
  CANCELLED: "Đã hủy",
};

export const EMAIL_SEND_STATUS_STYLES = {
  QUEUED: "bg-amber-100 text-amber-800",
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export const EMPTY_EMAIL_TEMPLATE_FORM = {
  code: "",
  name: "",
  description: "",
  category: "TOURNAMENT",
  subjectTemplate: "",
  bodyHtmlTemplate: "",
  availableVariables: [],
};

export const EMPTY_EMAIL_RULE_FORM = {
  code: "",
  name: "",
  description: "",
  eventType: "REGISTRATION_APPROVED",
  templateId: "",
  recipientType: "REGISTRATION_USER",
  delayMinutes: 0,
  conditions: "",
};
