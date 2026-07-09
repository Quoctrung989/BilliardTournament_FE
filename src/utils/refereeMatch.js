const FINISHED = new Set(["COMPLETED", "WALKOVER", "BYE"]);

const STATUS_RANK = {
  IN_PROGRESS: 0,
  PENDING: 1,
  COMPLETED: 2,
  WALKOVER: 2,
  BYE: 3,
};

/** @returns {{ key: string, label: string, badgeClass: string }} */
export function toRefereeDisplayStatus(status) {
  if (status === "IN_PROGRESS") {
    return {
      key: "LIVE",
      label: "Đang đấu",
      badgeClass: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30",
    };
  }
  if (status === "PENDING") {
    return {
      key: "READY",
      label: "Sắp tới",
      badgeClass: "bg-slate-500/20 text-slate-300 ring-slate-500/30",
    };
  }
  if (FINISHED.has(status)) {
    return {
      key: "FINISHED",
      label: "Đã xong",
      badgeClass: "bg-slate-700/40 text-slate-500 ring-slate-600/30",
    };
  }
  return {
    key: status || "UNKNOWN",
    label: status || "—",
    badgeClass: "bg-slate-600/30 text-slate-400 ring-slate-500/30",
  };
}

export function isMatchPending(status) {
  return status === "PENDING";
}

export function isMatchLive(status) {
  return status === "IN_PROGRESS";
}

export function isMatchFinished(status) {
  return FINISHED.has(status);
}

export function getPlayerName(player, fallback = "Chưa xác định") {
  return player?.displayName?.trim() || fallback;
}

export function getTournamentName(match) {
  return match?.tournamentName?.trim() || "Giải đấu";
}

function scheduledMs(match) {
  if (!match?.scheduledAt) return Number.POSITIVE_INFINITY;
  const t = new Date(match.scheduledAt).getTime();
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
}

/** LIVE trước → sẵn sàng theo giờ tăng → đã xong; cùng nhóm theo bàn. */
export function sortRefereeMatches(matches) {
  return [...(matches || [])].sort((a, b) => {
    const ra = STATUS_RANK[a.status] ?? 9;
    const rb = STATUS_RANK[b.status] ?? 9;
    if (ra !== rb) return ra - rb;

    if (a.status === "PENDING" && b.status === "PENDING") {
      const sa = scheduledMs(a);
      const sb = scheduledMs(b);
      if (sa !== sb) return sa - sb;
    }

    const ta = a.tableNo ?? 9999;
    const tb = b.tableNo ?? 9999;
    if (ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

/**
 * Nhóm theo trạng thái hiển thị: live → upcoming → finished.
 * @returns {{ live: any[], upcoming: any[], finished: any[] }}
 */
export function groupRefereeMatches(matches) {
  const sorted = sortRefereeMatches(matches);
  const live = [];
  const upcoming = [];
  const finished = [];
  for (const m of sorted) {
    if (isMatchLive(m.status)) live.push(m);
    else if (isMatchFinished(m.status)) finished.push(m);
    else upcoming.push(m);
  }
  return { live, upcoming, finished };
}

export function uniqueTournaments(matches) {
  const map = new Map();
  for (const m of matches || []) {
    if (m.tournamentId == null) continue;
    if (!map.has(m.tournamentId)) {
      map.set(m.tournamentId, getTournamentName(m));
    }
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function countDistinctTournaments(matches) {
  return uniqueTournaments(matches).length;
}

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** FILTER: all | today | tomorrow */
export function filterMatchesByDay(matches, dayFilter) {
  if (!dayFilter || dayFilter === "all") return matches || [];
  const today = startOfLocalDay();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (matches || []).filter((m) => {
    if (isMatchLive(m.status) && dayFilter === "today") return true;
    if (!m.scheduledAt) return dayFilter === "today";
    const d = new Date(m.scheduledAt);
    if (Number.isNaN(d.getTime())) return false;
    if (dayFilter === "today") return isSameLocalDay(d, today);
    if (dayFilter === "tomorrow") return isSameLocalDay(d, tomorrow);
    return true;
  });
}

export function filterMatchesByTournament(matches, tournamentId) {
  if (tournamentId == null || tournamentId === "" || tournamentId === "all") {
    return matches || [];
  }
  const tid = Number(tournamentId);
  return (matches || []).filter((m) => m.tournamentId === tid);
}

/**
 * Label giờ cho badge "Sắp tới".
 * @returns {string}
 */
export function formatMatchScheduleLabel(scheduledAt, now = new Date()) {
  if (!scheduledAt) return "Chưa xếp giờ";
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return "Chưa xếp giờ";

  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const today = startOfLocalDay(now);
  const target = startOfLocalDay(d);
  const diffDays = Math.round((target - today) / 86400000);

  if (diffDays === 0) return `Hôm nay ${time}`;
  if (diffDays === 1) return `Ngày mai ${time}`;
  if (diffDays === -1) return `Hôm qua ${time}`;

  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${date} ${time}`;
}

/** READY: đã tới giờ khi không có lịch hoặc lịch <= now (+ grace 0). */
export function isMatchDue(match, now = new Date()) {
  if (!isMatchPending(match?.status)) return false;
  if (!match.scheduledAt) return true;
  const t = new Date(match.scheduledAt).getTime();
  if (Number.isNaN(t)) return true;
  return t <= now.getTime();
}

export function pickDefaultWinnerId(match, score1, score2) {
  if (!match) return null;
  if (score1 > score2 && match.player1?.id) return match.player1.id;
  if (score2 > score1 && match.player2?.id) return match.player2.id;
  return null;
}
