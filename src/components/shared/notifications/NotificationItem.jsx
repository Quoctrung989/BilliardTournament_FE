import { Trophy } from "lucide-react";
import {
  formatNotificationTime,
  getNotificationLabel,
  getNotificationStyle,
} from "../../../constants/notification";

/**
 * Một dòng thông báo trong popup chuông.
 *
 * Cách phân biệt đã đọc / chưa đọc bám thói quen của Facebook, vì đó là thứ người dùng đã quen:
 * chưa đọc thì có chấm, nền nhuốm màu nhấn và tiêu đề in đậm màu sẫm; đã đọc thì bỏ hẳn chấm,
 * nền trở lại như thẻ thường và chữ nhạt đi. Lướt qua là biết cái nào cần xem.
 *
 * Trạng thái này được chốt theo mốc đã đọc CHỤP LẠI lúc mở popup, không phải theo mốc hiện tại —
 * nhờ vậy trong lượt mở này người dùng vẫn thấy rõ cái nào mới, còn lần mở sau chúng đã thành
 * đã đọc. Xem `NotificationBell`.
 *
 * Chỉ bấm được khi thông báo gắn với một giải đấu — thông báo về tài khoản không có chỗ nào để
 * mở, dựng nó thành nút bấm là hứa suông với người dùng.
 */
const NotificationItem = ({ item, unread = false, compact = false, onOpen }) => {
  const label = getNotificationLabel(item.eventType);
  const chipStyle = getNotificationStyle(item.eventType);
  const canOpen = Boolean(item.tournamentId);

  const Wrapper = canOpen ? "button" : "div";

  return (
    <Wrapper
      type={canOpen ? "button" : undefined}
      onClick={canOpen ? () => onOpen?.(item) : undefined}
      className={`w-full text-left px-4 py-3 flex gap-3 transition-colors ${
        canOpen ? "hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer" : ""
      } ${unread ? "bg-red-50/60 dark:bg-red-500/10" : ""}`}
    >
      {/* Chấm chưa đọc giữ chỗ cố định để tiêu đề của mọi dòng thẳng hàng nhau,
          đã đọc hay chưa cũng vậy */}
      <span className="pt-1.5 shrink-0 w-2">
        {unread && <span className="block w-2 h-2 rounded-full bg-[#EF342A]" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 mb-1">
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${chipStyle}`}>
            {label}
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {formatNotificationTime(item.createdAt)}
          </span>
        </span>

        {/* `line-clamp-*` và `block` cùng đặt thuộc tính display nên loại trừ nhau,
            đừng gắn cả hai rồi trông chờ vào thứ tự class */}
        <span
          className={`text-sm leading-snug ${
            unread
              ? "font-semibold text-slate-900 dark:text-white"
              : "font-normal text-slate-500 dark:text-white/60"
          } ${compact ? "line-clamp-2" : "block"}`}
        >
          {item.title}
        </span>

        {item.preview && (
          <span
            className={`mt-0.5 text-xs text-slate-500 dark:text-slate-400 ${
              compact ? "line-clamp-1" : "block"
            }`}
          >
            {item.preview}
          </span>
        )}

        {item.tournamentName && (
          <span className="mt-1 flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <Trophy size={12} className="shrink-0" />
            <span className="truncate">{item.tournamentName}</span>
          </span>
        )}
      </span>
    </Wrapper>
  );
};

export default NotificationItem;
