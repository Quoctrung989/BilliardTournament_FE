import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Crown, Flag, Hand, Undo2 } from "lucide-react";
import { toast } from "react-toastify";
import { getMatchDetail } from "../../../api/matchApi";
import {
  completeStaffMatch,
  incrementStaffScore,
  startStaffMatch,
} from "../../../api/staffMatchApi";
import SocketConnectionBadge from "../../../components/shared/SocketConnectionBadge";
import SocketReconnectBanner from "../../../components/shared/SocketReconnectBanner";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { getFriendlyApiErrorMessage } from "../../../utils/apiError";
import {
  getPlayerName,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
  pickDefaultWinnerId,
} from "../../../utils/refereeMatch";

const P1_COLOR = "#378add";
const P2_COLOR = "#ef4444";

/**
 * Chấm "đang giao bóng" hiện đang được suy đoán từ tổng ván ((p1+p2)%2),
 * không phải dữ liệu thật từ backend. Vì trọng tài là người có thẩm quyền,
 * hiển thị một chỉ dấu "chắc chắn" nhưng có thể sai sẽ gây hiểu nhầm.
 * Giữ tắt cho tới khi BE trả về trường break thật, rồi bật lại.
 */
const SHOW_BREAK = false;

const P1_THEME = {
  accent: P1_COLOR,
  panel: "bg-[#0c1018]",
  panelTint:
    "linear-gradient(175deg, rgba(55,138,221,0.34) 0%, rgba(55,138,221,0.10) 38%, rgba(10,14,20,1) 82%)",
  score: "text-white",
  glow: "rgba(55,138,221,0.55)",
  name: "text-white",
  label: "text-[#9cc9f2]",
  hint: "text-slate-400",
  pipEmpty: "bg-white/[0.08]",
};

const P2_THEME = {
  accent: P2_COLOR,
  panel: "bg-[#0c1018]",
  panelTint:
    "linear-gradient(175deg, rgba(239,68,68,0.34) 0%, rgba(239,68,68,0.10) 38%, rgba(10,14,20,1) 82%)",
  score: "text-[#ffe4e4]",
  glow: "rgba(239,68,68,0.55)",
  name: "text-white",
  label: "text-[#f5a8a8]",
  hint: "text-slate-400",
  pipEmpty: "bg-white/[0.08]",
};

function inferGameTypeLabel(match) {
  const name = match?.tournamentName || "";
  if (/8[- ]?ball/i.test(name)) return "8-Ball";
  if (/9[- ]?ball/i.test(name)) return "9-Ball";
  if (/10[- ]?ball/i.test(name)) return "10-Ball";
  return null;
}

function formatHeaderMeta(match) {
  const table =
    match?.tableNo != null ? `Bàn ${match.tableNo}` : `Trận #${match.id}`;
  const raceGame = [
    match?.raceTo != null ? `Đánh tới ${match.raceTo} ván` : null,
    inferGameTypeLabel(match),
  ]
    .filter(Boolean)
    .join(" · ");
  const code = [match?.stageName || match?.bracketType, match?.matchCode]
    .filter(Boolean)
    .join(" · ");
  return { table, raceGame, code };
}

function getRaceToLeader(scores, raceTo, p1Name, p2Name) {
  if (raceTo == null) return null;
  const p1Win = scores.p1 >= raceTo;
  const p2Win = scores.p2 >= raceTo;
  if (p1Win && !p2Win) return { name: p1Name, score: scores.p1, slot: 1 };
  if (p2Win && !p1Win) return { name: p2Name, score: scores.p2, slot: 2 };
  if (p1Win && p2Win) {
    if (scores.p1 > scores.p2)
      return { name: p1Name, score: scores.p1, slot: 1 };
    if (scores.p2 > scores.p1)
      return { name: p2Name, score: scores.p2, slot: 2 };
    return { name: p1Name, score: scores.p1, slot: 1 };
  }
  return null;
}

/** Luân phiên giao bóng theo tổng ván đã chơi (heuristic khi BE chưa có break). */
function getBreakSlot(scores) {
  return (scores.p1 + scores.p2) % 2 === 0 ? 1 : 2;
}

const ProgressPips = ({ score, raceTo, accent, emptyClass }) => {
  const total = Math.max(raceTo ?? 5, 1);
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-8 sm:w-10 rounded-sm transition-colors ${
            i < score ? "" : emptyClass
          }`}
          style={i < score ? { backgroundColor: accent } : undefined}
        />
      ))}
    </div>
  );
};

const ScorePanel = ({
  name,
  score,
  slot,
  theme,
  raceTo,
  canAdd,
  canUndo,
  finished,
  isWinner,
  dimmed,
  hasBreak,
  onTapPlus,
  onMinus,
}) => {
  // Pop nhẹ con số mỗi khi điểm thay đổi -> phản hồi xác nhận cho trọng tài.
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

  const borderStyle = isWinner
    ? {
        borderColor: theme.accent,
        borderWidth: 2,
        boxShadow: `0 0 40px -8px ${theme.accent}, inset 0 0 0 1px ${theme.accent}59`,
      }
    : { borderColor: "rgba(255,255,255,0.06)", borderWidth: 1 };

  return (
    <div
      className="relative flex flex-1 flex-col min-h-0 rounded-none overflow-hidden"
      style={borderStyle}
    >
      <div
        className={`flex flex-1 flex-col min-h-0 transition-opacity duration-300 ${
          dimmed ? "opacity-55" : "opacity-100"
        }`}
        style={{ background: theme.panelTint }}
      >
        {/* Nhãn + tên cơ thủ */}
        <div className="shrink-0 text-center px-3 pt-4 sm:pt-6">
          <div className="flex items-center justify-center gap-2 min-h-[1.75rem]">
            <span
              className={`font-semibold uppercase tracking-[0.22em] ${theme.label}`}
              style={{ fontSize: "clamp(0.7rem, 1.7vh, 0.9rem)" }}
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
          <div className="mt-2 inline-flex max-w-full items-center gap-2.5 rounded-full bg-white/[0.07] px-4 py-1.5 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
            <span
              className={`shrink-0 h-2.5 w-2.5 rounded-full transition-opacity ${
                hasBreak ? "opacity-100" : "hidden"
              }`}
              style={
                hasBreak
                  ? {
                      backgroundColor: theme.accent,
                      boxShadow: `0 0 0 3px ${theme.accent}40`,
                    }
                  : undefined
              }
              title={hasBreak ? "Đang giao bóng" : undefined}
              aria-hidden={!hasBreak}
            />
            <h2
              className={`font-semibold leading-tight line-clamp-1 ${theme.name}`}
              style={{ fontSize: "clamp(1.1rem, 3.4vh, 1.6rem)" }}
            >
              {name}
            </h2>
          </div>
        </div>

        {/* Vùng chạm +1 — số khổng lồ có glow + pip */}
        <button
          type="button"
          disabled={!canAdd}
          onClick={onTapPlus}
          className={`flex-1 flex flex-col items-center justify-center min-h-[6rem] w-full px-4 py-2 gap-4 sm:gap-6 touch-manipulation select-none transition-transform disabled:cursor-default ${
            canAdd ? "active:scale-[0.99] cursor-pointer" : ""
          }`}
          aria-label={`Cộng 1 điểm cho ${name}`}
        >
          <p
            className={`tabular-nums leading-none font-bold ${theme.score}`}
            style={{
              fontSize: "clamp(7rem, 38vh, 13rem)",
              fontVariantNumeric: "tabular-nums",
              textShadow: `0 0 48px ${theme.glow}`,
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
          />
        </button>
      </div>

      {/* Hàng thao tác: +1 điểm (chính) + hoàn tác */}
      <div className="shrink-0 flex items-stretch gap-2.5 px-3 sm:px-4 py-3.5 sm:py-4 bg-[#0a0e14]/85 border-t border-white/[0.06]">
        <button
          type="button"
          disabled={!canAdd}
          onClick={onTapPlus}
          className={`flex-1 inline-flex items-center justify-center gap-2.5 rounded-2xl min-h-[56px] py-3.5 font-bold uppercase tracking-wide transition-all touch-manipulation active:scale-[0.98] disabled:cursor-default ${
            canAdd
              ? "text-white"
              : "bg-white/[0.04] text-slate-500 ring-1 ring-inset ring-white/[0.06]"
          }`}
          style={
            canAdd
              ? {
                  backgroundColor: theme.accent,
                  boxShadow: `0 10px 26px -10px ${theme.accent}`,
                  fontSize: "clamp(1rem, 2.4vh, 1.25rem)",
                }
              : { fontSize: "clamp(0.95rem, 2.2vh, 1.15rem)" }
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
          className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-2xl px-4 sm:px-5 min-h-[56px] font-medium text-slate-400 bg-white/[0.05] ring-1 ring-inset ring-white/10 hover:bg-white/[0.09] hover:text-slate-200 disabled:opacity-25 disabled:pointer-events-none transition-colors touch-manipulation"
          style={{ fontSize: "clamp(0.95rem, 2.2vh, 1.15rem)" }}
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

/** Huy hiệu VS / vương miện ở giữa 2 panel — lấp khoảng trống trung tâm. */
const VersusBadge = ({ winnerAccent }) => {
  const isWinner = Boolean(winnerAccent);
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center"
      aria-hidden
    >
      {/* Đường chia dọc phát sáng */}
      <span
        className="absolute top-0 bottom-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.18) 80%, transparent 100%)",
        }}
      />
      {/* Huy hiệu tròn */}
      <span
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#0a0e14] font-black sm:h-28 sm:w-28"
        style={{
          border: `3px solid ${isWinner ? winnerAccent : "rgba(255,255,255,0.22)"}`,
          boxShadow: isWinner
            ? `0 0 44px -4px ${winnerAccent}`
            : `0 0 0 8px rgba(10,14,20,0.92), 0 0 34px -6px ${P1_COLOR}55, 0 0 34px -6px ${P2_COLOR}55`,
        }}
      >
        {isWinner ? (
          <Crown size={46} strokeWidth={2.2} style={{ color: winnerAccent }} />
        ) : (
          <span
            className="italic tracking-tight text-white"
            style={{
              fontSize: "clamp(1.7rem, 5vh, 3rem)",
              textShadow: "0 2px 14px rgba(0,0,0,0.6)",
            }}
          >
            VS
          </span>
        )}
      </span>
    </div>
  );
};

const StaffScoringPage = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [optimisticScores, setOptimisticScores] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [endOpen, setEndOpen] = useState(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);

  const incrementInFlight = useRef(0);

  const loadSnapshot = useCallback(async () => {
    try {
      const data = await getMatchDetail(matchId);
      setMatch(data);
      setOptimisticScores(null);
      setError(null);
    } catch (err) {
      setError(
        getFriendlyApiErrorMessage(
          err,
          "Không tải được dữ liệu trận đấu. Vui lòng thử lại."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    setLoading(true);
    loadSnapshot();
  }, [loadSnapshot]);

  const applyServerMatch = useCallback(
    (serverMatch) => {
      if (Number(serverMatch?.id) !== Number(matchId)) return;
      setMatch(serverMatch);
      if (incrementInFlight.current === 0) setOptimisticScores(null);
    },
    [matchId]
  );

  const handleMatchUpdate = useCallback(
    (updated) => applyServerMatch(updated),
    [applyServerMatch]
  );

  const handleBracketSync = useCallback(
    (matches) => {
      const found = matches?.find((m) => Number(m.id) === Number(matchId));
      if (found) applyServerMatch(found);
    },
    [matchId, applyServerMatch]
  );

  const { connectionState } = useTournamentSocket(match?.tournamentId, {
    enabled: Boolean(match?.tournamentId) && !loading,
    onMatchUpdate: handleMatchUpdate,
    onBracketSync: handleBracketSync,
    onReconnect: loadSnapshot,
  });

  const pending = isMatchPending(match?.status);
  const live = isMatchLive(match?.status);
  const finished = isMatchFinished(match?.status);

  const scores = useMemo(() => {
    if (optimisticScores) return optimisticScores;
    return {
      p1: match?.player1Score ?? 0,
      p2: match?.player2Score ?? 0,
    };
  }, [optimisticScores, match?.player1Score, match?.player2Score]);

  const raceTo = match?.raceTo ?? 5;
  const p1Name = getPlayerName(match?.player1, "Cơ thủ 1");
  const p2Name = getPlayerName(match?.player2, "Cơ thủ 2");

  const raceLeader = useMemo(
    () => getRaceToLeader(scores, raceTo, p1Name, p2Name),
    [scores, raceTo, p1Name, p2Name]
  );

  const anyoneReachedRace = raceLeader != null;
  const defaultWinnerId = pickDefaultWinnerId(match, scores.p1, scores.p2);
  const breakSlot = getBreakSlot(scores);

  const raceReached = scores.p1 >= raceTo || scores.p2 >= raceTo;
  const scoreInteractive = live && !finished && actionLoading !== "complete";
  const canAdd = scoreInteractive && !raceReached;
  const canUndo = scoreInteractive;

  const handleStart = async () => {
    if (!pending || actionLoading) return;
    setActionLoading("start");
    try {
      const updated = await startStaffMatch(matchId);
      setMatch(updated);
      setOptimisticScores(null);
      toast.success("Trận đấu đã bắt đầu");
    } catch (err) {
      toast.error(
        getFriendlyApiErrorMessage(err, "Không thể bắt đầu trận. Vui lòng thử lại.")
      );
      loadSnapshot();
    } finally {
      setActionLoading(null);
    }
  };

  const handleIncrement = async (playerSlot, delta) => {
    if (!scoreInteractive) return;
    if (delta > 0 && !canAdd) {
      toast.info("Đã đủ điểm thắng — hãy kết thúc trận");
      return;
    }

    const base = optimisticScores ?? {
      p1: match?.player1Score ?? 0,
      p2: match?.player2Score ?? 0,
    };

    // Chặn +1 khi đã có người đạt raceTo (kéo theo race condition optimistic)
    if (delta > 0 && (base.p1 >= raceTo || base.p2 >= raceTo)) {
      toast.info("Đã đủ điểm thắng — hãy kết thúc trận");
      return;
    }

    const next = { ...base };
    if (playerSlot === 1) next.p1 += delta;
    else next.p2 += delta;

    if (next.p1 < 0 || next.p2 < 0) return;
    if (next.p1 > raceTo || next.p2 > raceTo) return;

    setOptimisticScores(next);
    incrementInFlight.current += 1;
    try {
      const res = await incrementStaffScore(matchId, { playerSlot, delta });
      if (res?.match) setMatch(res.match);
    } catch (err) {
      const status = err?.response?.status;
      const msg = getFriendlyApiErrorMessage(
        err,
        "Không thể cập nhật điểm. Vui lòng thử lại."
      );
      if (status === 409) {
        toast.warn(msg);
      } else {
        toast.error(msg);
      }
      setOptimisticScores(null);
      loadSnapshot();
    } finally {
      incrementInFlight.current -= 1;
      if (incrementInFlight.current === 0) setOptimisticScores(null);
    }
  };

  const openEndDialog = () => {
    if (!live || finished) return;
    const winner =
      defaultWinnerId ??
      (scores.p1 > scores.p2
        ? match?.player1?.id
        : scores.p2 > scores.p1
          ? match?.player2?.id
          : null);
    setSelectedWinnerId(winner);
    setEndOpen(true);
  };

  const handleComplete = async () => {
    if (!selectedWinnerId) {
      toast.warn("Vui lòng chọn người thắng");
      return;
    }
    setActionLoading("complete");
    try {
      const updated = await completeStaffMatch(matchId, {
        winnerParticipantId: selectedWinnerId,
      });
      setMatch(updated);
      setOptimisticScores(null);
      setEndOpen(false);
      toast.success("Đã kết thúc trận đấu");
    } catch (err) {
      toast.error(
        getFriendlyApiErrorMessage(err, "Không thể kết thúc trận. Vui lòng thử lại.")
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex flex-col">
        <div className="h-16 border-b border-white/5 bg-[#0f141c] animate-pulse" />
        <div className="flex-1 flex">
          <div className="flex-1 animate-pulse" style={{ background: P1_THEME.panelTint }} />
          <div className="flex-1 animate-pulse" style={{ background: P2_THEME.panelTint }} />
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-300 font-normal">{error || "Không tìm thấy trận đấu"}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadSnapshot}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 text-sm font-medium"
          >
            Thử lại
          </button>
          <button
            type="button"
            onClick={() => navigate("/staff/matches")}
            className="rounded-xl border border-slate-700 text-slate-400 hover:text-white px-5 py-2.5 text-sm font-normal"
          >
            Về danh sách
          </button>
        </div>
      </div>
    );
  }

  const header = formatHeaderMeta(match);
  const startDisabled = !pending || Boolean(actionLoading) || finished;

  const statusLabel = finished ? "Đã xong" : live ? "Đang đấu" : "Sắp tới";

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col landscape:max-h-screen font-normal">
      {/* Keyframe pop cho con số — chèn tại chỗ nên không cần sửa CSS global */}
      <style>{`
        @keyframes scorePop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
      `}</style>

      {/* Header — gọn 1 hàng */}
      <header
        className="shrink-0 flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-white/[0.08] bg-[#0f141c]"
        style={{ boxShadow: "0 1px 0 0 rgba(255,255,255,0.04)" }}
      >
        <button
          type="button"
          onClick={() => navigate("/staff/matches")}
          className="shrink-0 rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors touch-manipulation"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex flex-1 min-w-0 items-center gap-2.5">
          <h1
            className="shrink-0 font-bold text-white leading-none tabular-nums"
            style={{ fontSize: "clamp(1.2rem, 3.4vh, 1.6rem)" }}
          >
            {header.table}
          </h1>
          {header.raceGame && (
            <span className="shrink-0 inline-flex items-center rounded-md bg-white/[0.06] px-2.5 py-1 text-xs sm:text-sm font-medium text-slate-300 ring-1 ring-inset ring-white/10">
              {header.raceGame}
            </span>
          )}
          {header.code && (
            <span className="hidden md:inline truncate text-xs font-normal text-slate-500">
              {header.code}
            </span>
          )}
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
            finished
              ? "bg-slate-500/15 text-slate-300 ring-slate-500/25"
              : live
                ? "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30"
                : "bg-amber-500/15 text-amber-400 ring-amber-500/30"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              finished
                ? "bg-slate-400"
                : live
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
            }`}
          />
          {statusLabel}
        </span>

        <SocketConnectionBadge
          connectionState={connectionState}
          compact
          className="!bg-slate-800/90 !text-slate-400 !ring-slate-700 shrink-0 hidden sm:inline-flex"
        />
      </header>

      <div className="shrink-0 px-3 pt-2">
        <SocketReconnectBanner connectionState={connectionState} />
      </div>

      {/* Banner đủ điểm */}
      {live && anyoneReachedRace && raceLeader && (
        <div
          className="shrink-0 mx-3 mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/30 px-4 py-3"
          role="status"
        >
          <p className="text-sm sm:text-base font-normal text-emerald-300/95 leading-snug flex items-start sm:items-center gap-2 flex-1 min-w-0">
            <Flag size={18} className="shrink-0 text-emerald-400 mt-0.5 sm:mt-0" />
            <span>
              <span className="font-medium text-emerald-200">{raceLeader.name}</span>{" "}
              đã đạt{" "}
              <span className="tabular-nums font-medium">
                {raceLeader.score}/{raceTo}
              </span>{" "}
              — có thể kết thúc trận
            </span>
          </p>
          <button
            type="button"
            onClick={openEndDialog}
            disabled={actionLoading === "complete"}
            className="shrink-0 self-center rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-medium text-base sm:text-lg px-6 py-3 min-h-[48px] transition-colors touch-manipulation whitespace-nowrap"
          >
            Kết thúc trận
          </button>
        </div>
      )}

      {/* Hai panel — luôn cạnh nhau để trọng tài so sánh tỉ số nhanh */}
      <div className="relative flex-1 flex flex-row min-h-0">
        <ScorePanel
          name={p1Name}
          score={scores.p1}
          slot={1}
          theme={P1_THEME}
          raceTo={raceTo}
          canAdd={canAdd}
          canUndo={canUndo}
          finished={finished}
          isWinner={raceLeader?.slot === 1}
          dimmed={anyoneReachedRace && raceLeader?.slot !== 1}
          hasBreak={SHOW_BREAK && breakSlot === 1 && live}
          onTapPlus={() => handleIncrement(1, 1)}
          onMinus={() => handleIncrement(1, -1)}
        />

        <VersusBadge
          winnerAccent={
            anyoneReachedRace
              ? raceLeader?.slot === 1
                ? P1_COLOR
                : P2_COLOR
              : null
          }
        />

        <ScorePanel
          name={p2Name}
          score={scores.p2}
          slot={2}
          theme={P2_THEME}
          raceTo={raceTo}
          canAdd={canAdd}
          canUndo={canUndo}
          finished={finished}
          isWinner={raceLeader?.slot === 2}
          dimmed={anyoneReachedRace && raceLeader?.slot !== 2}
          hasBreak={SHOW_BREAK && breakSlot === 2 && live}
          onTapPlus={() => handleIncrement(2, 1)}
          onMinus={() => handleIncrement(2, -1)}
        />
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-2.5 border-t border-white/[0.06] bg-[#0f141c] safe-area-pb">
        {pending && !finished && (
          <div className="flex justify-center">
            <button
              type="button"
              disabled={startDisabled}
              onClick={handleStart}
              className="w-full max-w-sm rounded-xl bg-[#378add] hover:brightness-110 disabled:bg-slate-800 disabled:text-slate-600 text-white font-medium py-3.5 text-base transition-all touch-manipulation min-h-[48px]"
            >
              {actionLoading === "start" ? "Đang bắt đầu…" : "Bắt đầu trận"}
            </button>
          </div>
        )}

        {live && !finished && !anyoneReachedRace && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={openEndDialog}
              disabled={actionLoading === "complete"}
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 min-h-[48px] font-semibold text-slate-300 bg-white/[0.06] ring-1 ring-inset ring-white/[0.12] hover:bg-white/[0.1] hover:text-white disabled:opacity-50 transition-colors touch-manipulation"
              style={{ fontSize: "clamp(0.95rem, 2.2vh, 1.15rem)" }}
            >
              <Flag size={18} className="opacity-80" />
              Kết thúc trận
            </button>
          </div>
        )}

        {finished && (
          <div className="text-center py-1 space-y-2">
            <p className="text-xs font-normal text-slate-500">Kết quả</p>
            <p
              className="tabular-nums font-medium text-white"
              style={{ fontSize: "clamp(2rem, 8vh, 3rem)" }}
            >
              <span style={{ color: P1_COLOR }}>{scores.p1}</span>
              <span className="mx-3 text-slate-600">—</span>
              <span style={{ color: P2_COLOR }}>{scores.p2}</span>
            </p>
            {match.winner && (
              <p className="text-sm font-medium text-emerald-400">
                Thắng: {getPlayerName(match.winner)}
              </p>
            )}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => navigate("/staff/matches")}
                className="rounded-lg border border-slate-700 text-slate-400 hover:text-white px-6 py-2.5 text-sm font-normal"
              >
                Về danh sách trận
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* Dialog xác nhận */}
      {endOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => actionLoading !== "complete" && setEndOpen(false)}
            role="presentation"
            aria-hidden
          />
          <div
            className="relative w-full max-w-md rounded-2xl bg-[#141a24] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-dialog-title"
          >
            <div className="px-5 py-4 border-b border-white/8">
              <h3 id="end-dialog-title" className="text-lg font-medium text-white">
                Xác nhận kết thúc trận
              </h3>
            </div>

            <div className="px-5 py-5 space-y-5 overflow-y-auto">
              <div className="text-center rounded-xl bg-black/30 py-4 ring-1 ring-white/5">
                <p className="text-xs font-normal text-slate-500 mb-2">Tỉ số cuối</p>
                <p
                  className="tabular-nums font-medium text-white"
                  style={{ fontSize: "2.5rem" }}
                >
                  <span style={{ color: P1_COLOR }}>{scores.p1}</span>
                  <span className="mx-2 text-slate-600">—</span>
                  <span style={{ color: P2_COLOR }}>{scores.p2}</span>
                </p>
              </div>

              <p className="text-sm font-normal text-slate-400">Người thắng:</p>

              <div className="space-y-2">
                {[match.player1, match.player2].filter(Boolean).map((player) => {
                  const isP1 = player.id === match.player1?.id;
                  const sc = isP1 ? scores.p1 : scores.p2;
                  const selected = selectedWinnerId === player.id;
                  const color = isP1 ? P1_COLOR : P2_COLOR;
                  return (
                    <label
                      key={player.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                        selected
                          ? "border-white/25 bg-white/[0.06]"
                          : "border-white/10 hover:border-white/15 bg-black/20"
                      }`}
                      style={selected ? { borderColor: `${color}88` } : undefined}
                    >
                      <input
                        type="radio"
                        name="winner"
                        className="h-4 w-4 accent-emerald-500"
                        checked={selected}
                        onChange={() => setSelectedWinnerId(player.id)}
                      />
                      <span className="flex-1 font-normal text-white">
                        {getPlayerName(player)}
                      </span>
                      <span
                        className="text-xl font-medium tabular-nums"
                        style={{ color }}
                      >
                        {sc}
                      </span>
                    </label>
                  );
                })}
              </div>

              {!defaultWinnerId && (
                <p className="text-sm font-normal text-amber-300/90 bg-amber-500/10 rounded-lg px-3 py-2 ring-1 ring-amber-500/20">
                  Tỉ số hòa — vui lòng chọn người thắng thủ công.
                </p>
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/8 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEndOpen(false)}
                disabled={actionLoading === "complete"}
                className="rounded-xl px-4 py-2.5 text-sm font-normal text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleComplete}
                disabled={!selectedWinnerId || actionLoading === "complete"}
                className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-medium px-5 py-2.5 text-sm"
              >
                {actionLoading === "complete" ? "Đang xử lý…" : "Xác nhận kết thúc"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffScoringPage;