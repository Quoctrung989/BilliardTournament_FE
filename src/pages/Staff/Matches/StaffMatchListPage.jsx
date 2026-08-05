import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Clock, Play, RefreshCw, Search, Trophy, X } from "lucide-react";
import { toast } from "react-toastify";
import { getRefereeMatches, startStaffMatch } from "../../../api/staffMatchApi";
import { getFriendlyApiErrorMessage } from "../../../utils/apiError";
import {
  countDistinctTournaments,
  filterMatchesByDay,
  formatMatchScheduleLabel,
  getPlayerName,
  getTournamentName,
  groupRefereeMatches,
  isMatchDue,
  isMatchLive,
} from "../../../utils/refereeMatch";

/** Soft layers: page → section → card → accent rail */
const selectClass =
  "appearance-none bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200/90 pl-3.5 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 cursor-pointer min-w-[9.5rem] shadow-sm";

const searchClass =
  "w-full sm:w-56 bg-white text-slate-700 text-sm font-medium rounded-xl border border-slate-200/90 pl-9 pr-9 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400/35 shadow-sm placeholder:text-slate-400";

const CARD_TONE = {
  live: {
    wrap: "bg-gradient-to-r from-emerald-50/90 via-white to-white border-emerald-200/80 shadow-sm shadow-emerald-100/60 hover:border-emerald-300 hover:shadow-md hover:shadow-emerald-100/80",
    rail: "from-emerald-500 to-teal-400",
    tableBox: "bg-emerald-50/80 ring-1 ring-emerald-100",
    tableNum: "text-emerald-800",
    tableLabel: "text-emerald-600/80",
    divider: "sm:border-emerald-100",
  },
  ready: {
    wrap: "bg-gradient-to-r from-indigo-50/70 via-white to-white border-indigo-200/70 shadow-sm shadow-indigo-100/50 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-100/70",
    rail: "from-indigo-500 to-violet-400",
    tableBox: "bg-indigo-50/70 ring-1 ring-indigo-100",
    tableNum: "text-indigo-900",
    tableLabel: "text-indigo-500/90",
    divider: "sm:border-indigo-100",
  },
  waiting: {
    wrap: "bg-white border-slate-200/90 shadow-sm hover:border-amber-200 hover:shadow-md hover:shadow-amber-50",
    rail: "from-amber-400 to-orange-300",
    tableBox: "bg-amber-50/60 ring-1 ring-amber-100/80",
    tableNum: "text-slate-800",
    tableLabel: "text-amber-700/70",
    divider: "sm:border-slate-100",
  },
  finished: {
    wrap: "bg-slate-50/80 border-slate-200/80 opacity-90 hover:opacity-100 hover:border-slate-300",
    rail: "from-slate-300 to-slate-200",
    tableBox: "bg-slate-100/80 ring-1 ring-slate-200/60",
    tableNum: "text-slate-500",
    tableLabel: "text-slate-400",
    divider: "sm:border-slate-200/80",
  },
};

const MatchRowSkeleton = () => (
  <div className="relative overflow-hidden flex items-stretch gap-4 sm:gap-5 rounded-2xl bg-white border border-slate-200 px-4 sm:px-5 py-4 animate-pulse shadow-sm">
    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200" />
    <div className="w-14 sm:w-16 flex flex-col items-center justify-center gap-2 pl-1">
      <div className="h-3 w-8 rounded bg-slate-100" />
      <div className="h-10 w-10 rounded-xl bg-slate-100" />
    </div>
    <div className="flex-1 min-w-0 space-y-3 py-1">
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-24 rounded-full bg-slate-100" />
        <div className="h-6 w-36 rounded-full bg-indigo-50" />
        <div className="h-5 w-28 rounded bg-slate-100" />
      </div>
      <div className="h-7 w-3/4 max-w-md rounded bg-slate-100" />
    </div>
    <div className="w-28 sm:w-36 self-center">
      <div className="h-11 w-full rounded-xl bg-indigo-50" />
    </div>
  </div>
);

const SectionHeader = ({ tone, label, count }) => {
  const styles = {
    live: {
      pill: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
      dot: "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]",
      count: "bg-emerald-500 text-white",
    },
    upcoming: {
      pill: "bg-indigo-50 text-indigo-800 ring-indigo-200/80",
      dot: "bg-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.18)]",
      count: "bg-indigo-500 text-white",
    },
    finished: {
      pill: "bg-slate-100 text-slate-600 ring-slate-200",
      dot: "bg-slate-400",
      count: "bg-slate-400 text-white",
    },
  }[tone];

  return (
    <div className="flex items-center gap-2.5 pt-1 pb-2">
      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold tracking-wide ring-1 ring-inset ${styles.pill}`}>
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        {label}
        <span className={`ml-0.5 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${styles.count}`}>
          {count}
        </span>
      </span>
    </div>
  );
};

const StatusBadge = ({ match }) => {
  if (isMatchLive(match.status)) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 text-white px-2.5 py-1 text-xs font-bold shadow-sm shadow-emerald-200">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Đang đấu
      </span>
    );
  }

  if (match.status === "PENDING") {
    const due = isMatchDue(match);
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
          due
            ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
            : "bg-amber-50 text-amber-800 ring-amber-200"
        }`}
      >
        <Clock size={12} className="opacity-80" />
        {formatMatchScheduleLabel(match.scheduledAt)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-slate-200/70 text-slate-500 ring-1 ring-inset ring-slate-300/60 px-2.5 py-1 text-xs font-semibold">
      Đã xong
    </span>
  );
};

const MatchCard = ({ match, startingId, onStart, onOpen }) => {
  const p1 = getPlayerName(match.player1, "Cơ thủ 1");
  const p2 = getPlayerName(match.player2, "Cơ thủ 2");
  const live = isMatchLive(match.status);
  const pending = match.status === "PENDING";
  const finished =
    match.status === "COMPLETED" ||
    match.status === "WALKOVER" ||
    match.status === "BYE";
  const due = isMatchDue(match);
  const isStarting = startingId === match.id;

  const toneKey = live
    ? "live"
    : finished
      ? "finished"
      : due
        ? "ready"
        : "waiting";
  const tone = CARD_TONE[toneKey];

  const score1 = match.player1Score ?? 0;
  const score2 = match.player2Score ?? 0;

  let action = null;
  if (live) {
    action = (
      <button
        type="button"
        onClick={() => onOpen(match.id)}
        className="w-full sm:w-auto whitespace-nowrap rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:from-emerald-700 active:to-teal-700 text-white font-bold text-sm px-4 py-2.5 transition-all touch-manipulation shadow-md shadow-emerald-200/80"
      >
        Tiếp tục chấm →
      </button>
    );
  } else if (pending && due) {
    action = (
      <button
        type="button"
        disabled={isStarting}
        onClick={() => onStart(match)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 disabled:opacity-55 text-white font-semibold text-sm px-4 py-2.5 transition-all touch-manipulation shadow-md shadow-indigo-200/70"
      >
        {isStarting ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
        Bắt đầu
      </button>
    );
  } else if (pending) {
    action = (
      <button
        type="button"
        disabled
        className="w-full sm:w-auto whitespace-nowrap rounded-xl border border-amber-200/80 bg-amber-50 text-amber-700/70 font-medium text-sm px-4 py-2.5 cursor-not-allowed"
      >
        Chưa tới giờ
      </button>
    );
  } else if (finished) {
    action = (
      <button
        type="button"
        onClick={() => onOpen(match.id)}
        className="w-full sm:w-auto whitespace-nowrap rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-indigo-700 hover:border-indigo-200 hover:bg-indigo-50/50 font-medium text-sm px-4 py-2.5 transition-colors"
      >
        Xem lại
      </button>
    );
  }

  return (
    <div
      className={`relative overflow-hidden flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-4 rounded-2xl border px-4 sm:px-5 py-4 transition-all ${tone.wrap}`}
    >
      {/* Status color rail */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${tone.rail}`}
        aria-hidden
      />

      {/* Table number */}
      <div
        className={`ml-1.5 flex sm:flex-col items-center gap-2 sm:gap-1.5 sm:justify-center sm:w-[4.75rem] shrink-0 rounded-xl px-2.5 py-2 ${tone.tableBox}`}
      >
        <span
          className={`text-[10px] font-bold uppercase tracking-widest ${tone.tableLabel}`}
        >
          Bàn
        </span>
        <span
          className={`text-4xl sm:text-[2.75rem] font-black tabular-nums leading-none ${tone.tableNum}`}
        >
          {match.tableNo != null ? match.tableNo : "—"}
        </span>
      </div>

      {/* Details */}
      <div className={`flex-1 min-w-0 space-y-2.5 sm:pl-1 sm:border-l ${tone.divider}`}>
        <div className="flex flex-wrap items-center gap-2 sm:pl-4">
          <StatusBadge match={match} />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 text-sky-800 ring-1 ring-inset ring-sky-200/90 px-2.5 py-1 text-xs font-semibold max-w-[14rem] truncate">
            <Trophy size={12} className="shrink-0 text-sky-500" />
            <span className="truncate">{getTournamentName(match)}</span>
          </span>
          {(match.matchCode || match.raceTo != null) && (
            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {[
                match.matchCode,
                match.raceTo != null ? `Đánh tới ${match.raceTo} ván` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          )}
        </div>

        {live ? (
          <p className="text-base sm:text-lg font-bold text-slate-900 leading-snug sm:pl-4">
            <span className="truncate inline-block max-w-[38%] align-bottom">
              {p1}
            </span>
            <span className="mx-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-100/80 px-2 py-0.5 tabular-nums text-emerald-700 font-black text-base sm:text-lg">
              {score1}
              <span className="text-emerald-400 font-bold">–</span>
              {score2}
            </span>
            <span className="truncate inline-block max-w-[38%] align-bottom">
              {p2}
            </span>
          </p>
        ) : (
          <p className="text-base sm:text-lg font-bold text-slate-800 leading-snug sm:pl-4">
            {p1}
            <span className="mx-2 font-semibold text-indigo-300">vs</span>
            {p2}
          </p>
        )}
      </div>

      <div className="sm:self-center sm:shrink-0 sm:pl-2">{action}</div>
    </div>
  );
};

const StaffMatchListPage = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tournamentQuery, setTournamentQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [dayFilter, setDayFilter] = useState("today");
  const [startingId, setStartingId] = useState(null);
  const [finishedOpen, setFinishedOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(tournamentQuery.trim()), 350);
    return () => clearTimeout(t);
  }, [tournamentQuery]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRefereeMatches({
        tournamentName: debouncedQuery || undefined,
      });
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = getFriendlyApiErrorMessage(
        err,
        "Không tải được danh sách trận. Vui lòng kiểm tra mạng và thử lại."
      );
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery]);

  useEffect(() => {
    loadMatches();
  }, [loadMatches]);

  const filtered = useMemo(
    () => filterMatchesByDay(matches, dayFilter),
    [matches, dayFilter]
  );

  const groups = useMemo(() => groupRefereeMatches(filtered), [filtered]);

  const summaryCount = filtered.length;
  const summaryTournaments = countDistinctTournaments(filtered);

  const handleOpen = (id) => navigate(`/staff/matches/${id}`);

  const handleStart = async (match) => {
    if (startingId) return;
    setStartingId(match.id);
    try {
      await startStaffMatch(match.id);
      toast.success("Đã bắt đầu trận");
      navigate(`/staff/matches/${match.id}`);
    } catch (err) {
      toast.error(
        getFriendlyApiErrorMessage(err, "Không bắt đầu được trận. Thử lại.")
      );
      setStartingId(null);
      loadMatches();
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      {/* Header layer */}
      <div className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/40 to-violet-50/30 px-5 py-5 sm:px-6 shadow-sm">
        <div
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-indigo-200/30 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 left-1/3 h-28 w-28 rounded-full bg-emerald-200/25 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500/90 mb-1">
              Trọng tài
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Trận của tôi
            </h1>
            {!loading && !error && (
              <p className="mt-1.5 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{summaryCount}</span>{" "}
                trận
                {summaryTournaments > 0 && (
                  <>
                    {" · "}
                    <span className="font-semibold text-indigo-600">
                      {summaryTournaments}
                    </span>{" "}
                    giải đấu
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:flex-initial min-w-[12rem]">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                className={searchClass}
                value={tournamentQuery}
                onChange={(e) => setTournamentQuery(e.target.value)}
                placeholder="Tìm theo tên giải…"
                aria-label="Tìm theo tên giải đấu"
              />
              {tournamentQuery && (
                <button
                  type="button"
                  onClick={() => setTournamentQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa tìm kiếm"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="relative">
              <select
                className={selectClass}
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                aria-label="Lọc theo ngày"
              >
                <option value="all">Mọi ngày</option>
                <option value="today">Hôm nay</option>
                <option value="tomorrow">Ngày mai</option>
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={loadMatches}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 text-sm font-semibold px-3.5 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
              aria-label="Tải lại"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Tải lại
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          <MatchRowSkeleton />
          <MatchRowSkeleton />
          <MatchRowSkeleton />
        </div>
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white px-5 py-10 text-center space-y-4 shadow-sm">
          <p className="text-slate-700">{error}</p>
          <button
            type="button"
            onClick={loadMatches}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 shadow-md shadow-indigo-200"
          >
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && summaryCount === 0 && (
        <div className="rounded-2xl border border-dashed border-indigo-200 bg-gradient-to-b from-white to-indigo-50/40 px-5 py-16 text-center space-y-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Trophy size={22} />
          </div>
          <p className="text-lg font-semibold text-slate-900">Chưa có trận nào</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {debouncedQuery
              ? `Không có trận giải khớp “${debouncedQuery}” với bộ lọc hiện tại.`
              : matches.length === 0
                ? "Bạn chưa được phân trận. Liên hệ quản lý giải để được gán bàn."
                : "Không có trận khớp bộ lọc ngày hiện tại. Thử đổi sang Mọi ngày hoặc Ngày mai."}
          </p>
        </div>
      )}

      {!loading && !error && summaryCount > 0 && (
        <div className="space-y-7">
          {groups.live.length > 0 && (
            <section className="space-y-3 rounded-2xl bg-emerald-50/35 p-3 sm:p-4 ring-1 ring-emerald-100/70">
              <SectionHeader
                tone="live"
                label="Đang diễn ra"
                count={groups.live.length}
              />
              <div className="space-y-2.5">
                {groups.live.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    startingId={startingId}
                    onStart={handleStart}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            </section>
          )}

          {groups.upcoming.length > 0 && (
            <section className="space-y-3 rounded-2xl bg-indigo-50/30 p-3 sm:p-4 ring-1 ring-indigo-100/60">
              <SectionHeader
                tone="upcoming"
                label="Sắp tới"
                count={groups.upcoming.length}
              />
              <div className="space-y-2.5">
                {groups.upcoming.map((m) => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    startingId={startingId}
                    onStart={handleStart}
                    onOpen={handleOpen}
                  />
                ))}
              </div>
            </section>
          )}

          {groups.finished.length > 0 && (
            <section className="space-y-3 rounded-2xl bg-slate-100/40 p-3 sm:p-4 ring-1 ring-slate-200/70">
              <button
                type="button"
                onClick={() => setFinishedOpen((v) => !v)}
                className="flex w-full items-center gap-2 text-left group"
              >
                <SectionHeader
                  tone="finished"
                  label="Đã xong"
                  count={groups.finished.length}
                />
                <ChevronDown
                  size={16}
                  className={`ml-auto text-slate-400 transition-transform group-hover:text-slate-600 ${finishedOpen ? "rotate-180" : ""}`}
                />
              </button>
              {finishedOpen && (
                <div className="space-y-2.5">
                  {groups.finished.map((m) => (
                    <MatchCard
                      key={m.id}
                      match={m}
                      startingId={startingId}
                      onStart={handleStart}
                      onOpen={handleOpen}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffMatchListPage;
