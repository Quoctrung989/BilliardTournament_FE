/**
 * L1 unit tests for the referee console.
 *
 * Mirrors the FE-RefereeConsole sheet in Report 5.1_UnitTests_L1.xlsx one row per test;
 * the case number is embedded in each title so the two can be traced either way.
 *
 * Spec source: UCS Report 3.1 — UC-40 (referee assignment and the match queue),
 *              UC-41 (score entry and completion).
 * Modules under test: src/utils/refereeMatch.js, src/utils/shotClock.js
 *
 * The Staff member works from a phone at the table. Which match is on top of the queue, whether
 * the clock has run out and who is offered as the winner are all decided here, on the client —
 * the backend never sees a shot clock at all.
 */

import {
  countDistinctTournaments,
  filterMatchesByDay,
  filterMatchesByTournament,
  formatMatchScheduleLabel,
  getPlayerName,
  getTournamentName,
  groupRefereeMatches,
  isMatchDue,
  isMatchFinished,
  isMatchLive,
  isMatchPending,
  pickDefaultWinnerId,
  sortRefereeMatches,
  toRefereeDisplayStatus,
  uniqueTournaments,
} from "../../utils/refereeMatch";
import {
  BREAK_BONUS_SECONDS,
  EXTENSION_SECONDS,
  SHOT_SECONDS,
  WARNING_SECONDS,
  formatClock,
  nextBreakSlot,
  otherSlot,
  shotDurationSeconds,
  toRemainingSeconds,
} from "../../utils/shotClock";

/** A match as the queue endpoint returns it. */
const match = (overrides = {}) => ({
  id: 1,
  status: "PENDING",
  tableNo: 1,
  tournamentId: 77,
  tournamentName: "Summer Open 2026",
  scheduledAt: null,
  player1: { id: 11, displayName: "Nguyễn Văn A" },
  player2: { id: 22, displayName: "Trần Thị B" },
  ...overrides,
});

/** Local-time ISO string for a given offset from now, so the tests never depend on the clock. */
const atOffsetDays = (days, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

describe("toRefereeDisplayStatus — the badge on each card (UC-40 / BR-03)", () => {
  test("TC-001 · A live match is badged as playing", () => {
    const badge = toRefereeDisplayStatus("IN_PROGRESS");
    expect(badge.key).toBe("LIVE");
    expect(badge.label).toBe("Đang đấu");
  });

  test("TC-002 · A pending match is badged as upcoming", () => {
    expect(toRefereeDisplayStatus("PENDING")).toMatchObject({
      key: "READY",
      label: "Sắp tới",
    });
  });

  test("TC-003 · All three settled statuses share one badge", () => {
    // COMPLETED, WALKOVER and BYE are over as far as the Staff member is concerned
    for (const status of ["COMPLETED", "WALKOVER", "BYE"]) {
      expect(toRefereeDisplayStatus(status)).toMatchObject({
        key: "FINISHED",
        label: "Đã xong",
      });
    }
  });

  test("TC-004 · An unknown status is shown rather than hidden", () => {
    // A status added by a later backend release still has to render something readable
    expect(toRefereeDisplayStatus("SUSPENDED")).toMatchObject({
      key: "SUSPENDED",
      label: "SUSPENDED",
    });
  });

  test("TC-005 · A missing status falls back to a dash", () => {
    expect(toRefereeDisplayStatus(undefined)).toMatchObject({
      key: "UNKNOWN",
      label: "—",
    });
  });
});

describe("The three status predicates (UC-40 / BR-03)", () => {
  test("TC-006 · Each predicate answers only for its own status", () => {
    expect(isMatchLive("IN_PROGRESS")).toBe(true);
    expect(isMatchPending("PENDING")).toBe(true);
    expect(isMatchFinished("COMPLETED")).toBe(true);
    expect(isMatchFinished("WALKOVER")).toBe(true);
    expect(isMatchFinished("BYE")).toBe(true);
  });

  test("TC-007 · A pending match is neither live nor finished", () => {
    expect(isMatchLive("PENDING")).toBe(false);
    expect(isMatchFinished("PENDING")).toBe(false);
  });
});

describe("Names shown on a card (UC-40 / BR-04)", () => {
  test("TC-008 · A player with no name yet reads as undecided", () => {
    // The second slot of a bracket is empty until the previous round finishes
    expect(getPlayerName(null)).toBe("Chưa xác định");
    expect(getPlayerName({ displayName: "   " })).toBe("Chưa xác định");
  });

  test("TC-009 · A caller may supply its own placeholder", () => {
    expect(getPlayerName(undefined, "Chờ thắng R1")).toBe("Chờ thắng R1");
  });

  test("TC-010 · A player name is trimmed before it is shown", () => {
    expect(getPlayerName({ displayName: "  Nguyễn Văn A  " })).toBe("Nguyễn Văn A");
  });

  test("TC-011 · A match with no tournament name falls back to a generic label", () => {
    expect(getTournamentName({})).toBe("Giải đấu");
    expect(getTournamentName({ tournamentName: "Summer Open" })).toBe("Summer Open");
  });
});

describe("sortRefereeMatches — the order of the queue (UC-40 / BR-05)", () => {
  test("TC-012 · Live matches come first, then upcoming, then finished", () => {
    const sorted = sortRefereeMatches([
      match({ id: 3, status: "COMPLETED" }),
      match({ id: 2, status: "PENDING" }),
      match({ id: 1, status: "IN_PROGRESS" }),
    ]);
    // The match being played is the one the Staff member needs on screen
    expect(sorted.map((m) => m.id)).toEqual([1, 2, 3]);
  });

  test("TC-013 · Byes sink below every other finished match", () => {
    const sorted = sortRefereeMatches([
      match({ id: 1, status: "BYE" }),
      match({ id: 2, status: "COMPLETED" }),
    ]);
    // A bye was never played, so it is the least interesting row on the screen
    expect(sorted.map((m) => m.id)).toEqual([2, 1]);
  });

  test("TC-014 · Two upcoming matches are ordered by kick-off time", () => {
    const sorted = sortRefereeMatches([
      match({ id: 1, scheduledAt: atOffsetDays(0, 15) }),
      match({ id: 2, scheduledAt: atOffsetDays(0, 9) }),
    ]);
    expect(sorted.map((m) => m.id)).toEqual([2, 1]);
  });

  test("TC-015 · An unscheduled match sorts after every scheduled one", () => {
    const sorted = sortRefereeMatches([
      match({ id: 1, scheduledAt: null }),
      match({ id: 2, scheduledAt: atOffsetDays(0, 9) }),
    ]);
    // No time means no claim on the top of the queue
    expect(sorted.map((m) => m.id)).toEqual([2, 1]);
  });

  test("TC-016 · Matches at the same time are ordered by table, then by id", () => {
    const when = atOffsetDays(0, 9);
    const sorted = sortRefereeMatches([
      match({ id: 5, tableNo: 3, scheduledAt: when }),
      match({ id: 4, tableNo: 1, scheduledAt: when }),
      match({ id: 3, tableNo: 1, scheduledAt: when }),
    ]);
    // Walking the room table by table is how a Staff member actually works
    expect(sorted.map((m) => m.id)).toEqual([3, 4, 5]);
  });

  test("TC-017 · A match with no table is placed last within its group", () => {
    const when = atOffsetDays(0, 9);
    const sorted = sortRefereeMatches([
      match({ id: 1, tableNo: null, scheduledAt: when }),
      match({ id: 2, tableNo: 7, scheduledAt: when }),
    ]);
    expect(sorted.map((m) => m.id)).toEqual([2, 1]);
  });

  test("TC-018 · Sorting never mutates the list it was given", () => {
    const input = [match({ id: 2, status: "COMPLETED" }), match({ id: 1, status: "IN_PROGRESS" })];
    sortRefereeMatches(input);
    // React state is handed straight to this function, so an in-place sort would be a silent bug
    expect(input.map((m) => m.id)).toEqual([2, 1]);
  });

  test("TC-019 · A missing list is treated as an empty one", () => {
    expect(sortRefereeMatches(undefined)).toEqual([]);
    expect(sortRefereeMatches(null)).toEqual([]);
  });
});

describe("groupRefereeMatches — the three sections of the screen (UC-40 / BR-05)", () => {
  test("TC-020 · Each match lands in exactly one section, already sorted", () => {
    const groups = groupRefereeMatches([
      match({ id: 1, status: "COMPLETED" }),
      match({ id: 2, status: "PENDING" }),
      match({ id: 3, status: "IN_PROGRESS" }),
      match({ id: 4, status: "WALKOVER" }),
    ]);
    expect(groups.live.map((m) => m.id)).toEqual([3]);
    expect(groups.upcoming.map((m) => m.id)).toEqual([2]);
    expect(groups.finished.map((m) => m.id)).toEqual([1, 4]);
  });

  test("TC-021 · An unknown status is shown among the upcoming rather than dropped", () => {
    const groups = groupRefereeMatches([match({ id: 9, status: "SUSPENDED" })]);
    // Losing a match off the screen entirely would be worse than filing it imperfectly
    expect(groups.upcoming.map((m) => m.id)).toEqual([9]);
  });

  test("TC-022 · An empty queue still returns all three sections", () => {
    expect(groupRefereeMatches([])).toEqual({ live: [], upcoming: [], finished: [] });
  });
});

describe("The tournament filter list (UC-40 / BR-06)", () => {
  test("TC-023 · Each tournament appears once, sorted by name", () => {
    const list = uniqueTournaments([
      match({ id: 1, tournamentId: 2, tournamentName: "Zeta Cup" }),
      match({ id: 2, tournamentId: 1, tournamentName: "Alpha Open" }),
      match({ id: 3, tournamentId: 2, tournamentName: "Zeta Cup" }),
    ]);
    expect(list).toEqual([
      { id: 1, name: "Alpha Open" },
      { id: 2, name: "Zeta Cup" },
    ]);
  });

  test("TC-024 · Vietnamese names are ordered by Vietnamese collation", () => {
    const list = uniqueTournaments([
      match({ id: 1, tournamentId: 1, tournamentName: "Đà Nẵng Open" }),
      match({ id: 2, tournamentId: 2, tournamentName: "Cần Thơ Cup" }),
    ]);
    // Sorting by raw code point would put Đ after every unaccented letter
    expect(list.map((t) => t.name)).toEqual(["Cần Thơ Cup", "Đà Nẵng Open"]);
  });

  test("TC-025 · A match with no tournament id is left out of the filter", () => {
    expect(uniqueTournaments([match({ tournamentId: null })])).toEqual([]);
  });

  test("TC-026 · The count matches the length of the filter list", () => {
    const matches = [
      match({ id: 1, tournamentId: 1 }),
      match({ id: 2, tournamentId: 1 }),
      match({ id: 3, tournamentId: 2 }),
    ];
    expect(countDistinctTournaments(matches)).toBe(2);
  });
});

describe("filterMatchesByDay — today and tomorrow (UC-40 / BR-07)", () => {
  test("TC-027 · The all filter returns the queue untouched", () => {
    const matches = [match({ scheduledAt: atOffsetDays(5) })];
    expect(filterMatchesByDay(matches, "all")).toBe(matches);
    expect(filterMatchesByDay(matches, undefined)).toBe(matches);
  });

  test("TC-028 · Today keeps matches scheduled today", () => {
    const today = match({ id: 1, scheduledAt: atOffsetDays(0) });
    const later = match({ id: 2, scheduledAt: atOffsetDays(3) });
    expect(filterMatchesByDay([today, later], "today").map((m) => m.id)).toEqual([1]);
  });

  test("TC-029 · Tomorrow keeps matches scheduled tomorrow", () => {
    const today = match({ id: 1, scheduledAt: atOffsetDays(0) });
    const tomorrow = match({ id: 2, scheduledAt: atOffsetDays(1) });
    expect(filterMatchesByDay([today, tomorrow], "tomorrow").map((m) => m.id)).toEqual([2]);
  });

  test("TC-030 · A live match always counts as today", () => {
    // It is being played right now, whatever the schedule column says
    const live = match({ id: 1, status: "IN_PROGRESS", scheduledAt: atOffsetDays(4) });
    expect(filterMatchesByDay([live], "today").map((m) => m.id)).toEqual([1]);
  });

  test("TC-031 · An unscheduled match shows under today only", () => {
    const unscheduled = match({ id: 1, scheduledAt: null });
    expect(filterMatchesByDay([unscheduled], "today")).toHaveLength(1);
    expect(filterMatchesByDay([unscheduled], "tomorrow")).toHaveLength(0);
  });

  test("TC-032 · An unparseable date drops out of every day filter", () => {
    const broken = match({ id: 1, scheduledAt: "not-a-date" });
    expect(filterMatchesByDay([broken], "today")).toHaveLength(0);
    expect(filterMatchesByDay([broken], "tomorrow")).toHaveLength(0);
  });
});

describe("filterMatchesByTournament (UC-40 / BR-06)", () => {
  test("TC-033 · The three empty forms all mean no filter", () => {
    const matches = [match({ tournamentId: 1 })];
    for (const value of [null, "", "all"]) {
      expect(filterMatchesByTournament(matches, value)).toHaveLength(1);
    }
  });

  test("TC-034 · A select value arrives as a string and still matches", () => {
    const matches = [match({ id: 1, tournamentId: 7 }), match({ id: 2, tournamentId: 8 })];
    // A <select> hands back "7", never the number 7
    expect(filterMatchesByTournament(matches, "7").map((m) => m.id)).toEqual([1]);
  });
});

describe("formatMatchScheduleLabel — the time on the badge (UC-40 / BR-08)", () => {
  const now = new Date(2026, 5, 10, 12, 0, 0);

  test("TC-035 · A match today is labelled with the hour alone", () => {
    const at = new Date(2026, 5, 10, 9, 30);
    expect(formatMatchScheduleLabel(at.toISOString(), now)).toBe("Hôm nay 09:30");
  });

  test("TC-036 · Tomorrow and yesterday are named", () => {
    expect(formatMatchScheduleLabel(new Date(2026, 5, 11, 14, 0).toISOString(), now))
      .toBe("Ngày mai 14:00");
    expect(formatMatchScheduleLabel(new Date(2026, 5, 9, 8, 5).toISOString(), now))
      .toBe("Hôm qua 08:05");
  });

  test("TC-037 · Anything further away carries the date", () => {
    const label = formatMatchScheduleLabel(new Date(2026, 5, 20, 16, 0).toISOString(), now);
    // Day and month, both zero-padded, then the time. The separator between day and month comes
    // from the platform's vi-VN locale data, so the assertion accepts either form
    expect(label).toMatch(/^20[/-]06 16:00$/);
  });

  test("TC-038 · A match with no time reads as unscheduled", () => {
    expect(formatMatchScheduleLabel(null, now)).toBe("Chưa xếp giờ");
    expect(formatMatchScheduleLabel("not-a-date", now)).toBe("Chưa xếp giờ");
  });
});

describe("isMatchDue — may the Staff member start it (UC-41 / BR-01)", () => {
  const now = new Date(2026, 5, 10, 12, 0, 0);

  test("TC-039 · A pending match whose time has passed is due", () => {
    const due = match({ scheduledAt: new Date(2026, 5, 10, 11, 0).toISOString() });
    expect(isMatchDue(due, now)).toBe(true);
  });

  test("TC-040 · A pending match still in the future is not due", () => {
    const later = match({ scheduledAt: new Date(2026, 5, 10, 15, 0).toISOString() });
    expect(isMatchDue(later, now)).toBe(false);
  });

  test("TC-041 · A match with no time is due immediately", () => {
    // Tournaments run behind schedule; an unscheduled match must not block the table
    expect(isMatchDue(match({ scheduledAt: null }), now)).toBe(true);
    expect(isMatchDue(match({ scheduledAt: "not-a-date" }), now)).toBe(true);
  });

  test("TC-042 · Only a pending match can be due", () => {
    expect(isMatchDue(match({ status: "IN_PROGRESS" }), now)).toBe(false);
    expect(isMatchDue(match({ status: "COMPLETED" }), now)).toBe(false);
    expect(isMatchDue(null, now)).toBe(false);
  });
});

describe("pickDefaultWinnerId — who the form offers (UC-41 / BR-04)", () => {
  test("TC-043 · The player with the higher score is preselected", () => {
    expect(pickDefaultWinnerId(match(), 7, 3)).toBe(11);
    expect(pickDefaultWinnerId(match(), 3, 7)).toBe(22);
  });

  test("TC-044 · A drawn score preselects nobody", () => {
    // The Staff member has to choose deliberately rather than accept a guess
    expect(pickDefaultWinnerId(match(), 5, 5)).toBeNull();
  });

  test("TC-045 · A slot with no player yet cannot be preselected", () => {
    const halfEmpty = match({ player2: null });
    expect(pickDefaultWinnerId(halfEmpty, 3, 7)).toBeNull();
    expect(pickDefaultWinnerId(null, 7, 3)).toBeNull();
  });
});

describe("Shot clock durations (UC-41 / BR-05)", () => {
  test("TC-046 · An ordinary shot is thirty seconds", () => {
    expect(shotDurationSeconds(false)).toBe(SHOT_SECONDS);
    expect(SHOT_SECONDS).toBe(30);
  });

  test("TC-047 · The opening shot of a rack carries the break bonus", () => {
    // WPA rules give the break and the shot after it an extra thirty seconds
    expect(shotDurationSeconds(true)).toBe(SHOT_SECONDS + BREAK_BONUS_SECONDS);
    expect(shotDurationSeconds(true)).toBe(60);
  });

  test("TC-048 · The extension and the warning are the documented lengths", () => {
    expect(EXTENSION_SECONDS).toBe(30);
    expect(WARNING_SECONDS).toBe(10);
  });
});

describe("Break rotation (UC-41 / BR-06)", () => {
  test("TC-049 · otherSlot always returns the opponent", () => {
    expect(otherSlot(1)).toBe(2);
    expect(otherSlot(2)).toBe(1);
  });

  test("TC-050 · Alternate break hands the next rack to the opponent", () => {
    expect(nextBreakSlot("alternate", 1, 2)).toBe(2);
    expect(nextBreakSlot("alternate", 2, 1)).toBe(1);
  });

  test("TC-051 · Winner break keeps the break with whoever won the rack", () => {
    expect(nextBreakSlot("winner", 1, 1)).toBe(1);
    expect(nextBreakSlot("winner", 1, 2)).toBe(2);
  });

  test("TC-052 · Winner break with no known winner falls back to alternating", () => {
    // The rack winner is unknown until the score is entered, and the clock cannot stall
    expect(nextBreakSlot("winner", 1, null)).toBe(2);
    expect(nextBreakSlot("winner", 2, undefined)).toBe(1);
  });
});

describe("Clock display (UC-41 / BR-05)", () => {
  test("TC-053 · Remaining seconds round up so the last second is shown", () => {
    // 200 ms left still reads as 1, because a clock that shows 0 while the shot is legal is wrong
    expect(toRemainingSeconds(200)).toBe(1);
    expect(toRemainingSeconds(1000)).toBe(1);
    expect(toRemainingSeconds(1001)).toBe(2);
  });

  test("TC-054 · A clock that has run out never goes negative", () => {
    expect(toRemainingSeconds(-500)).toBe(0);
    expect(toRemainingSeconds(0)).toBe(0);
  });

  test("TC-055 · The clock is written as minutes and padded seconds", () => {
    expect(formatClock(65000)).toBe("1:05");
    expect(formatClock(30000)).toBe("0:30");
    expect(formatClock(9000)).toBe("0:09");
    expect(formatClock(0)).toBe("0:00");
  });
});
