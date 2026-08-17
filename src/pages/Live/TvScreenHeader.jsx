/**
 * Thanh tiêu đề màn chiếu TV.
 *
 * `exitSlot` và `statusSlot` là chỗ đặt nút Thoát và chấm trạng thái kết nối.
 * Hai thứ đó từng được thả `absolute` ở hai góc trên của trang, mà header cũng
 * chiếm đúng dải đó — nút che mất dòng thể thức bên trái, chấm kết nối đè lên
 * chữ "Trực tiếp" bên phải. Cho chúng vào trong lưới của header để mọi thứ tự
 * đẩy nhau ra, thay vì chồng lên nhau.
 */
const TvScreenHeader = ({
  tournamentName,
  formatLabel,
  roundLabel,
  liveTableCount,
  exitSlot = null,
  statusSlot = null,
}) => (
  <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-white/10 bg-black/20 px-[4%] py-[clamp(0.55rem,1.3vmin,0.95rem)] backdrop-blur-xl">
    <div className="flex min-w-0 items-center gap-3 text-left">
      {exitSlot}

      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-zinc-400">
            Live scoring
          </span>
        </div>
        <h1
          className="truncate font-bold tracking-[0.01em] text-white"
          style={{ fontSize: "clamp(0.95rem, 2.2vmin, 1.375rem)" }}
        >
          {tournamentName || "Giải đấu"}
        </h1>
        {formatLabel && (
          <p
            className="truncate font-medium uppercase tracking-[0.22em] text-zinc-500"
            style={{ fontSize: "clamp(0.7rem, 1.5vmin, 0.875rem)" }}
          >
            {formatLabel}
          </p>
        )}
      </div>
    </div>

    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-center shadow-sm backdrop-blur">
      {roundLabel && (
        <p
          className="font-semibold text-zinc-100"
          style={{ fontSize: "clamp(0.75rem, 1.7vmin, 1rem)" }}
        >
          {roundLabel}
        </p>
      )}
      <p
        className="tabular-nums text-zinc-400"
        style={{ fontSize: "clamp(0.65rem, 1.4vmin, 0.8125rem)" }}
      >
        {liveTableCount} bàn đang đấu
      </p>
    </div>

    <div className="flex items-center justify-end gap-2">
      {statusSlot}

      <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5">
        <span className="tv-live-dot h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
        <span
          className="font-extrabold uppercase tracking-[0.24em] text-emerald-300"
          style={{ fontSize: "clamp(0.7rem, 1.6vmin, 0.875rem)" }}
        >
          Trực tiếp
        </span>
      </div>
    </div>
  </header>
);


export default TvScreenHeader;
