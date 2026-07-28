/** Lưới luôn tối thiểu 3×3 — kể cả khi chỉ có 1 trận. */
export const MIN_GRID_COLUMNS = 3;
export const MIN_GRID_ROWS = 3;
/** Trần lưới: quá 4 cột thì tỉ số không còn đọc được từ xa. */
export const MAX_GRID_COLUMNS = 4;
/** Tối đa số card trận trên một màn (4×4); vượt ngưỡng này thì xoay trang. */
export const MAX_CELLS_PER_PAGE = MAX_GRID_COLUMNS * MAX_GRID_COLUMNS;

export const FINISHED_RETAIN_MS = 15_000;
export const PAGE_ROTATE_MS = 15_000;
export const LAYOUT_TRANSITION_MS = 400;

/** Nền màn TV */
export const TV_BG = "#0A0D14";

/**
 * Màu theo vị trí cơ thủ — trùng với màn chấm điểm của trọng tài để khán giả
 * và trọng tài nhìn cùng một quy ước màu.
 */
export const SLOT_COLORS = {
  1: "#378add",
  2: "#ef4444",
};

/**
 * Cỡ chữ theo số cột của lưới — càng nhiều cột, ô càng hẹp.
 * | Số trận | Lưới | Điểm |
 * |---------|------|------|
 * | 1–9     | 3×3  | 80   |
 * | 10–12   | 4×3  | 58   |
 * | 13–16   | 4×4  | 58   |
 */
export const TYPO = {
  cols3: {
    score: "clamp(2.6rem, 7vmin, 5rem)",
    name: "clamp(1.05rem, 2.15vmin, 1.4rem)",
    header: "clamp(0.7rem, 1.45vmin, 0.9rem)",
  },
  cols4: {
    score: "clamp(2rem, 5.4vmin, 3.6rem)",
    name: "clamp(0.92rem, 1.9vmin, 1.2rem)",
    header: "clamp(0.6rem, 1.25vmin, 0.78rem)",
  },
};

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
  const key = layout.typoKey ?? "cols3";
  return TYPO[key] ?? TYPO.cols3;
}

/**
 * Kích thước lưới cho n trận: vuông nhất có thể, không bao giờ nhỏ hơn 3×3 và
 * không quá 4 cột.
 * @returns {{ columns: number, rows: number }}
 */
export function getGridSize(count) {
  const n = Math.max(1, count);
  const columns = Math.min(
    MAX_GRID_COLUMNS,
    Math.max(MIN_GRID_COLUMNS, Math.ceil(Math.sqrt(n)))
  );
  const rows = Math.max(MIN_GRID_ROWS, Math.ceil(n / columns));
  return { columns, rows };
}

/**
 * Ô trận + ô trống lấp cho đủ lưới. Trận điền theo thứ tự trái→phải,
 * trên→dưới; ô trống đầu tiên mang nhận diện giải, phần còn lại để mờ.
 */
function buildSlots(matches, columns, rows) {
  const cells = columns * rows;
  const slots = [];
  for (let i = 0; i < cells; i += 1) {
    const gridColumn = String((i % columns) + 1);
    const gridRow = String(Math.floor(i / columns) + 1);
    const match = matches[i];
    if (match) {
      slots.push({ type: "match", key: `m-${match.id}`, match, gridColumn, gridRow });
    } else {
      const isFirstEmpty = i === matches.length;
      slots.push({
        type: isFirstEmpty ? "branding" : "empty",
        key: `e-${i}`,
        gridColumn,
        gridRow,
      });
    }
  }
  return slots;
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
    typoKey: "cols3",
    gridTemplateColumns: "1fr 1fr 1fr",
    gridTemplateRows: "1fr 1fr 1fr",
    gap: "clamp(0.5rem, 1.2vmin, 0.875rem)",
    slots: [],
  };

  if (total === 0) {
    return { ...base, mode: "waiting", slots: [] };
  }

  const sorted = sortByTable(displayMatches);

  // Quá sức một màn 4×4 thì xoay trang, mỗi trang vẫn là lưới 4×4.
  const paginated = total > MAX_CELLS_PER_PAGE;
  const totalPages = paginated ? Math.ceil(total / MAX_CELLS_PER_PAGE) : 1;
  const safePage = paginated
    ? ((pageIndex % totalPages) + totalPages) % totalPages
    : 0;
  const pageMatches = paginated
    ? sorted.slice(
        safePage * MAX_CELLS_PER_PAGE,
        safePage * MAX_CELLS_PER_PAGE + MAX_CELLS_PER_PAGE
      )
    : sorted;

  const { columns, rows } = getGridSize(pageMatches.length);

  return {
    ...base,
    mode: paginated ? "paged" : `grid${columns}x${rows}`,
    typoKey: `cols${columns}`,
    paginated,
    totalPages,
    pageIndex: safePage,
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    slots: buildSlots(pageMatches, columns, rows),
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
