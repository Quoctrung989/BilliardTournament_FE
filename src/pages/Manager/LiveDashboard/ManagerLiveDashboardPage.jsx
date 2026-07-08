import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { managerMatchApi } from "../../../api/matchApi";
import AdminButton from "../../../components/admin/ui/AdminButton";
import AdminCard from "../../../components/admin/ui/AdminCard";
import SocketConnectionBadge from "../../../components/shared/SocketConnectionBadge";
import SocketReconnectBanner from "../../../components/shared/SocketReconnectBanner";
import { useTournamentSocket } from "../../../hooks/useTournamentSocket";
import { getFriendlyApiErrorMessage } from "../../../utils/apiError";
import { getPlayerName } from "../../../utils/refereeMatch";

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

const toStatusMeta = (status) => {
  if (status === "IN_PROGRESS") {
    return {
      label: "LIVE",
      className: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/40",
    };
  }
  if (status === "PENDING") {
    return {
      label: "READY",
      className: "bg-slate-500/30 text-slate-200 ring-slate-400/30",
    };
  }
  return {
    label: "FINISHED",
    className: "bg-slate-800 text-slate-400 ring-slate-700",
  };
};

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
  }, [rangeKey, customFrom, customTo]);

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

  const filteredMatches = useMemo(() => {
    const { from, to } = getTableBounds(rangeKey, customFrom, customTo);
    return allMatches.filter((m) => {
      if (from == null && to == null) return true;
      if (m.tableNo == null) return false;
      if (from != null && m.tableNo < from) return false;
      if (to != null && m.tableNo > to) return false;
      return true;
    });
  }, [allMatches, rangeKey, customFrom, customTo]);

  const sortedMatches = useMemo(() => {
    return [...filteredMatches].sort((a, b) => {
      const sa = STATUS_ORDER[a.status] ?? 9;
      const sb = STATUS_ORDER[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      const ta = a.tableNo ?? 9999;
      const tb = b.tableNo ?? 9999;
      if (ta !== tb) return ta - tb;
      return (a.id ?? 0) - (b.id ?? 0);
    });
  }, [filteredMatches]);

  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(sortedMatches.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedMatches = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedMatches.slice(start, start + pageSize);
  }, [sortedMatches, currentPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (loading) {
    return (
      <AdminCard>
        <div className="space-y-4 py-6">
          <p className="text-sm text-slate-500 text-center">Đang tải dashboard trực tiếp...</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-slate-100 animate-pulse" />
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
          <p className="text-slate-700">{error}</p>
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
          className="text-sm text-indigo-600 hover:underline"
          onClick={() => navigate(`/manager/tournaments/${tournamentId}`)}
        >
          ← Quay lại chi tiết giải
        </button>
        <div className="flex items-center gap-2">
          <SocketConnectionBadge connectionState={connectionState} />
          <AdminButton variant="ghost" onClick={loadSnapshot}>
            <RefreshCw size={16} className="mr-1.5 inline" />
            Tải lại snapshot
          </AdminButton>
        </div>
      </div>

      <SocketReconnectBanner connectionState={connectionState} />

      <AdminCard>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-slate-500">Dải bàn</label>
            <select
              value={rangeKey}
              onChange={(e) => setRangeKey(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm min-w-40"
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
                <label className="text-xs text-slate-500">Từ bàn</label>
                <input
                  type="number"
                  min="1"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-28"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500">Đến bàn</label>
                <input
                  type="number"
                  min="1"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm w-28"
                />
              </div>
            </>
          )}
          <p className="text-sm text-slate-500 ml-auto">
            {sortedMatches.length} trận - trang {currentPage}/{totalPages}
          </p>
        </div>
      </AdminCard>

      {!sortedMatches.length ? (
        <AdminCard>
          <p className="py-10 text-center text-slate-500">
            Không có trận nào trong dải bàn đã chọn.
          </p>
        </AdminCard>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {pagedMatches.map((match) => {
              const status = toStatusMeta(match.status);
              const isFlashing = flashIds.has(String(match.id));
              return (
                <article
                  key={match.id}
                  className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors ${
                    isFlashing ? "ws-flash" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {match.tableNo != null ? `Bàn ${match.tableNo}` : "Chưa gán bàn"}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {getPlayerName(match.player1, "Cơ thủ 1")}
                    </p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums leading-none">
                      {match.player1Score ?? 0} - {match.player2Score ?? 0}
                    </p>
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {getPlayerName(match.player2, "Cơ thủ 2")}
                    </p>
                  </div>
                </article>
              );
            })}
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
              <span className="text-sm text-slate-600">
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
