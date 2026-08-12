import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import * as notificationApi from "../../../api/notificationApi";
import { useNotificationStore } from "../../../store/notificationStore";
import { NOTIFICATION_DROPDOWN_SIZE, NOTIFICATION_POLL_MS } from "../../../constants/notification";
import { getApiErrorMessage } from "../../../utils/apiError";
import NotificationItem from "./NotificationItem";

/**
 * Chuông thông báo cho thanh điều hướng, dùng chung cho Header công khai và AdminHeader.
 *
 * Hai header có hệ style riêng nên nút nhận `className` từ ngoài thay vì tự quyết — phần bên
 * trong (huy hiệu, dropdown, cách tải dữ liệu) thì giống hệt nhau ở cả hai chỗ.
 *
 * Web không có thông báo đẩy nên số chưa đọc phải tự hỏi lại theo nhịp. Danh sách thì chỉ tải khi
 * người dùng mở dropdown: phần lớn thời gian không ai mở, tải sẵn chỉ tổ tốn băng thông.
 *
 * Chỉ dựng component này khi đã đăng nhập — vòng hỏi lại sẽ nhận 401 liên tục nếu không.
 */
const NotificationBell = ({ className = "", align = "right" }) => {
  const navigate = useNavigate();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const refreshUnread = useNotificationStore((s) => s.refreshUnread);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  /** Mốc đã đọc tại lúc mở dropdown — quyết định dòng nào được tô đậm */
  const [readAtOnOpen, setReadAtOnOpen] = useState(null);

  const wrapperRef = useRef(null);

  useEffect(() => {
    refreshUnread();

    const timer = setInterval(refreshUnread, NOTIFICATION_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshUnread]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await notificationApi.getMyNotifications({
        page: 0,
        size: NOTIFICATION_DROPDOWN_SIZE,
      });
      setItems(res.content);

      // Đánh dấu đã đọc SAU khi tải xong: tải hỏng mà vẫn xoá huy hiệu thì người dùng tưởng
      // đã xem hết trong khi chưa thấy gì
      markAllRead();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [markAllRead]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);

    if (next) {
      // Chụp mốc cũ TRƯỚC khi loadItems gọi markAllRead, nếu không mọi dòng đều thành
      // "đã đọc" ngay khoảnh khắc mở và người dùng mất luôn thông tin cái nào là mới
      setReadAtOnOpen(useNotificationStore.getState().lastReadAt);
      loadItems();
    }
  };

  const isUnread = (item) => {
    if (!item.createdAt) return false;
    if (!readAtOnOpen) return true;
    return new Date(item.createdAt) > new Date(readAtOnOpen);
  };

  const handleOpenItem = (item) => {
    setOpen(false);
    if (item.tournamentId) navigate(`/event/${item.tournamentId}`);
  };

  const badgeText = unreadCount > 9 ? "9+" : String(unreadCount);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`relative ${className}`}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"}
        title="Thông báo"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-[#EF342A] text-white text-[10px] font-bold leading-none">
            {badgeText}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1a1d24] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden`}
        >
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-white/10">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Thông báo</p>
          </div>

          <div className="max-h-[440px] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {loading && (
              <div className="py-10 flex justify-center text-slate-400 dark:text-white/40">
                <Loader2 size={20} className="animate-spin" />
              </div>
            )}

            {!loading && error && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                <button
                  type="button"
                  onClick={loadItems}
                  className="mt-2 text-xs font-semibold text-[#EF342A] hover:underline"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!loading && !error && items.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                Chưa có thông báo nào.
              </p>
            )}

            {!loading &&
              !error &&
              items.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  unread={isUnread(item)}
                  compact
                  onOpen={handleOpenItem}
                />
              ))}
          </div>

        </div>
      )}
    </div>
  );
};

export default NotificationBell;
