import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getPublicMatches } from "../../api/matchApi";
import { getPublicTournamentDetail } from "../../api/publicTournamentApi";
import SocketConnectionBadge from "../../components/shared/SocketConnectionBadge";
import { useTournamentSocket } from "../../hooks/useTournamentSocket";
import { useWakeLock } from "../../hooks/useWakeLock";
import { getFriendlyApiErrorMessage } from "../../utils/apiError";
import { isMatchFinished, isMatchLive } from "../../utils/refereeMatch";
import TvLiveBoard from "./TvLiveBoard";
import TvPaginationBar from "./TvPaginationBar";
import TvScreenHeader from "./TvScreenHeader";
import TvWaitingScreen from "./TvWaitingScreen";
import {
  FINISHED_RETAIN_MS,
  PAGE_ROTATE_MS,
  TV_BG,
  buildFormatLabel,
  getLayout,
  getNextScheduledMatch,
  getRoundLabel,
  sortByTable,
} from "./tvLayout";
import "./tvLive.css";

const FLASH_MS = 300;

const TournamentLiveTvPage = () => {
  const { id } = useParams();
  const tournamentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [matchMap, setMatchMap] = useState({});
  const [tournamentMeta, setTournamentMeta] = useState(null);
  const [recentFinished, setRecentFinished] = useState({});
  const [pageIndex, setPageIndex] = useState(0);
  const [flashState, setFlashState] = useState({});

  const flashTimersRef = useRef({});

  useWakeLock(Boolean(tournamentId));

  const triggerScoreFlash = useCallback((matchId, p1Changed, p2Changed) => {
    const idStr = String(matchId);
    setFlashState((prev) => ({
      ...prev,
      [idStr]: { cell: true, p1: p1Changed, p2: p2Changed },
    }));

    if (flashTimersRef.current[idStr]) {
      clearTimeout(flashTimersRef.current[idStr]);
    }

    flashTimersRef.current[idStr] = setTimeout(() => {
      setFlashState((prev) => {
        const next = { ...prev };
        delete next[idStr];
        return next;
      });
      delete flashTimersRef.current[idStr];
    }, FLASH_MS);
  }, []);

  const belongsToTournament = useCallback(
    (match) =>
      match?.tournamentId == null || Number(match.tournamentId) === tournamentId,
    [tournamentId]
  );

  const registerFinished = useCallback((match) => {
    if (!match?.id || !isMatchFinished(match.status)) return;
    setRecentFinished((prev) => ({
      ...prev,
      [match.id]: { match, expiresAt: Date.now() + FINISHED_RETAIN_MS },
    }));
  }, []);

  const upsertMatch = useCallback(
    (incoming) => {
      if (!incoming?.id || !belongsToTournament(incoming)) return;

      let retainFinished = false;
      setMatchMap((prev) => {
        const old = prev[incoming.id];
        const p1Changed =
          old != null && old.player1Score !== incoming.player1Score;
        const p2Changed =
          old != null && old.player2Score !== incoming.player2Score;
        if (p1Changed || p2Changed) {
          triggerScoreFlash(incoming.id, p1Changed, p2Changed);
        }
        if (
          old &&
          isMatchLive(old.status) &&
          isMatchFinished(incoming.status)
        ) {
          retainFinished = true;
        }
        return { ...prev, [incoming.id]: incoming };
      });

      if (retainFinished) registerFinished(incoming);
    },
    [belongsToTournament, registerFinished, triggerScoreFlash]
  );

  const applyBracketSync = useCallback(
    (matches) => {
      if (!Array.isArray(matches)) return;
      matches.forEach((m) => {
        if (!m?.id || !belongsToTournament(m)) return;
        upsertMatch(m);
      });
    },
    [belongsToTournament, upsertMatch]
  );

  const loadSnapshot = useCallback(async () => {
    if (!tournamentId) return;

    try {
      setError(null);
      const [matches, detail] = await Promise.all([
        getPublicMatches(tournamentId),
        getPublicTournamentDetail(tournamentId).catch(() => null),
      ]);

      const nextMap = {};
      (matches || []).forEach((m) => {
        if (m?.id != null) nextMap[m.id] = m;
      });

      setMatchMap(nextMap);
      if (detail) setTournamentMeta(detail);
      setHasSnapshot(true);
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
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    setHasSnapshot(false);
    setMatchMap({});
    setRecentFinished({});
    setPageIndex(0);
    loadSnapshot();
  }, [loadSnapshot]);

  const { connectionState } = useTournamentSocket(tournamentId, {
    enabled: hasSnapshot && !loading && Boolean(tournamentId),
    onMatchUpdate: upsertMatch,
    onBracketSync: applyBracketSync,
    onReconnect: loadSnapshot,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRecentFinished((prev) => {
        let changed = false;
        const next = {};
        for (const [mid, item] of Object.entries(prev)) {
          if (item.expiresAt > now) next[mid] = item;
          else changed = true;
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(flashTimersRef.current).forEach((t) => clearTimeout(t));
      flashTimersRef.current = {};
    };
  }, []);

  const liveMatches = useMemo(() => {
    const pool = Object.values(matchMap).filter(
      (m) => isMatchLive(m.status) && belongsToTournament(m)
    );
    return sortByTable(pool);
  }, [matchMap, belongsToTournament]);

  /** LIVE + trận vừa kết thúc (giữ 15s, nhãn THẮNG). */
  const displayMatches = useMemo(() => {
    const liveIds = new Set(liveMatches.map((m) => m.id));
    const retained = Object.values(recentFinished)
      .filter((item) => !liveIds.has(item.match.id))
      .map((item) => ({ ...item.match, _retained: true }));
    return sortByTable([...liveMatches, ...retained]);
  }, [liveMatches, recentFinished]);

  const layout = useMemo(
    () => getLayout(displayMatches, { pageIndex }),
    [displayMatches, pageIndex]
  );

  useEffect(() => {
    setPageIndex(0);
  }, [displayMatches.length]);

  useEffect(() => {
    if (!layout.paginated || layout.totalPages <= 1) return undefined;
    const timer = setInterval(() => {
      setPageIndex((p) => (p + 1) % layout.totalPages);
    }, PAGE_ROTATE_MS);
    return () => clearInterval(timer);
  }, [layout.paginated, layout.totalPages]);

  const tournamentName = useMemo(() => {
    const fromMeta = tournamentMeta?.name?.trim();
    if (fromMeta) return fromMeta;
    const first = Object.values(matchMap)[0];
    return first?.tournamentName?.trim() || null;
  }, [matchMap, tournamentMeta]);

  const formatLabel = useMemo(
    () => buildFormatLabel(tournamentMeta, liveMatches),
    [tournamentMeta, liveMatches]
  );

  const roundLabel = useMemo(() => getRoundLabel(liveMatches), [liveMatches]);

  const nextScheduledAt = useMemo(
    () => getNextScheduledMatch(Object.values(matchMap))?.scheduledAt ?? null,
    [matchMap]
  );

  const logoUrl =
    tournamentMeta?.thumbnailUrl || tournamentMeta?.bannerUrl || null;

  useEffect(() => {
    document.title = tournamentName
      ? `${tournamentName} — Tỉ số trực tiếp`
      : "Tỉ số trực tiếp";
    return () => {
      document.title = "BTMS BILLIARDS";
    };
  }, [tournamentName]);

  if (!tournamentId) {
    return (
      <div
        className="flex h-screen items-center justify-center text-zinc-400"
        style={{ background: TV_BG }}
      >
        Mã giải đấu không hợp lệ.
      </div>
    );
  }

  const showBoard = !loading && displayMatches.length > 0;
  const showWaiting = !loading && displayMatches.length === 0;

  return (
    <div
      className="relative flex h-screen max-h-screen flex-col overflow-hidden text-white selection:bg-transparent"
      style={{
        background: `radial-gradient(circle at top left, rgba(16, 185, 129, 0.16), transparent 32%), linear-gradient(135deg, #06080d 0%, #0b1220 48%, #06080d 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_28%)]" />

      <div className="pointer-events-none absolute right-[4%] top-[4%] z-30">
        <SocketConnectionBadge
          connectionState={connectionState}
          compact
          className="!bg-[#0D1119]/90 !text-zinc-600 !ring-zinc-800/80 backdrop-blur-sm"
        />
      </div>

      {showBoard && (
        <TvScreenHeader
          tournamentName={tournamentName}
          formatLabel={formatLabel}
          roundLabel={roundLabel}
          liveTableCount={liveMatches.length}
        />
      )}

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-[4%] pb-[3%] pt-[2%]">
        {loading && (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-lg text-zinc-500">Đang tải tỉ số…</p>
          </div>
        )}

        {!loading && error && showWaiting && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
            <p className="text-lg text-amber-400/90">{error}</p>
            <p className="text-sm text-zinc-600">
              Kết nối sẽ được thử lại tự động.
            </p>
          </div>
        )}

        {showWaiting && !error && (
          <TvWaitingScreen
            tournamentName={tournamentName}
            logoUrl={logoUrl}
            nextScheduledAt={nextScheduledAt}
          />
        )}

        {showBoard && (
          <TvLiveBoard
            layout={layout}
            flashState={flashState}
            pageKey={`${layout.mode}-${layout.pageIndex}-${layout.count}`}
            tournamentName={tournamentName}
            logoUrl={logoUrl}
          />
        )}
      </main>

      {showBoard && layout.paginated && layout.totalPages > 1 && (
        <TvPaginationBar
          pageIndex={layout.pageIndex}
          totalPages={layout.totalPages}
          liveTableCount={liveMatches.length}
          progressKey={`${layout.pageIndex}-${layout.count}`}
        />
      )}
    </div>
  );
};

export default TournamentLiveTvPage;
