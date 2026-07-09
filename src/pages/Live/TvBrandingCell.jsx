/** Ô branding — chỉ hiện khi lưới còn slot trống, không thay bàn thật. */
const TvBrandingCell = ({
  tournamentName,
  logoUrl,
  gridColumn,
  gridRow,
}) => (
  <div
    className="tv-panel-sheen relative flex min-h-0 min-w-0 flex-col items-center justify-center overflow-hidden rounded-[1.1rem] border border-white/10 bg-[linear-gradient(145deg,rgba(13,17,25,0.98),rgba(6,10,16,0.98))] p-5 shadow-[0_18px_45px_rgba(0,0,0,0.32)]"
    style={{ gridColumn, gridRow }}
  >
    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500" />
    {logoUrl ? (
      <img
        src={logoUrl}
        alt=""
        className="mb-3 max-h-[45%] max-w-[75%] object-contain opacity-95"
      />
    ) : (
      <div
        className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-2xl font-black text-emerald-300"
        aria-hidden
      >
        {(tournamentName || "G").charAt(0).toUpperCase()}
      </div>
    )}
    {tournamentName && (
      <p className="max-w-full truncate text-center text-sm font-semibold text-zinc-400">
        {tournamentName}
      </p>
    )}
  </div>
);

export default TvBrandingCell;
