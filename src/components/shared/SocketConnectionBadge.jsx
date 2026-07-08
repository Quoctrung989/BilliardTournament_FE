import clsx from "clsx";

const STATE_CONFIG = {
  connected: {
    label: "Đã kết nối",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50 ring-emerald-200",
  },
  connecting: {
    label: "Đang kết nối…",
    dot: "bg-amber-400 animate-pulse",
    text: "text-amber-800",
    bg: "bg-amber-50 ring-amber-200",
  },
  reconnecting: {
    label: "Đang kết nối lại…",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-900",
    bg: "bg-amber-50 ring-amber-300",
  },
  disconnected: {
    label: "Mất kết nối",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50 ring-red-200",
  },
};

/**
 * Chấm trạng thái WebSocket — dùng chung màn trọng tài / manager live.
 *
 * @param {{ connectionState?: string, className?: string, compact?: boolean }} props
 */
const SocketConnectionBadge = ({
  connectionState = "disconnected",
  className = "",
  compact = false,
}) => {
  const cfg = STATE_CONFIG[connectionState] ?? STATE_CONFIG.disconnected;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
        cfg.bg,
        cfg.text,
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className={clsx("h-2 w-2 shrink-0 rounded-full", cfg.dot)} aria-hidden />
      {!compact && cfg.label}
    </span>
  );
};

export default SocketConnectionBadge;
