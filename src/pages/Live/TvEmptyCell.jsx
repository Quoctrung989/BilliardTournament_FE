/** Ô lấp chỗ trống để lưới luôn đủ hàng cột — cố tình mờ để không hút mắt. */
const TvEmptyCell = ({ gridColumn, gridRow }) => (
  <div
    className="relative flex min-h-0 min-w-0 items-center justify-center rounded-[1.1rem] border-2 border-dashed border-white/10 bg-white/[0.012]"
    style={{ gridColumn, gridRow }}
    aria-hidden
  >
    <span className="text-[clamp(0.6rem,1.2vmin,0.8rem)] font-semibold uppercase tracking-[0.25em] text-zinc-700">
      Trống
    </span>
  </div>
);

export default TvEmptyCell;
