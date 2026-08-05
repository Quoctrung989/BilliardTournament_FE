/**
 * L1 unit tests for the shared list, wizard and formatting helpers.
 *
 * Mirrors the FE-ListAndWizard sheet in Report 5.1_UnitTests_L1.xlsx one row per test;
 * the case number is embedded in each title so the two can be traced either way.
 *
 * Spec source: UCS Report 3.1 — UC-13 (the format setup wizard), UC-16.5 and UC-12.2 (the paged
 *              lists every management screen is built on), UC-04 (the masked address on the
 *              forgot-password screen), UC-50/UC-51 (the analytics range picker).
 * Modules under test: src/utils/pagination.js, src/utils/wizardDirty.js, src/utils/formatSetup.js,
 *                     src/utils/validate.js, src/utils/helpers.js, src/utils/dateRangePresets.js
 *
 * These are the pieces every management screen shares. A wrong page count or a wizard that thinks
 * nothing changed is not a cosmetic bug: the first loses rows the Owner cannot reach, the second
 * silently drops an edit.
 */

import {
  DEFAULT_PAGE_SIZE,
  buildListParams,
  pageDisplay,
  parsePagedResponse,
} from "../../utils/pagination";
import {
  isDirty,
  serializeFields,
  serializeInfo,
  serializeRules,
} from "../../utils/wizardDirty";
import {
  getActivateBlockReason,
  normalizeSetupSummary,
} from "../../utils/formatSetup";
import { anonymizeEmail } from "../../utils/validate";
import { formatVND } from "../../utils/helpers";
import { RANGE_PRESETS, resolveRange } from "../../utils/dateRangePresets";

/** The same UTC-date rendering resolveRange uses, so the tests never straddle midnight. */
const utcDay = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe("parsePagedResponse — reading a Spring page (UC-16.5 / BR-01)", () => {
  test("TC-001 · A full Spring page is passed through as it stands", () => {
    const page = parsePagedResponse({
      content: [{ id: 1 }, { id: 2 }],
      page: 1,
      size: 9,
      totalElements: 20,
      totalPages: 3,
      first: false,
      last: false,
      numberOfElements: 2,
    });
    expect(page).toMatchObject({
      content: [{ id: 1 }, { id: 2 }],
      page: 1,
      size: 9,
      totalElements: 20,
      totalPages: 3,
      first: false,
      last: false,
    });
  });

  test("TC-002 · The three names Spring uses for the page number are all accepted", () => {
    expect(parsePagedResponse({ content: [], number: 2 }).page).toBe(2);
    expect(parsePagedResponse({ content: [], pageNumber: 3 }).page).toBe(3);
    // Our own PageResponse wrapper calls it pageNumber; a raw Spring Page calls it number
    expect(parsePagedResponse({ content: [], page: 4 }).page).toBe(4);
  });

  test("TC-003 · The page size is read from whichever field carries it", () => {
    expect(parsePagedResponse({ content: [], pageSize: 12 }).size).toBe(12);
    expect(parsePagedResponse({ content: [], pageable: { pageSize: 15 } }).size).toBe(15);
  });

  test("TC-004 · A missing total page count is computed from the size", () => {
    const page = parsePagedResponse({ content: [{ id: 1 }], size: 9, totalElements: 20 });
    // 20 rows at 9 a page is 3 pages — rounding down would hide the last two rows
    expect(page.totalPages).toBe(3);
  });

  test("TC-005 · A zero page size cannot produce a division by zero", () => {
    expect(parsePagedResponse({ content: [], size: 0, totalElements: 5 }).totalPages).toBe(0);
  });

  test("TC-006 · The first and last flags are derived when the server omits them", () => {
    const middle = parsePagedResponse({ content: [{}], page: 1, size: 9, totalElements: 30 });
    expect(middle.first).toBe(false);
    expect(middle.last).toBe(false);

    const only = parsePagedResponse({ content: [{}], page: 0, size: 9, totalElements: 5 });
    expect(only.first).toBe(true);
    expect(only.last).toBe(true);
  });

  test("TC-007 · A bare array is treated as a single complete page", () => {
    const page = parsePagedResponse([{ id: 1 }, { id: 2 }]);
    // Several endpoints answer with a plain list; the pager still has to render
    expect(page).toMatchObject({
      content: [{ id: 1 }, { id: 2 }],
      page: 0,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  test("TC-008 · An empty array reports no pages at all", () => {
    const page = parsePagedResponse([]);
    expect(page.totalPages).toBe(0);
    expect(page.size).toBe(DEFAULT_PAGE_SIZE);
  });

  test("TC-009 · A missing or unrecognised payload yields an empty page", () => {
    for (const input of [null, undefined, { unexpected: true }]) {
      const page = parsePagedResponse(input);
      expect(page.content).toEqual([]);
      expect(page.totalElements).toBe(0);
      expect(page.size).toBe(DEFAULT_PAGE_SIZE);
    }
  });

  test("TC-010 · The caller may set the fallback size for an empty page", () => {
    expect(parsePagedResponse(null, 24).size).toBe(24);
  });
});

describe("buildListParams — the query string (UC-16.5 / BR-02)", () => {
  test("TC-011 · Page and size are always sent", () => {
    expect(buildListParams()).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE });
  });

  test("TC-012 · Filters that carry a value are passed through", () => {
    expect(buildListParams({ page: 2, size: 18, status: "DRAFT", branchId: 5 })).toEqual({
      page: 2,
      size: 18,
      status: "DRAFT",
      branchId: 5,
    });
  });

  test("TC-013 · Empty filters are dropped rather than sent blank", () => {
    const params = buildListParams({ search: "", status: null, branchId: undefined });
    // Sending status= would filter on the empty string and return nothing at all
    expect(params).toEqual({ page: 0, size: DEFAULT_PAGE_SIZE });
  });

  test("TC-014 · A zero or false filter is kept, since both are real values", () => {
    const params = buildListParams({ minRank: 0, isActive: false });
    expect(params.minRank).toBe(0);
    expect(params.isActive).toBe(false);
  });

  test("TC-015 · The pager label counts from one", () => {
    // The query is zero-based and the screen is one-based
    expect(pageDisplay(0)).toBe(1);
    expect(pageDisplay(4)).toBe(5);
  });
});

describe("The wizard dirty check (UC-13 / BR-01)", () => {
  const info = {
    code: "SINGLE_ELIM",
    name: "Single Elimination",
    description: "",
    handlerKey: "single-elimination",
    schemaVersion: "1.0",
    isActive: false,
  };

  test("TC-016 · Resubmitting an untouched form counts as unchanged", () => {
    const baseline = serializeInfo(info);
    expect(isDirty(baseline, serializeInfo, { ...info })).toBe(false);
  });

  test("TC-017 · A changed field makes the form dirty", () => {
    const baseline = serializeInfo(info);
    expect(isDirty(baseline, serializeInfo, { ...info, name: "Renamed" })).toBe(true);
  });

  test("TC-018 · Whitespace-only edits are not treated as changes", () => {
    const baseline = serializeInfo(info);
    // Clicking into a field and out again must not fire a PUT
    expect(isDirty(baseline, serializeInfo, { ...info, name: "  Single Elimination  " })).toBe(false);
  });

  test("TC-019 · A missing schema version is normalised to 1.0 on both sides", () => {
    const baseline = serializeInfo({ ...info, schemaVersion: "1.0" });
    expect(isDirty(baseline, serializeInfo, { ...info, schemaVersion: undefined })).toBe(false);
  });

  test("TC-020 · With no baseline the form is always dirty", () => {
    // Before the first load there is nothing to compare against, so saving must not be skipped
    expect(isDirty(null, serializeInfo, info)).toBe(true);
    expect(isDirty(undefined, serializeInfo, info)).toBe(true);
  });

  test("TC-021 · Reordering the config fields is not a change", () => {
    const a = [
      { fieldKey: "bracket_size", defaultValue: "32", isRequired: true, isVisibleToOwner: true },
      { fieldKey: "allow_bye", defaultValue: "true", isRequired: true, isVisibleToOwner: true },
    ];
    const b = [a[1], a[0]];
    // The rows are sorted by key before comparing, so drag-and-drop does not fake an edit
    expect(serializeFields(a)).toBe(serializeFields(b));
  });

  test("TC-022 · A changed default value is a change", () => {
    const baseline = serializeFields([
      { fieldKey: "bracket_size", defaultValue: "16", isRequired: true, isVisibleToOwner: true },
    ]);
    expect(
      isDirty(baseline, serializeFields, [
        { fieldKey: "bracket_size", defaultValue: "32", isRequired: true, isVisibleToOwner: true },
      ])
    ).toBe(true);
  });

  test("TC-023 · A numeric default and its string form compare equal", () => {
    const asNumber = serializeFields([{ fieldKey: "bracket_size", defaultValue: 32 }]);
    const asString = serializeFields([{ fieldKey: "bracket_size", defaultValue: "32" }]);
    // The input hands back a string once the Admin touches it, and that is not an edit
    expect(asNumber).toBe(asString);
  });

  test("TC-024 · isVisibleToOwner defaults to true when the field omits it", () => {
    const omitted = serializeFields([{ fieldKey: "bracket_size", defaultValue: "32" }]);
    const explicit = serializeFields([
      { fieldKey: "bracket_size", defaultValue: "32", isVisibleToOwner: true },
    ]);
    expect(omitted).toBe(explicit);
  });

  test("TC-025 · Race-to rules are compared regardless of their order", () => {
    const a = [
      { id: 2, roundKey: "final", label: "Chung kết", bracketPhase: "KNOCKOUT", raceTo: 9 },
      { id: 1, roundKey: "semi_final", label: "Bán kết", bracketPhase: "KNOCKOUT", raceTo: 7 },
    ];
    expect(serializeRules(a)).toBe(serializeRules([a[1], a[0]]));
  });

  test("TC-026 · A rule with no race-to is normalised to one", () => {
    const blank = serializeRules([{ roundKey: "final", raceTo: "" }]);
    const one = serializeRules([{ roundKey: "final", raceTo: 1 }]);
    // An empty number input must not serialise as NaN, which never compares equal to itself
    expect(blank).toBe(one);
  });

  test("TC-027 · A missing list serialises the same as an empty one", () => {
    expect(serializeFields(undefined)).toBe(serializeFields([]));
    expect(serializeRules(null)).toBe(serializeRules([]));
  });
});

describe("normalizeSetupSummary — reading the review screen (UC-13 / BR-06)", () => {
  test("TC-028 · The camelCase payload is passed through", () => {
    const summary = normalizeSetupSummary({
      canActivate: true,
      setupStatus: "READY_TO_ACTIVATE",
      validationErrors: [],
      configFields: [{ fieldKey: "bracket_size" }],
      raceToRules: [{ roundKey: "final" }],
    });
    expect(summary.canActivate).toBe(true);
    expect(summary.configFields).toHaveLength(1);
    expect(summary.raceToRules).toHaveLength(1);
  });

  test("TC-029 · The snake_case spellings are accepted too", () => {
    const summary = normalizeSetupSummary({
      can_activate: true,
      setup_status: "READY_TO_ACTIVATE",
      validation_errors: ["x"],
      config_fields: [{ fieldKey: "a" }],
      race_to_rules: [{ roundKey: "final" }],
    });
    expect(summary.canActivate).toBe(true);
    expect(summary.setupStatus).toBe("READY_TO_ACTIVATE");
    expect(summary.validationErrors).toEqual(["x"]);
    expect(summary.configFields).toHaveLength(1);
  });

  test("TC-030 · The status alone is enough to enable activation", () => {
    // Some responses carry the status without the flag; the screen must not stay locked
    expect(normalizeSetupSummary({ setupStatus: "READY_TO_ACTIVATE" }).canActivate).toBe(true);
    expect(normalizeSetupSummary({ setupStatus: "ACTIVE" }).canActivate).toBe(true);
  });

  test("TC-031 · The flag is accepted as the string true as well", () => {
    expect(normalizeSetupSummary({ canActivate: "true" }).canActivate).toBe(true);
  });

  test("TC-032 · An incomplete format cannot be activated", () => {
    expect(normalizeSetupSummary({ setupStatus: "CONFIG_FIELDS_DONE" }).canActivate).toBe(false);
  });

  test("TC-033 · A non-array error field is replaced with an empty list", () => {
    // The screen maps over this value, so a string here would throw during render
    expect(normalizeSetupSummary({ errors: "boom" }).validationErrors).toEqual([]);
  });

  test("TC-034 · A missing payload yields null rather than a blank summary", () => {
    expect(normalizeSetupSummary(null)).toBeNull();
    expect(normalizeSetupSummary(undefined)).toBeNull();
  });
});

describe("getActivateBlockReason — why the button is disabled (UC-13 / BR-06)", () => {
  test("TC-035 · A summary that has not loaded says so", () => {
    expect(getActivateBlockReason(null)).toBe("Chưa tải được dữ liệu tóm tắt.");
  });

  test("TC-036 · Validation errors are named ahead of everything else", () => {
    const reason = getActivateBlockReason({ validationErrors: ["Thiếu cấu hình field"], canActivate: true });
    // Even with canActivate true, an error list means the screen is not trustworthy
    expect(reason).toContain("lỗi validation");
  });

  test("TC-037 · An incomplete setup points at the two outstanding steps", () => {
    const reason = getActivateBlockReason({ validationErrors: [], canActivate: false });
    expect(reason).toContain("Config fields");
    expect(reason).toContain("Race-to");
  });

  test("TC-038 · A format ready to go has no blocking reason", () => {
    expect(getActivateBlockReason({ validationErrors: [], canActivate: true })).toBeNull();
  });
});

describe("anonymizeEmail — the masked address (UC-04 / BR-02)", () => {
  test("TC-039 · A long local part keeps only its opening characters", () => {
    expect(anonymizeEmail("nguyenvana@gmail.com")).toBe("nguy******@gmail.com");
  });

  test("TC-040 · A short local part is masked entirely", () => {
    // Six is the ceiling, not the fixed count, so a three-letter name is fully hidden
    expect(anonymizeEmail("abc@example.com")).toBe("***@example.com");
  });

  test("TC-041 · A six-character local part is hidden with nothing left over", () => {
    expect(anonymizeEmail("abcdef@example.com")).toBe("******@example.com");
  });

  test("TC-042 · A string with no at-sign produces a meaningless mask", () => {
    // Documents the real behaviour: the caller is expected to validate the address first, and
    // this helper is only ever fed a value the backend has already accepted
    expect(anonymizeEmail("abcdef")).toBe("******@undefined");
  });
});

describe("formatVND — money on the screen (UC-51 / BR-03)", () => {
  test("TC-043 · An amount is grouped and carries the đồng sign", () => {
    const text = formatVND(300000);
    // The exact separator and the position of ₫ come from the platform's vi-VN locale data
    expect(text).toMatch(/300[.,\s]000/);
    expect(text).toContain("₫");
  });

  test("TC-044 · Zero is written out rather than left blank", () => {
    expect(formatVND(0)).toMatch(/0/);
    expect(formatVND(0)).toContain("₫");
  });
});

describe("resolveRange — the analytics range picker (UC-50 / BR-01)", () => {
  test("TC-045 · The picker offers five presets", () => {
    expect(RANGE_PRESETS.map((p) => p.value)).toEqual(["7d", "30d", "90d", "365d", "custom"]);
  });

  test("TC-046 · Seven days is a rolling window ending today", () => {
    const range = resolveRange("7d");
    expect(range.to).toBe(utcDay(0));
    expect(range.from).toBe(utcDay(-7));
    expect(range.granularity).toBe("day");
  });

  test("TC-047 · Thirty days is still charted a day at a time", () => {
    const range = resolveRange("30d");
    expect(range.from).toBe(utcDay(-30));
    expect(range.granularity).toBe("day");
  });

  test("TC-048 · Ninety days is charted by week and a year by month", () => {
    // Plotting a year at daily granularity would put 365 points on one axis
    expect(resolveRange("90d").granularity).toBe("week");
    expect(resolveRange("365d").granularity).toBe("month");
  });

  test("TC-049 · A custom range passes the caller's own bounds through", () => {
    const range = resolveRange("custom", "2026-01-01", "2026-03-31");
    expect(range).toEqual({ from: "2026-01-01", to: "2026-03-31", granularity: "month" });
  });

  test("TC-050 · A custom range with empty bounds sends nothing rather than blanks", () => {
    const range = resolveRange("custom", "", "");
    // An empty string in the query would be parsed as an invalid date by the backend
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  test("TC-051 · An unknown preset falls back to no range at all", () => {
    const range = resolveRange("all-time");
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
    expect(range.granularity).toBe("month");
  });
});
