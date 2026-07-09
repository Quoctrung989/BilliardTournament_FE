import { formatNextMatchTime } from "./tvLayout";

const TvWaitingScreen = ({ tournamentName, logoUrl, nextScheduledAt }) => {
  const timeLabel = formatNextMatchTime(nextScheduledAt);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-[6%] text-center">
      <div className="tv-panel-sheen w-full max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-[clamp(1.4rem,4vmin,3rem)] shadow-[0_20px_70px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-zinc-400">
            Sắp tới
          </span>
        </div>

        {logoUrl ? (
          <img
            src={logoUrl}
            alt=""
            className="mx-auto mb-6 max-h-[clamp(4rem,18vmin,8rem)] max-w-[min(70%,24rem)] object-contain opacity-95"
          />
        ) : (
          <div
            className="mx-auto mb-6 flex h-[clamp(4rem,14vmin,8rem)] w-[clamp(4rem,14vmin,8rem)] items-center justify-center rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/10 text-4xl font-black text-emerald-300"
            aria-hidden
          >
            {(tournamentName || "G").charAt(0).toUpperCase()}
          </div>
        )}

        <p
          className="mx-auto max-w-4xl font-bold leading-tight text-zinc-100"
          style={{ fontSize: "clamp(1.75rem, 5.5vmin, 3.25rem)" }}
        >
          {timeLabel
            ? `Trận tiếp theo lúc ${timeLabel}`
            : "Trận tiếp theo sắp bắt đầu"}
        </p>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-medium text-zinc-400 sm:text-base">
          Hệ thống sẽ tự động cập nhật khi các bảng đấu bắt đầu và kết thúc.
        </p>
      </div>
    </div>
  );
};

export default TvWaitingScreen;
