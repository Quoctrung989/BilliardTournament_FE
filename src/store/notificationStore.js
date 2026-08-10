import { create } from "zustand";
import * as notificationApi from "../api/notificationApi";

const STORAGE_KEY = "btms_noti_read_at";

/**
 * Backend không có cột "đã đọc" — thay vào đó trình duyệt này giữ một mốc thời gian, và chưa đọc
 * nghĩa là "sinh ra sau mốc đó". Đổi lại sự đơn giản ấy, hai máy của cùng một người đếm độc lập
 * nhau, và xoá dữ liệu trình duyệt thì mọi thứ trở lại thành chưa đọc.
 */
const readStoredMark = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch (e) {
    // Chế độ riêng tư của trình duyệt có thể chặn đọc — coi như chưa đọc gì
    return null;
  }
};

const writeStoredMark = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch (e) {
    /* bỏ qua: không lưu được thì chỉ mất trạng thái đã đọc, không hỏng gì khác */
  }
};

const clearStoredMark = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    /* bỏ qua */
  }
};

export const useNotificationStore = create((set, get) => ({
  lastReadAt: readStoredMark(),
  unreadCount: 0,

  /**
   * Hỏi lại backend số chưa đọc.
   *
   * Nuốt lỗi có chủ đích: chuông là thứ phụ trên thanh điều hướng, mất mạng hay hết phiên thì để
   * nguyên số cũ chứ không được bắn toast đè lên việc người dùng đang làm.
   */
  refreshUnread: async () => {
    try {
      const count = await notificationApi.getUnreadCount(get().lastReadAt);
      set({ unreadCount: Number(count) || 0 });
    } catch (e) {
      /* giữ nguyên số đang hiện */
    }
  },

  /** Gọi khi mở danh sách thông báo — mọi thứ tới thời điểm này coi như đã xem. */
  markAllRead: () => {
    const now = new Date().toISOString();
    writeStoredMark(now);
    set({ lastReadAt: now, unreadCount: 0 });
  },

  /**
   * Xoá sạch khi đăng xuất.
   *
   * Phải xoá cả mốc đã đọc: người khác đăng nhập trên cùng máy mà giữ lại mốc của chủ trước thì
   * thông báo cũ hơn mốc đó sẽ bị coi là đã đọc dù họ chưa từng thấy.
   */
  reset: () => {
    clearStoredMark();
    set({ lastReadAt: null, unreadCount: 0 });
  },
}));
