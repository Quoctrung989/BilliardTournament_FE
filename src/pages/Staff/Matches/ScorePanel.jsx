import { useEffect, useRef, useState } from "react";
import { Crown, Hand, Undo2 } from "lucide-react";
import { DEFAULT_PLAYER_AVATAR } from "../../../constants/rankingEnums";

const ProgressPips = ({ score, raceTo, accent, emptyClass, mirrored }) => {
  const total = Math.max(raceTo ?? 5, 1);
  return (
    <div
      className={`flex items-center gap-1.5 sm:gap-2 ${
        mirrored ? "justify-start" : "justify-end"
      }`}
      aria-hidden
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-5 sm:w-8 rounded-full transition-colors ${
            i < score ? "" : emptyClass
          }`}
          style={i < score ? { backgroundColor: accent } : undefined}
        />
      ))}
    </div>
  );
};

/**
 * Ảnh cơ thủ tràn sát mép ngoài màn hình.
 *
 * Toàn bộ việc làm mềm biên nằm trong MỘT mask trên chính thẻ <img> (giao của
 * một gradient ngang và một gradient dọc). Không đặt lớp phủ chồng lên ảnh:
 * lớp phủ luôn là hình chữ nhật nên rìa của nó tự vẽ thành cạnh vuông.
 */
const PlayerPortrait = ({ src, name, slot }) => {
  const [failed, setFailed] = useState(false);
  const usingFallback = failed || !src;
  const url = usingFallback ? DEFAULT_PLAYER_AVATAR : src;
  const mirrored = slot === 2;

  const maskX = `linear-gradient(${
    mirrored ? "to left" : "to right"
  }, #000 0%, #000 44%, rgba(0,0,0,0.72) 68%, rgba(0,0,0,0.22) 87%, transparent 100%)`;
  const maskY =
    "linear-gradient(to bottom, transparent 0%, #000 10%, #000 88%, transparent 100%)";

  return (
    <img
      src={url}
      alt=""
      onError={() => setFailed(true)}
      aria-hidden
      className={`pointer-events-none absolute inset-y-0 hidden sm:block h-full w-[42%] max-w-[430px] object-cover object-top ${
        mirrored ? "right-0" : "left-0"
      }`}
      style={{
        WebkitMaskImage: `${maskX}, ${maskY}`,
        WebkitMaskComposite: "source-in",
        maskImage: `${maskX}, ${maskY}`,
        maskComposite: "intersect",
        maskSize: "100% 100%",
        maskRepeat: "no-repeat",
        opacity: usingFallback ? 0.45 : 1,
        filter: usingFallback
          ? "grayscale(1) brightness(1.1)"
          : "saturate(1.06) contrast(1.05)",
      }}
    />
  );
};

/**
 * Một nửa bảng điểm. Ảnh cơ thủ nằm sát mép ngoài, tỉ số dồn vào giữa nhưng
 * luôn chừa `centerGap` để không bị đồng hồ đếm ngược che.
 */
const ScorePanel = ({
  name,
  score,
  slot,
  theme,
  raceTo,
  avatarUrl,
  centerGap = "3rem",
  canAdd,
  canUndo,
  finished,
  isWinner,
  dimmed,
  hasTurn,
  onTapPlus,
  onMinus,
}) => {
  const [pop, setPop] = useState(false);
  const prevScore = useRef(score);
  useEffect(() => {
    if (score !== prevScore.current) {
      setPop(true);
      const t = setTimeout(() => setPop(false), 260);
      prevScore.current = score;
      return () => clearTimeout(t);
    }
  }, [score]);

  const mirrored = slot === 2;
  const innerPad = mirrored
    ? { paddingLeft: centerGap, paddingRight: "1.25rem" }
    : { paddingRight: centerGap, paddingLeft: "1.25rem" };

  /* Trạng thái được thể hiện bằng ánh sáng thay vì khung viền — viền chữ nhật
     sẽ cắt ngang ảnh cơ thủ. */
  const glow = isWinner
    ? `inset 0 0 120px -40px ${theme.accent}, inset 0 ${mirrored ? "" : "-"}0 0 0 transparent`
    : hasTurn
      ? `inset 0 0 90px -45px ${theme.accent}`
      : "none";

  return (
    <div className="relative flex flex-1 flex-col min-h-0 overflow-hidden">
      <div
        className={`relative flex flex-1 min-h-0 transition-opacity duration-300 ${
          dimmed ? "opacity-55" : "opacity-100"
        }`}
        style={{ background: theme.panelTint }}
      >
        {/* Quầng sáng hắt sau lưng cơ thủ — trải trên toàn panel nên không tạo
            ra rìa hình chữ nhật quanh ảnh. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(38% 52% at ${
              mirrored ? "86%" : "14%"
            } 74%, ${theme.accent}2b 0%, ${theme.accent}0a 46%, transparent 72%)`,
          }}
          aria-hidden
        />

        <PlayerPortrait src={avatarUrl} name={name} slot={slot} />

        {/* Ánh sáng trạng thái + vạch nhấn mảnh ở đỉnh khi tới lượt */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: glow }}
          aria-hidden
        />
        {(hasTurn || isWinner) && (
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
            style={{
              background: `linear-gradient(${
                mirrored ? "to left" : "to right"
              }, transparent, ${theme.accent})`,
            }}
            aria-hidden
          />
        )}

        <div
          className={`relative flex flex-1 min-w-0 flex-col ${
            mirrored ? "items-start" : "items-end"
          }`}
          style={innerPad}
        >
          {/* Nhãn + tên cơ thủ */}
          <div
            className={`shrink-0 w-full pt-4 sm:pt-6 flex flex-col ${
              mirrored ? "items-start" : "items-end"
            }`}
          >
            <div className="flex items-center gap-2 min-h-[1.75rem]">
              {hasTurn && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${theme.accent}22`,
                    color: theme.accent,
                    boxShadow: `inset 0 0 0 1px ${theme.accent}55`,
                  }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: theme.accent }}
                  />
                  Đang đánh
                </span>
              )}
              <span
                className={`font-semibold uppercase tracking-[0.22em] ${theme.label}`}
                style={{ fontSize: "clamp(0.68rem, 1.6vh, 0.85rem)" }}
              >
                Cơ thủ {slot}
              </span>
              {isWinner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f5c842]/15 text-[#f5c842] px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ring-[#f5c842]/35">
                  <Crown size={13} strokeWidth={2.5} />
                  Thắng
                </span>
              )}
            </div>

            <h2
              className={`mt-1.5 max-w-full truncate font-semibold leading-tight ${theme.name} ${
                mirrored ? "text-left" : "text-right"
              }`}
              style={{ fontSize: "clamp(1rem, 3vh, 1.55rem)" }}
            >
              {name}
            </h2>
          </div>

          {/* Vùng chạm +1 — số dồn về phía giữa, chừa chỗ cho đồng hồ */}
          <button
            type="button"
            disabled={!canAdd}
            onClick={onTapPlus}
            className={`flex-1 flex w-full flex-col justify-center min-h-[5rem] gap-5 sm:gap-7 py-2 touch-manipulation select-none transition-transform disabled:cursor-default ${
              mirrored ? "items-start" : "items-end"
            } ${canAdd ? "active:scale-[0.99] cursor-pointer" : ""}`}
            aria-label={`Cộng 1 điểm cho ${name}`}
          >
            <p
              className={`tabular-nums leading-none font-bold ${theme.score}`}
              style={{
                fontSize: "clamp(4.5rem, 25vh, 8.5rem)",
                fontVariantNumeric: "tabular-nums",
                // Quầng vừa phải: quầng rộng sẽ loang sang tận mặt đồng hồ.
                textShadow: `0 0 26px ${theme.glow}`,
                animation: pop ? "scorePop 0.26s ease-out" : undefined,
              }}
            >
              {score}
            </p>

            <ProgressPips
              score={score}
              raceTo={raceTo}
              accent={theme.accent}
              emptyClass={theme.pipEmpty}
              mirrored={mirrored}
            />
          </button>
        </div>
      </div>

      {/* Hàng thao tác: +1 điểm (chính) + hoàn tác */}
      <div
        className={`shrink-0 flex items-stretch gap-2.5 px-3 sm:px-4 py-3 sm:py-3.5 bg-[#0a0e14] border-t border-white/[0.05] ${
          mirrored ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <button
          type="button"
          disabled={!canAdd}
          onClick={onTapPlus}
          className={`flex-1 inline-flex items-center justify-center gap-2.5 rounded-2xl min-h-[54px] py-3 font-bold uppercase tracking-wide transition-all touch-manipulation active:scale-[0.98] disabled:cursor-default ${
            canAdd
              ? "text-white"
              : "bg-white/[0.04] text-slate-500 ring-1 ring-inset ring-white/[0.06]"
          }`}
          style={
            canAdd
              ? {
                  backgroundColor: theme.accent,
                  boxShadow: `0 10px 26px -12px ${theme.accent}`,
                  fontSize: "clamp(0.95rem, 2.2vh, 1.2rem)",
                }
              : { fontSize: "clamp(0.9rem, 2vh, 1.1rem)" }
          }
          aria-label={`Cộng 1 điểm cho ${name}`}
        >
          {canAdd ? (
            <>
              <Hand size={20} strokeWidth={2.4} />
              +1 điểm
            </>
          ) : finished ? (
            "Đã kết thúc"
          ) : (
            "Đã đủ điểm"
          )}
        </button>

        <button
          type="button"
          disabled={!canUndo}
          onClick={(e) => {
            e.stopPropagation();
            onMinus();
          }}
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 sm:px-5 min-h-[54px] font-medium text-slate-400 bg-white/[0.05] ring-1 ring-inset ring-white/10 hover:bg-white/[0.09] hover:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors touch-manipulation"
          style={{ fontSize: "clamp(0.9rem, 2vh, 1.1rem)" }}
          aria-label={`Hoàn tác, trừ 1 điểm của ${name}`}
        >
          <Undo2 size={18} className="opacity-80" />
          <span className="hidden sm:inline">Hoàn tác</span>
          <span className="tabular-nums">−1</span>
        </button>
      </div>
    </div>
  );
};

export default ScorePanel;
