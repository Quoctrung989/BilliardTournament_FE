import clsx from "clsx";
import { getPlayerName, isMatchFinished } from "../../utils/refereeMatch";
import {
  getCellTypography,
  getCurrentInning,
  isEndingSoon,
} from "./tvLayout";

const PlayerRow = ({
  name,
  score,
  leading,
  won,
  scorePop,
  nameSize,
  scoreSize,
}) => (
  <div className="flex min-w-0 items-center justify-between gap-2">
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span
        className={clsx(
          "truncate font-semibold leading-tight",
          leading || won ? "text-white" : "text-zinc-500"
        )}
        style={{ fontSize: nameSize }}
        title={name}
      >
        {name}
      </span>
      {won && (
        <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.35 text-[0.6em] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
          Thắng
        </span>
      )}
    </div>
    <span
      className={clsx(
        "shrink-0 font-black tabular-nums leading-none",
        leading || won ? "text-emerald-300" : "text-zinc-500",
        scorePop && "tv-score-pop"
      )}
      style={{ fontSize: scoreSize }}
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
        "tv-panel-sheen relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.1rem] border bg-[linear-gradient(145deg,rgba(13,17,25,0.98),rgba(4,8,14,0.98))] p-[clamp(0.55rem,1.3vmin,1rem)] shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur",
        endingSoon && !finished
          ? "border-amber-400/70 shadow-[0_0_0_1px_rgba(251,191,36,0.16),0_18px_45px_rgba(251,191,36,0.08)]"
          : "border-white/10",
        finished && "opacity-80",
        cellFlash && "tv-cell-flash"
      )}
      style={{ gridColumn, gridRow }}
    >
      <div
        className={clsx(
          "absolute inset-x-0 top-0 h-1",
          endingSoon && !finished
            ? "bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400"
            : "bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500"
        )}
      />

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
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[0.62em] font-semibold uppercase tracking-[0.2em]",
              finished ? "bg-white/5 text-zinc-400" : "bg-emerald-500/15 text-emerald-300"
            )}
          >
            {finished ? "Kết thúc" : "Đang đấu"}
          </span>
        </div>
      </header>

      {endingSoon && !finished && (
        <p className="mb-2 inline-flex w-fit items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[0.62em] font-extrabold uppercase tracking-[0.2em] text-amber-300">
          Sắp kết thúc
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-[clamp(0.35rem,0.95vmin,0.7rem)]">
        <div
          className={clsx(
            "rounded-[0.85rem] border px-3 py-2",
            p1Leading || p1Won
              ? "border-emerald-400/20 bg-emerald-500/10"
              : "border-white/5 bg-white/[0.03]"
          )}
        >
          <PlayerRow
            name={p1}
            score={s1}
            leading={tied || p1Leading}
            won={p1Won}
            scorePop={scoreFlash.p1}
            nameSize={typo.name}
            scoreSize={typo.score}
          />
        </div>
        <div
          className={clsx(
            "rounded-[0.85rem] border px-3 py-2",
            p2Leading || p2Won
              ? "border-emerald-400/20 bg-emerald-500/10"
              : "border-white/5 bg-white/[0.03]"
          )}
        >
          <PlayerRow
            name={p2}
            score={s2}
            leading={tied || p2Leading}
            won={p2Won}
            scorePop={scoreFlash.p2}
            nameSize={typo.name}
            scoreSize={typo.score}
          />
        </div>
      </div>
    </article>
  );
};

export default TvMatchCell;
