import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Clock, Crown, Monitor, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { managerMatchApi } from "../../../api/matchApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import SocketConnectionBadge from "../../../components/shared/SocketConnectionBadge";
import SocketReconnectBanner from "../../../components/shared/SocketReconnectBanner";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { getFriendlyApiErrorMessage } from "../../../utils/apiError";
import {
  formatMatchScheduleLabel,
  getPlayerName,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
} from "../../../utils/refereeMatch";

const STATUS_ORDER = {
  IN_PROGRESS: 0,
  PENDING: 1,
  COMPLETED: 2,
  WALKOVER: 2,
  BYE: 3,
};

const TABLE_RANGES = [
  { key: "all", label: "Tất cả bàn" },
  { key: "1-10", label: "Bàn 1-10", from: 1, to: 10 },
  { key: "11-20", label: "Bàn 11-20", from: 11, to: 20 },
  { key: "21-30", label: "Bàn 21-30", from: 21, to: 30 },
  { key: "31-40", label: "Bàn 31-40", from: 31, to: 40 },
  { key: "custom", label: "Tự chọn dải" },
];

/** @typedef {'live' | 'all'} StatusTab */

const STATUS_TABS = [
  { key: "live", label: "Đang diễn ra" },
  { key: "all", label: "Tất cả" },
];

const parseIntOrNull = (value) => {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const getTableBounds = (rangeKey, customFrom, customTo) => {
  const range = TABLE_RANGES.find((r) => r.key === rangeKey);
  if (!range || range.key === "all") return { from: null, to: null };
  if (range.key === "custom") {
    return {
      from: parseIntOrNull(customFrom),
      to: parseIntOrNull(customTo),
    };
  }
  return { from: range.from, to: range.to };
};

const sortByLiveReadyFinished = (matches) =>
  [...matches].sort((a, b) => {
    const sa = STATUS_ORDER[a.status] ?? 9;
    const sb = STATUS_ORDER[b.status] ?? 9;
    if (sa !== sb) return sa - sb;
    const ta = a.tableNo ?? 9999;
    const tb = b.tableNo ?? 9999;
    if (ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });

const LiveBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm shadow-emerald-200">
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white dark:bg-[#161a22] opacity-70" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-white dark:bg-[#161a22]" />
    </span>
    Đang đấu
  </span>
);

const ReadyBadge = () => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/65 ring-1 ring-inset ring-slate-200 dark:ring-white/15 px-2.5 py-1 text-xs font-semibold">
    Sẵn sàng
  </span>
);

const FinishedBadge = () => (
  <span className="inline-flex items-center rounded-full bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-white/55 ring-1 ring-inset ring-slate-300/70 dark:ring-white/15 px-2.5 py-1 text-xs font-semibold">
    Đã xong
  </span>
);

const MatchCard = ({ match, isFlashing }) => {
  const live = isMatchLive(match.status);
  const ready = isMatchPending(match.status);
  const finished = isMatchFinished(match.status);

  const p1 = getPlayerName(match.player1, "Cơ thủ 1");
  const p2 = getPlayerName(match.player2, "Cơ thủ 2");
  const s1 = match.player1Score ?? 0;
  const s2 = match.player2Score ?? 0;
  const winnerId = match.winner?.id ?? null;
  const p1Won = finished && winnerId != null && winnerId === match.player1?.id;
  const p2Won = finished && winnerId != null && winnerId === match.player2?.id;

  const scheduleLabel = ready
    ? formatMatchScheduleLabel(match.scheduledAt)
    : null;

  let cardClass =
    "rounded-xl border p-4 shadow-sm transition-all duration-300";
  if (live) {
    cardClass +=
      " border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-white shadow-emerald-100/70 ring-1 ring-emerald-100";
  } else if (finished) {
    cardClass += " border-slate-200/80 bg-slate-50/80 opacity-75 dark:border-white/10 dark:bg-white/[0.03]";
  } else {
    cardClass += " border-slate-200 bg-white dark:border-white/10 dark:bg-[#161a22]";
  }
  if (isFlashing) cardClass += " ws-flash";

  return (
    <article className={cardClass}>
      <div className="flex items-center justify-between gap-2 mb-3">
        {live ? <LiveBadge /> : ready ? <ReadyBadge /> : <FinishedBadge />}
        <span
          className={`text-xs font-medium tabular-nums ${
            live ? "text-emerald-700 dark:text-emerald-300" : finished ? "text-slate-400 dark:text-white/35" : "text-slate-500 dark:text-white/60"
          }`}
        >
          {match.tableNo != null ? `Bàn ${match.tableNo}` : "Chưa gán bàn"}
        </span>
      </div>

      <div className="space-y-2.5">
        <p
          className={`text-sm truncate flex items-center gap-1.5 ${
            p1Won
              ? "font-bold text-slate-900 dark:text-white"
              : finished
                ? "font-medium text-slate-500 dark:text-white/55"
                : "font-medium text-slate-800 dark:text-white/85"
          }`}
        >
          {p1Won && (
            <Crown size={14} className="shrink-0 text-amber-500" aria-hidden />
          )}
          <span className="truncate">{p1}</span>
        </p>

        {/* Tỉ số: LIVE/FINISHED hiện số; READY không bao giờ hiện 0–0 */}
        {live && (
          <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none tracking-tight">
            <span className="text-emerald-700">{s1}</span>
            <span className="mx-2 text-slate-300 font-bold">–</span>
            <span className="text-emerald-700">{s2}</span>
          </p>
        )}

        {finished && (
          <p className="text-2xl font-bold text-slate-600 dark:text-white/70 tabular-nums leading-none">
            {s1}
            <span className="mx-2 text-slate-300 font-semibold">–</span>
            {s2}
          </p>
        )}

        {ready && (
          <p className="flex items-center gap-1.5 text-base font-medium text-slate-400 dark:text-white/40 tabular-nums">
            {match.scheduledAt ? (
              <>
                <Clock size={15} className="shrink-0 opacity-70" />
                <span>{scheduleLabel}</span>
              </>
            ) : (
              <span className="text-2xl font-semibold tracking-wide text-slate-300">
                —
              </span>
            )}
          </p>
        )}

        <p
          className={`text-sm truncate flex items-center gap-1.5 ${
            p2Won
              ? "font-bold text-slate-900 dark:text-white"
              : finished
                ? "font-medium text-slate-500 dark:text-white/55"
                : "font-medium text-slate-800 dark:text-white/85"
          }`}
        >
          {p2Won && (
            <Crown size={14} className="shrink-0 text-amber-500" aria-hidden />
          )}
          <span className="truncate">{p2}</span>
        </p>

        {finished && match.winner && (
          <p className="text-xs font-medium text-amber-700/90 pt-0.5">
            Thắng: {getPlayerName(match.winner)}
          </p>
        )}

        {match.matchCode && (
          <p className="text-[11px] text-slate-400 dark:text-white/40 truncate">{match.matchCode}</p>
        )}
      </div>
    </article>
  );
};

const ManagerLiveDashboardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasSnapshot, setHasSnapshot] = useState(false);
  const [matchMap, setMatchMap] = useState({});
  const [rangeKey, setRangeKey] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  /** Mặc định: Đang diễn ra — thứ manager quan tâm nhất lúc mở màn */
  const [statusTab, setStatusTab] = useState(/** @type {StatusTab} */ ("live"));

  const [flashIds, setFlashIds] = useState(() => new Set());
  const flashTimersRef = useRef({});

  const triggerFlash = useCallback((matchId) => {
    const idStr = String(matchId);
    setFlashIds((prev) => {
      const next = new Set(prev);
      next.add(idStr);
      return next;
    });
    if (flashTimersRef.current[idStr]) {
      clearTimeout(flashTimersRef.current[idStr]);
    }
    flashTimersRef.current[idStr] = setTimeout(() => {
      setFlashIds((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
      delete flashTimersRef.current[idStr];
    }, 1100);
  }, []);

  const loadSnapshot = useCallback(async () => {
    if (!tournamentId) return;
    try {
      setError(null);
      const matches = await managerMatchApi.getMatches(tournamentId);
      const nextMap = {};
      (matches || []).forEach((m) => {
        if (m?.id != null) nextMap[m.id] = m;
      });
      setMatchMap(nextMap);
      setHasSnapshot(true);
    } catch (err) {
      const msg = getFriendlyApiErrorMessage(
        err,
        "Không tải được dữ liệu dashboard trực tiếp. Vui lòng thử lại."
      );
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    setLoading(true);
    setHasSnapshot(false);
    setMatchMap({});
    loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    setPage(1);
  }, [rangeKey, customFrom, customTo, statusTab]);

  const upsertMatch = useCallback(
    (incoming) => {
      if (!incoming?.id) return;
      setMatchMap((prev) => {
        const old = prev[incoming.id];
        if (
          old &&
          (old.player1Score !== incoming.player1Score ||
            old.player2Score !== incoming.player2Score)
        ) {
          triggerFlash(incoming.id);
        }
        return { ...prev, [incoming.id]: incoming };
      });
    },
    [triggerFlash]
  );

  const applyBracketSync = useCallback(
    (matches) => {
      if (!Array.isArray(matches)) return;
      setMatchMap((prev) => {
        const next = { ...prev };
        matches.forEach((m) => {
          if (!m?.id) return;
          const old = next[m.id];
          if (
            old &&
            (old.player1Score !== m.player1Score ||
              old.player2Score !== m.player2Score)
          ) {
            triggerFlash(m.id);
          }
          next[m.id] = m;
        });
        return next;
      });
    },
    [triggerFlash]
  );

  const { connectionState } = useTournamentSocket(tournamentId, {
    enabled: hasSnapshot && !loading,
    onMatchUpdate: upsertMatch,
    onBracketSync: applyBracketSync,
    onReconnect: loadSnapshot,
  });

  useEffect(() => {
    return () => {
      Object.values(flashTimersRef.current).forEach((timer) => clearTimeout(timer));
      flashTimersRef.current = {};
    };
  }, []);

  const allMatches = useMemo(() => Object.values(matchMap), [matchMap]);

  const liveCount = useMemo(
    () => allMatches.filter((m) => isMatchLive(m.status)).length,
    [allMatches]
  );

  const filteredByTable = useMemo(() => {
    const { from, to } = getTableBounds(rangeKey, customFrom, customTo);
    return allMatches.filter((m) => {
      if (from == null && to == null) return true;
      if (m.tableNo == null) return false;
      if (from != null && m.tableNo < from) return false;
      if (to != null && m.tableNo > to) return false;
      return true;
    });
  }, [allMatches, rangeKey, customFrom, customTo]);

  const tabMatches = useMemo(() => {
    const pool =
      statusTab === "live"
        ? filteredByTable.filter((m) => isMatchLive(m.status))
        : filteredByTable;
    return sortByLiveReadyFinished(pool);
  }, [filteredByTable, statusTab]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(tabMatches.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tabMatches.slice(start, start + pageSize);
  }, [tabMatches, currentPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <AdminCard>
        <div className="space-y-4 py-6">
          <p className="text-sm text-slate-500 dark:text-white/60 text-center">
            Đang tải dashboard trực tiếp...
          </p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-100 dark:bg-white/10 animate-pulse" />
            ))}
          </div>
        </div>
      </AdminCard>
    );
  }

  if (error && !allMatches.length) {
    return (
      <AdminCard>
        <div className="py-10 text-center space-y-3">
          <p className="text-slate-700 dark:text-white/75">{error}</p>
          <AdminButton onClick={loadSnapshot}>Thử lại</AdminButton>
        </div>
      </AdminCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          onClick={() => navigate(`/manager/tournaments/${tournamentId}`)}
        >
          <ArrowLeft size={14} /> Quay lại chi tiết giải
        </button>
        <div className="flex items-center gap-2">
          <SocketConnectionBadge connectionState={connectionState} />
          <AdminButton
            variant="ghost"
            onClick={() =>
              window.open(
                `/live/tournament/${tournamentId}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <Monitor size={16} className="mr-1.5 inline" />
            Chiếu lên TV
          </AdminButton>
          <AdminButton variant="ghost" onClick={loadSnapshot}>
            <RefreshCw size={16} className="mr-1.5 inline" />
            Tải lại snapshot
          </AdminButton>
        </div>
      </div>

      <SocketReconnectBanner connectionState={connectionState} />

      {/* Status tabs — mặc định Đang diễn ra */}
      <div
        className="inline-flex rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161a22] p-1 shadow-sm dark:shadow-none"
        role="tablist"
        aria-label="Lọc theo trạng thái trận"
      >
        {STATUS_TABS.map((tab) => {
          const active = statusTab === tab.key;
          const count =
            tab.key === "live" ? liveCount : filteredByTable.length;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setStatusTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-white/65 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 tabular-nums ${
                  active ? "text-indigo-100" : "text-slate-400 dark:text-white/40"
                }`}
              >
                · {count}
              </span>
            </button>
          );
        })}
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-white/60">Dải bàn</label>
            <select
              value={rangeKey}
              onChange={(e) => setRangeKey(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#101319] dark:text-slate-200 px-3 py-2 text-sm min-w-40"
            >
              {TABLE_RANGES.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          {rangeKey === "custom" && (
            <>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/60">Từ bàn</label>
                <input
                  type="number"
                  min="1"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#101319] dark:text-slate-200 px-3 py-2 text-sm w-28"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-white/60">Đến bàn</label>
                <input
                  type="number"
                  min="1"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 dark:border-white/10 dark:bg-[#101319] dark:text-slate-200 px-3 py-2 text-sm w-28"
                />
              </div>
            </>
          )}
          <p className="text-sm text-slate-500 dark:text-white/60 ml-auto">
            {tabMatches.length} trận
            {totalPages > 1 ? ` · trang ${currentPage}/${totalPages}` : ""}
          </p>
        </div>
      </AdminCard>

      {!tabMatches.length ? (
        <AdminCard>
          <p className="py-10 text-center text-slate-500 dark:text-white/60">
            {statusTab === "live"
              ? "Không có trận đang diễn ra trong dải bàn đã chọn."
              : "Không có trận nào trong dải bàn đã chọn."}
          </p>
          {statusTab === "live" && filteredByTable.length > 0 && (
            <p className="pb-6 text-center">
              <button
                type="button"
                onClick={() => setStatusTab("all")}
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Xem tất cả {filteredByTable.length} trận →
              </button>
            </p>
          )}
        </AdminCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pagedMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                isFlashing={flashIds.has(String(match.id))}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-2">
              <AdminButton
                variant="secondary"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Trước
              </AdminButton>
              <span className="text-sm text-slate-600 dark:text-white/70">
                {currentPage}/{totalPages}
              </span>
              <AdminButton
                variant="secondary"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Sau
              </AdminButton>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagerLiveDashboardPage;
