import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

/**
 * Hộp thông báo của người đang đăng nhập — dùng chung với app mobile.
 *
 * Backend không có bảng thông báo riêng: danh sách được dựng lại từ lịch sử email hệ thống đã
 * gửi cho chính người này (`email_send_logs` lọc theo `recipient_user_id`). Hệ quả cần nhớ khi
 * kiểm thử: sự kiện nào không có automation rule đang bật thì cũng không thành thông báo, nên
 * danh sách rỗng chưa chắc là hỏng.
 *
 * Endpoint nằm ở `/notifications` chứ không phải `/player/notifications` — web chủ yếu do
 * Admin/Owner/Manager/Staff dùng, mà nhánh `/player/**` bị khoá cứng vào role PLAYER.
 */

/** GET /notifications — thông báo của tôi, mới nhất trước */
export const getMyNotifications = (params) =>
  axiosClient
    .get("/notifications", { params })
    .then((res) => parsePagedResponse(getApiData(res), params?.size));

/**
 * GET /notifications/unread-count — số thông báo mới hơn mốc đã đọc.
 *
 * Mốc do chính trình duyệt này giữ và gửi lên: không có cột "đã đọc" nào trong DB, nên hai máy
 * của cùng một người đếm độc lập với nhau.
 */
export const getUnreadCount = (lastReadAt) =>
  axiosClient
    .get("/notifications/unread-count", {
      params: lastReadAt ? { after: lastReadAt } : undefined,
    })
    .then((res) => getApiData(res) ?? 0);
