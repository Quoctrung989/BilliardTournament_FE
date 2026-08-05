import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Crown, Flag } from "lucide-react";
import { toast } from "react-toastify";
import { getMatchDetail } from "../../../api/matchApi";
import { getParticipantProfile } from "../../../api/publicTournamentApi";
import {
  completeStaffMatch,
  incrementStaffScore,
  startStaffMatch,
} from "../../../api/staffMatchApi";
import SocketConnectionBadge from "../../../components/shared/SocketConnectionBadge";
import SocketReconnectBanner from "../../../components/shared/SocketReconnectBanner";
import {
  ShotClockControls,
  ShotClockDial,
  ShotClockRuleHint,
} from "../../../components/staff/ShotClock";
import { useShotClock } from "../../../hooks/useShotClock";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { useWakeLock } from "../../../hooks/useWakeLock";
import { getFriendlyApiErrorMessage } from "../../../utils/apiError";
import {
  getPlayerName,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
  pickDefaultWinnerId,
} from "../../../utils/refereeMatch";
import ScorePanel from "./ScorePanel";

const P1_COLOR = "#378add";
const P2_COLOR = "#ef4444";

const P1_THEME = {
  accent: P1_COLOR,
  panelTint:
    "linear-gradient(175deg, rgba(55,138,221,0.34) 0%, rgba(55,138,221,0.10) 38%, rgba(10,14,20,1) 82%)",
  score: "text-white",
  glow: "rgba(55,138,221,0.55)",
  name: "text-white",
  label: "text-[#9cc9f2]",
  pipEmpty: "bg-white/[0.08]",
};

const P2_THEME = {
  accent: P2_COLOR,
  panelTint:
    "linear-gradient(175deg, rgba(239,68,68,0.34) 0%, rgba(239,68,68,0.10) 38%, rgba(10,14,20,1) 82%)",
  score: "text-[#ffe4e4]",
  glow: "rgba(239,68,68,0.55)",
  name: "text-white",
  label: "text-[#f5a8a8]",
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
    match?.raceTo != null ? `Race to ${match.raceTo}` : null,
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

/** Huy hiệu VS / vương miện — dùng khi đồng hồ tắt hoặc trận chưa/đã kết thúc. */
const VersusBadge = ({ winnerAccent }) => {
  const isWinner = Boolean(winnerAccent);
  return (
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
  const [avatars, setAvatars] = useState({ 1: null, 2: null });

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

  /* Ảnh cơ thủ — API trận không kèm avatar nên lấy riêng từ hồ sơ công khai. */
  const p1Id = match?.player1?.id;
  const p2Id = match?.player2?.id;
  useEffect(() => {
    let cancelled = false;
    const fetchAvatar = async (participantId) => {
      if (!participantId) return null;
      try {
        const profile = await getParticipantProfile(participantId);
        return profile?.avatarUrl || null;
      } catch {
        return null;
      }
    };

    (async () => {
      const [a1, a2] = await Promise.all([fetchAvatar(p1Id), fetchAvatar(p2Id)]);
      if (!cancelled) setAvatars({ 1: a1, 2: a2 });
    })();

    return () => {
      cancelled = true;
    };
  }, [p1Id, p2Id]);

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

  useWakeLock(live);

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

  /* Ai vừa thắng ván — suy từ điểm số vừa tăng, cập nhật ngay trong render để
     đồng hồ chọn đúng người phá ván kế tiếp. */
  const scoreTrackRef = useRef(null);
  if (scoreTrackRef.current === null) {
    scoreTrackRef.current = { p1: scores.p1, p2: scores.p2, winner: null };
  } else {
    const prev = scoreTrackRef.current;
    if (prev.p1 !== scores.p1 || prev.p2 !== scores.p2) {
      scoreTrackRef.current = {
        p1: scores.p1,
        p2: scores.p2,
        winner:
          scores.p1 > prev.p1 ? 1 : scores.p2 > prev.p2 ? 2 : prev.winner,
      };
    }
  }
  const lastRackWinnerSlot = scoreTrackRef.current.winner;

  const handleShotClockExpire = useCallback(
    (offenderSlot) => {
      const offender = offenderSlot === 1 ? p1Name : p2Name;
      const opponent = offenderSlot === 1 ? p2Name : p1Name;
      toast.warn(
        `Hết giờ — ${offender} phạm lỗi, mất lượt. ${opponent} được bi tự do.`,
        { autoClose: 6000 }
      );
    },
    [p1Name, p2Name]
  );

  const clock = useShotClock({
    matchId,
    active: live && !finished,
    rackIndex: match ? scores.p1 + scores.p2 : null,
    lastRackWinnerSlot,
    onExpire: handleShotClockExpire,
  });

  const raceLeader = useMemo(
    () => getRaceToLeader(scores, raceTo, p1Name, p2Name),
    [scores, raceTo, p1Name, p2Name]
  );

  const anyoneReachedRace = raceLeader != null;
  const defaultWinnerId = pickDefaultWinnerId(match, scores.p1, scores.p2);

  const raceReached = scores.p1 >= raceTo || scores.p2 >= raceTo;
  const scoreInteractive = live && !finished && actionLoading !== "complete";
  const canAdd = scoreInteractive && !raceReached;
  const canUndo = scoreInteractive;

  const showClock = clock.enabled && live && !finished;

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
  const turnAccent = clock.turnSlot === 1 ? P1_COLOR : P2_COLOR;
  /* Khoảng trống mỗi bên dành cho đồng hồ / huy hiệu VS ở tâm màn hình. */
  const centerGap = showClock
    ? "clamp(5rem, 9vw, 8rem)"
    : "clamp(3.5rem, 7vw, 5.5rem)";

  return (
    <div className="min-h-screen bg-[#0a0e14] text-white flex flex-col landscape:max-h-screen font-normal">
      <style>{`
        @keyframes scorePop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.14); }
          100% { transform: scale(1); }
        }
        @keyframes shotClockPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.06); }
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

      {/* Hai panel — ảnh cơ thủ sát mép ngoài, tỉ số dồn vào giữa */}
      <div className="relative flex-1 flex flex-row min-h-0">
        <ScorePanel
          name={p1Name}
          score={scores.p1}
          slot={1}
          theme={P1_THEME}
          raceTo={raceTo}
          avatarUrl={avatars[1]}
          centerGap={centerGap}
          canAdd={canAdd}
          canUndo={canUndo}
          finished={finished}
          isWinner={raceLeader?.slot === 1}
          dimmed={anyoneReachedRace && raceLeader?.slot !== 1}
          hasTurn={showClock && clock.turnSlot === 1}
          onTapPlus={() => handleIncrement(1, 1)}
          onMinus={() => handleIncrement(1, -1)}
        />

        {/* Cụm giữa: đồng hồ khi đang đấu, huy hiệu VS khi không */}
        <div className="absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center">
          <span
            className="absolute top-0 bottom-0 w-px pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.18) 20%, rgba(255,255,255,0.18) 80%, transparent 100%)",
            }}
            aria-hidden
          />
          {showClock ? (
            <button
              type="button"
              onClick={clock.toggleRun}
              className="rounded-full touch-manipulation"
              title={clock.running ? "Tạm dừng đồng hồ" : "Chạy đồng hồ"}
              aria-label={clock.running ? "Tạm dừng đồng hồ" : "Chạy đồng hồ"}
            >
              <ShotClockDial
                remainingSeconds={clock.remainingSeconds}
                totalSeconds={clock.totalSeconds}
                accent={turnAccent}
                running={clock.running}
                isWarning={clock.isWarning}
                isBreakShot={clock.isBreakShot}
                size={112}
              />
            </button>
          ) : (
            <div className="pointer-events-none" aria-hidden>
              <VersusBadge
                winnerAccent={
                  anyoneReachedRace
                    ? raceLeader?.slot === 1
                      ? P1_COLOR
                      : P2_COLOR
                    : null
                }
              />
            </div>
          )}
        </div>

        <ScorePanel
          name={p2Name}
          score={scores.p2}
          slot={2}
          theme={P2_THEME}
          raceTo={raceTo}
          avatarUrl={avatars[2]}
          centerGap={centerGap}
          canAdd={canAdd}
          canUndo={canUndo}
          finished={finished}
          isWinner={raceLeader?.slot === 2}
          dimmed={anyoneReachedRace && raceLeader?.slot !== 2}
          hasTurn={showClock && clock.turnSlot === 2}
          onTapPlus={() => handleIncrement(2, 1)}
          onMinus={() => handleIncrement(2, -1)}
        />
      </div>

      {/* Footer */}
      <footer className="shrink-0 px-4 py-2.5 border-t border-white/[0.06] bg-[#0f141c] safe-area-pb space-y-2">
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

        {live && !finished && (
          <>
            <div className="flex justify-center">
              <ShotClockControls clock={clock} disabled={!live || finished} />
            </div>
            {clock.enabled && <ShotClockRuleHint clock={clock} />}
          </>
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
