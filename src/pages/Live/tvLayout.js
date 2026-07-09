/** Tối đa số card trận trên một màn. */
export const MAX_CELLS_PER_PAGE = 4;

export const FINISHED_RETAIN_MS = 15_000;
export const PAGE_ROTATE_MS = 15_000;
export const LAYOUT_TRANSITION_MS = 400;

/** Nền màn TV */
export const TV_BG = "#0A0D14";

/**
 * Bảng tra cỡ chữ.
 * | Số trận | Layout      | Điểm |
 * |---------|-------------|------|
 * | 1       | toàn màn    | 200  |
 * | 2       | trên/dưới   | 130  |
 * | 3       | 3 cột ngang | 84   |
 * | 4       | 2×2         | 96   |
 * | >4      | 2×2 / trang | 96   |
 */
export const TYPO = {
  full: {
    score: "clamp(6rem, 16vmin, 12.5rem)",
    name: "1.25rem",
    header: "clamp(0.75rem, 1.6vmin, 0.9375rem)",
  },
  stack2: {
    score: "clamp(4rem, 11vmin, 8.125rem)",
    name: "1.25rem",
    header: "clamp(0.7rem, 1.5vmin, 0.875rem)",
  },
  row3: {
    score: "clamp(2.5rem, 7.5vmin, 5.25rem)",
    name: "1.25rem",
    header: "clamp(0.65rem, 1.4vmin, 0.8125rem)",
  },
  grid4: {
    score: "clamp(3rem, 8.5vmin, 6rem)",
    name: "1.25rem",
    header: "clamp(0.65rem, 1.4vmin, 0.8125rem)",
  },
};

const GRID4_POSITIONS = [
  { col: "1", row: "1" },
  { col: "2", row: "1" },
  { col: "1", row: "2" },
  { col: "2", row: "2" },
];

export function sortByTable(matches) {
  return [...matches].sort((a, b) => {
    const ta = a.tableNo ?? 9999;
    const tb = b.tableNo ?? 9999;
    if (ta !== tb) return ta - tb;
    return (a.id ?? 0) - (b.id ?? 0);
  });
}

export function isEndingSoon(match) {
  if (match.status !== "IN_PROGRESS") return false;
  const raceTo = match.raceTo ?? 5;
  const s1 = match.player1Score ?? 0;
  const s2 = match.player2Score ?? 0;
  return raceTo - s1 <= 3 || raceTo - s2 <= 3;
}

export function getCurrentInning(match) {
  const s1 = match.player1Score ?? 0;
  const s2 = match.player2Score ?? 0;
  return Math.max(1, s1 + s2 + 1);
}

export function getCellTypography(layout) {
  const key = layout.typoKey ?? "grid4";
  return TYPO[key] ?? TYPO.grid4;
}

function buildGrid4MatchSlots(matches) {
  return matches.slice(0, MAX_CELLS_PER_PAGE).map((match, i) => ({
    type: "match",
    match,
    gridColumn: GRID4_POSITIONS[i].col,
    gridRow: GRID4_POSITIONS[i].row,
  }));
}

/**
 * @param {object[]} displayMatches — LIVE + trận FINISHED giữ 15s
 * @param {{ pageIndex?: number }} [options]
 */
export function getLayout(displayMatches, options = {}) {
  const { pageIndex = 0 } = options;
  const total = displayMatches?.length ?? 0;

  const base = {
    count: total,
    paginated: false,
    pageSize: MAX_CELLS_PER_PAGE,
    totalPages: 0,
    pageIndex: 0,
    typoKey: "grid4",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: "clamp(0.5rem, 1.2vmin, 0.875rem)",
    slots: [],
  };

  if (total === 0) {
    return { ...base, mode: "waiting", slots: [] };
  }

  const sorted = sortByTable(displayMatches);

  if (total > MAX_CELLS_PER_PAGE) {
    const totalPages = Math.ceil(total / MAX_CELLS_PER_PAGE);
    const safePage = ((pageIndex % totalPages) + totalPages) % totalPages;
    const pageMatches = sorted.slice(
      safePage * MAX_CELLS_PER_PAGE,
      safePage * MAX_CELLS_PER_PAGE + MAX_CELLS_PER_PAGE
    );

    return {
      ...base,
      mode: "paged",
      typoKey: "grid4",
      paginated: true,
      totalPages,
      pageIndex: safePage,
      slots: buildGrid4MatchSlots(pageMatches),
    };
  }

  if (total === 1) {
    return {
      ...base,
      mode: "full",
      typoKey: "full",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr",
      gap: "0",
      slots: [
        {
          type: "match",
          match: sorted[0],
          gridColumn: "1",
          gridRow: "1",
        },
      ],
      totalPages: 1,
    };
  }

  if (total === 2) {
    return {
      ...base,
      mode: "stack2",
      typoKey: "stack2",
      gridTemplateColumns: "1fr",
      gridTemplateRows: "1fr 1fr",
      slots: sorted.map((match, i) => ({
        type: "match",
        match,
        gridColumn: "1",
        gridRow: String(i + 1),
      })),
      totalPages: 1,
    };
  }

  if (total === 3) {
    return {
      ...base,
      mode: "row3",
      typoKey: "row3",
      gridTemplateColumns: "1fr 1fr 1fr",
      gridTemplateRows: "1fr",
      slots: sorted.map((match, i) => ({
        type: "match",
        match,
        gridColumn: String(i + 1),
        gridRow: "1",
      })),
      totalPages: 1,
    };
  }

  return {
    ...base,
    mode: "grid4",
    typoKey: "grid4",
    slots: buildGrid4MatchSlots(sorted),
    totalPages: 1,
  };
}

export function getRoundLabel(matches) {
  const stages = [...new Set(matches.map((m) => m.stageName).filter(Boolean))];
  if (stages.length === 1) return stages[0];
  if (stages.length > 1) return stages.join(" · ");

  const rounds = [...new Set(matches.map((m) => m.roundNo).filter((n) => n != null))].sort(
    (a, b) => a - b
  );
  if (rounds.length === 1) return `Vòng ${rounds[0]}`;
  if (rounds.length > 1) return `Vòng ${rounds.join(", ")}`;
  return null;
}

export function buildFormatLabel(tournamentMeta, liveMatches) {
  const game = tournamentMeta?.gameType?.trim();
  const raceTos = liveMatches.map((m) => m.raceTo).filter((n) => n != null);
  const raceTo =
    raceTos.length > 0
      ? raceTos.sort(
          (a, b) =>
            raceTos.filter((v) => v === b).length -
            raceTos.filter((v) => v === a).length
        )[0]
      : null;

  const parts = [];
  if (game) parts.push(game.toUpperCase().replace(/_/g, "-"));
  if (raceTo != null) parts.push(`${raceTo} ĐIỂM`);
  if (!parts.length && tournamentMeta?.formatName) {
    parts.push(tournamentMeta.formatName);
  }
  return parts.length ? parts.join(" · ") : null;
}

export function getNextScheduledMatch(matches) {
  const pending = (matches || [])
    .filter((m) => m.status === "PENDING")
    .sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
      return ta - tb;
    });
  return pending[0] ?? null;
}

export function formatNextMatchTime(scheduledAt) {
  if (!scheduledAt) return null;
  const d = new Date(scheduledAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}
