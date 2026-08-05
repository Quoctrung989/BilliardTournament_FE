import clsx from "clsx";
import { getPlayerName, isMatchFinished } from "../../utils/refereeMatch";
import {
  SLOT_COLORS,
  getCellTypography,
  getCurrentInning,
  isEndingSoon,
} from "./tvLayout";

/**
 * Một nửa ô: tên trên, điểm dưới, cả hai căn giữa nửa của mình.
 * Màu theo vị trí cơ thủ (xanh / đỏ) giống màn chấm điểm của trọng tài.
 */
const PlayerSide = ({
  name,
  score,
  accent,
  leading,
  won,
  scorePop,
  nameSize,
  scoreSize,
}) => (
  <div
    className="flex min-w-0 flex-1 flex-col items-center justify-center gap-[clamp(0.2rem,0.7vmin,0.55rem)] rounded-[0.85rem] px-[clamp(0.4rem,1vmin,0.85rem)] py-[clamp(0.3rem,0.8vmin,0.65rem)] text-center"
    style={{
      background:
        leading || won
          ? `linear-gradient(160deg, ${accent}2e 0%, ${accent}0f 70%, rgba(255,255,255,0.02) 100%)`
          : `linear-gradient(160deg, ${accent}14 0%, rgba(255,255,255,0.02) 70%)`,
    }}
  >
    <div className="flex w-full min-w-0 flex-col items-center gap-1">
      <span
        className={clsx(
          "min-w-0 font-semibold leading-tight line-clamp-2",
          leading || won ? "text-white" : "text-zinc-400"
        )}
        style={{ fontSize: nameSize }}
        title={name}
      >
        {name}
      </span>
      {won && (
        <span
          className="shrink-0 rounded-full px-1.5 py-0.5 text-[0.55em] font-extrabold uppercase tracking-[0.18em]"
          style={{
            color: accent,
            backgroundColor: `${accent}1f`,
            boxShadow: `inset 0 0 0 1px ${accent}45`,
          }}
        >
          Thắng
        </span>
      )}
    </div>

    <span
      className={clsx(
        "font-black tabular-nums leading-none",
        scorePop && "tv-score-pop"
      )}
      style={{
        fontSize: scoreSize,
        color: accent,
        opacity: leading || won ? 1 : 0.62,
        textShadow: leading || won ? `0 0 22px ${accent}66` : "none",
      }}
    >
      {score}
    </span>
  </div>
);

const TvMatchCell = ({
  match,
  layout,
  gridColumn,
  gridRow,
  cellFlash = false,
  scoreFlash = {},
}) => {
  const p1 = getPlayerName(match.player1, "Cơ thủ 1");
  const p2 = getPlayerName(match.player2, "Cơ thủ 2");
  const s1 = match.player1Score ?? 0;
  const s2 = match.player2Score ?? 0;
  const endingSoon = isEndingSoon(match);
  const finished = isMatchFinished(match.status) || Boolean(match._retained);
  const winnerId = match.winner?.id ?? null;
  const p1Won = finished && winnerId != null && winnerId === match.player1?.id;
  const p2Won = finished && winnerId != null && winnerId === match.player2?.id;

  const typo = getCellTypography(layout);
  const p1Leading = s1 > s2;
  const p2Leading = s2 > s1;
  const tied = s1 === s2;
  const inning = getCurrentInning(match);

  return (
    <article
      className={clsx(
        "tv-panel-sheen relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.1rem] border-2 border-white/30 bg-[linear-gradient(145deg,rgba(13,17,25,0.98),rgba(4,8,14,0.98))] p-[clamp(0.55rem,1.3vmin,1rem)] shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur",
        finished && "opacity-80",
        cellFlash && "tv-cell-flash"
      )}
      style={{ gridColumn, gridRow }}
    >
      <header
        className="mb-[clamp(0.35rem,0.95vmin,0.7rem)] flex shrink-0 items-center justify-between gap-2"
        style={{ fontSize: typo.header }}
      >
        <span className="font-extrabold uppercase tracking-[0.22em] text-zinc-300">
          Bàn {match.tableNo ?? "—"}
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.62em] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Ván {inning}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.62em] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            {finished ? "Kết thúc" : endingSoon ? "Sắp kết thúc" : "Đang đấu"}
          </span>
        </div>
      </header>

      {/* Hai cơ thủ nằm hai bên, tỉ số quay vào vạch phân cách ở giữa */}
      <div className="flex min-h-0 flex-1 items-stretch gap-[clamp(0.25rem,0.7vmin,0.6rem)]">
        <PlayerSide
          name={p1}
          score={s1}
          accent={SLOT_COLORS[1]}
          leading={tied || p1Leading}
          won={p1Won}
          scorePop={scoreFlash.p1}
          nameSize={typo.name}
          scoreSize={typo.score}
        />

        <div
          className="flex shrink-0 items-center justify-center px-[clamp(0.1rem,0.4vmin,0.35rem)]"
          aria-hidden
        >
          <span
            className="font-black italic leading-none tracking-tight text-zinc-600"
            style={{ fontSize: `calc(${typo.score} * 0.34)` }}
          >
            VS
          </span>
        </div>

        <PlayerSide
          name={p2}
          score={s2}
          accent={SLOT_COLORS[2]}
          leading={tied || p2Leading}
          won={p2Won}
          scorePop={scoreFlash.p2}
          nameSize={typo.name}
          scoreSize={typo.score}
        />
      </div>
    </article>
  );
};

export default TvMatchCell;
