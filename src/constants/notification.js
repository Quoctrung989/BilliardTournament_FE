/**
 * Nhãn ngắn cho từng loại sự kiện, khớp `EmailEventType` của backend.
 *
 * Tiêu đề thông báo lấy từ dòng chủ đề email — thường dài và trang trọng. Nhãn ở đây dùng làm
 * chip phân loại để lướt qua danh sách là biết ngay chuyện gì.
 */
export const NOTIFICATION_EVENT_LABELS = {
  USER_REGISTERED: "Tài khoản",
  REGISTRATION_SUBMITTED: "Đăng ký",
  REGISTRATION_APPROVED: "Đăng ký",
  REGISTRATION_REJECTED: "Đăng ký",
  REGISTRATION_CANCELLED: "Đăng ký",
  PAYMENT_SUCCESS: "Thanh toán",
  PAYMENT_FAILED: "Thanh toán",
  TOURNAMENT_REGISTRATION_OPEN: "Giải đấu",
  TOURNAMENT_REGISTRATION_CLOSING_SOON: "Giải đấu",
  TOURNAMENT_DRAW_COMPLETED: "Giải đấu",
  TOURNAMENT_STATUS_CHANGED: "Giải đấu",
  MATCH_SCHEDULED_REMINDER: "Trận đấu",
  MATCH_STARTING_SOON: "Trận đấu",
  MATCH_COMPLETED: "Trận đấu",
  MATCH_REFEREE_ASSIGNED: "Trận đấu",
  PARTICIPANT_WITHDRAWN: "Giải đấu",
  STAFF_ACCOUNT_CREATED: "Tài khoản",
  MANAGER_ACCOUNT_CREATED: "Tài khoản",
  CUSTOM_MANUAL_SEND: "Thông báo",
};

/** Màu chip theo nhóm — viết đủ cả hai chế độ vì web có dark mode. */
export const NOTIFICATION_EVENT_STYLES = {
  "Đăng ký": "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Thanh toán": "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Giải đấu": "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Trận đấu": "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  "Tài khoản": "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
  "Thông báo": "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300",
};

export const getNotificationLabel = (eventType) =>
  NOTIFICATION_EVENT_LABELS[eventType] || "Thông báo";

export const getNotificationStyle = (eventType) =>
  NOTIFICATION_EVENT_STYLES[getNotificationLabel(eventType)] ||
  NOTIFICATION_EVENT_STYLES["Thông báo"];

/**
 * Số thông báo popup tải về.
 *
 * Không phân trang và không có màn "xem tất cả": thông báo là thứ liếc qua rồi quay lại việc
 * đang làm. Cuộn hết chừng này là đã đi đủ xa vào quá khứ.
 */
export const NOTIFICATION_DROPDOWN_SIZE = 20;

/** Nhịp hỏi lại số chưa đọc. Web không có thông báo đẩy nên phải tự hỏi. */
export const NOTIFICATION_POLL_MS = 60_000;

/**
 * Thời gian kiểu "5 phút trước".
 *
 * Phần còn lại của web hiển thị mốc tuyệt đối, nhưng với thông báo thì câu hỏi thường trực là
 * "mới hay cũ" chứ không phải "đúng ngày giờ nào" — và mốc tuyệt đối buộc người đọc phải tự trừ
 * nhẩm. Quá một tuần thì đổi lại sang ngày tháng, vì "23 ngày trước" cũng chẳng nói lên điều gì.
 */
export const formatNotificationTime = (iso) => {
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();

  // Lệch giờ giữa máy chủ và trình duyệt có thể cho ra số âm nhỏ — đừng hiện "âm 2 phút trước"
  if (diffMs < 60_000) return "Vừa xong";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};
