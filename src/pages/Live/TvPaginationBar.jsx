import { PAGE_ROTATE_MS } from "./tvLayout";

const TvPaginationBar = ({ pageIndex, totalPages, liveTableCount, progressKey }) => (
  <footer className="shrink-0 border-t border-zinc-800/60 bg-[#0A0D14] px-[4%] py-2">
    <div className="mb-2 h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
      <div
        key={progressKey}
        className="tv-progress-bar h-full bg-emerald-500/70"
        style={{ "--tv-progress-ms": `${PAGE_ROTATE_MS}ms` }}
      />
    </div>
    <p
      className="text-center tabular-nums text-zinc-500"
      style={{ fontSize: "clamp(0.7rem, 1.5vmin, 0.875rem)" }}
    >
      Trang {pageIndex + 1}/{totalPages} · {liveTableCount} bàn đang đấu · Chuyển
      sau 15s
    </p>
  </footer>
);

export default TvPaginationBar;
