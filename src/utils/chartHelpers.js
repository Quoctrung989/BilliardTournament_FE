/* Status → color kept consistent with the badge colors used elsewhere in the app
   (tournamentConfig.js), so a given status always reads the same color everywhere. */
export const STATUS_COLORS = {
  DRAFT: "#64748b",
  OPEN_FOR_REGISTRATION: "#10b981",
  REGISTRATION_CLOSED: "#f59e0b",
  DRAW_PREVIEW: "#eab308",
  DRAW_DONE: "#3b82f6",
  FINAL_BRACKET_READY: "#06b6d4",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#14b8a6",
  CANCELLED: "#f43f5e",
  PENDING_PAYMENT: "#f59e0b",
  PAID: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#f43f5e",
  PENDING: "#f59e0b",
  SUCCESS: "#10b981",
  FAILED: "#f43f5e",
  ACTIVE: "#10b981",
  INACTIVE: "#64748b",
  WITHDRAWN: "#f43f5e",
  BYE: "#06b6d4",
  WALKOVER: "#f59e0b",
};
export const FALLBACK_PALETTE = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#8b5cf6", "#f43f5e", "#14b8a6", "#64748b"];
export const colorFor = (status, idx) => STATUS_COLORS[status] || FALLBACK_PALETTE[idx % FALLBACK_PALETTE.length];

export const hasCounts = (items) => Array.isArray(items) && items.some((i) => (i.count ?? 0) > 0);

export const shortMoney = (v) => {
  const n = Number(v) || 0;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}tỷ`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}tr`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(0)}k`;
  return `${n}`;
};

/**
 * Highcharts không đọc class Tailwind "dark:" — options là object JS thuần nên phải tự chọn màu
 * theo theme hiện tại (isDark truyền vào từ trang, đọc qua useThemeStore) thay vì để mặc định
 * Highcharts (chữ đen), nếu không chữ/trục/legend sẽ gần như vô hình trên nền tối.
 */
const themeColors = (isDark) => (isDark ? {
  text: "#cbd5e1",
  axisLine: "rgba(255,255,255,0.18)",
  gridLine: "rgba(255,255,255,0.08)",
  tooltipBg: "#1e293b",
  tooltipText: "#f1f5f9",
  pieBorder: "#0e1626",
} : {
  text: "#475569",
  axisLine: "#e2e8f0",
  gridLine: "#f1f5f9",
  tooltipBg: "#ffffff",
  tooltipText: "#1e293b",
  pieBorder: "#ffffff",
});

export const chartBase = (isDark = false) => {
  const c = themeColors(isDark);
  return {
    chart: { backgroundColor: "transparent", style: { fontFamily: "inherit", color: c.text }, height: 280 },
    credits: { enabled: false },
    tooltip: { backgroundColor: c.tooltipBg, style: { color: c.tooltipText } },
  };
};

export const donutOptions = (items, seriesName, isDark = false) => {
  const c = themeColors(isDark);
  const base = chartBase(isDark);
  return {
    ...base,
    chart: { ...base.chart, type: "pie" },
    title: { text: null },
    tooltip: { ...base.tooltip, pointFormat: "<b>{point.y}</b> ({point.percentage:.0f}%)" },
    legend: { enabled: true, itemStyle: { fontSize: "11px", fontWeight: 500, color: c.text }, itemHoverStyle: { color: isDark ? "#ffffff" : "#0f172a" } },
    plotOptions: {
      pie: { innerSize: "62%", borderWidth: 2, borderColor: c.pieBorder, dataLabels: { enabled: false } },
    },
    series: [{
      name: seriesName,
      data: items.map((i, idx) => ({ name: i.label, y: i.count, color: colorFor(i.status, idx) })),
    }],
  };
};

export const areaTrendOptions = (points, seriesName, color, valueKey, formatter, isDark = false) => {
  const c = themeColors(isDark);
  const base = chartBase(isDark);
  return {
    ...base,
    chart: { ...base.chart, type: "areaspline" },
    title: { text: null },
    xAxis: {
      categories: points.map((p) => p.period),
      lineColor: c.axisLine, tickColor: c.axisLine,
      labels: { style: { color: c.text } },
    },
    yAxis: {
      title: { text: null },
      gridLineColor: c.gridLine,
      allowDecimals: valueKey !== "amount",
      labels: { style: { color: c.text }, formatter: formatter ? function () { return formatter(this.value); } : undefined },
    },
    tooltip: formatter
      ? { ...base.tooltip, formatter() { return `${this.x}: <b>${formatter(this.y)}</b>`; } }
      : { ...base.tooltip, pointFormat: "<b>{point.y}</b>" },
    plotOptions: { areaspline: { fillOpacity: 0.15, marker: { enabled: false }, lineWidth: 2 } },
    series: [{
      name: seriesName,
      color,
      fillColor: {
        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
        stops: [[0, `${color}59`], [1, `${color}00`]],
      },
      data: points.map((p) => Number(p[valueKey] ?? 0)),
    }],
  };
};

export const columnTrendOptions = (points, seriesName, color, isDark = false) => {
  const c = themeColors(isDark);
  const base = chartBase(isDark);
  return {
    ...base,
    chart: { ...base.chart, type: "column" },
    title: { text: null },
    xAxis: { categories: points.map((p) => p.period), lineColor: c.axisLine, labels: { style: { color: c.text } } },
    yAxis: { title: { text: null }, gridLineColor: c.gridLine, allowDecimals: false, labels: { style: { color: c.text } } },
    tooltip: { ...base.tooltip, pointFormat: "<b>{point.y}</b>" },
    plotOptions: { column: { borderRadius: 6, borderWidth: 0, color } },
    series: [{ name: seriesName, data: points.map((p) => p.count) }],
  };
};

export const barByStatusOptions = (items, seriesName, isDark = false) => {
  const c = themeColors(isDark);
  const base = chartBase(isDark);
  return {
    ...base,
    chart: { ...base.chart, type: "bar", height: Math.max(180, items.length * 44) },
    title: { text: null },
    xAxis: { categories: items.map((i) => i.label), lineColor: c.axisLine, labels: { style: { color: c.text } } },
    yAxis: { title: { text: null }, gridLineColor: c.gridLine, allowDecimals: false, labels: { style: { color: c.text } } },
    tooltip: { ...base.tooltip, pointFormat: "<b>{point.y}</b>" },
    plotOptions: { bar: { borderRadius: 4, borderWidth: 0, dataLabels: { enabled: true, style: { color: c.text, textOutline: "none" } } } },
    series: [{
      name: seriesName,
      data: items.map((i, idx) => ({ y: i.count, color: colorFor(i.status, idx) })),
    }],
  };
};

/** Bar chart theo số tiền (doanh thu theo chi nhánh/giải đấu) thay vì count. */
export const barByAmountOptions = (items, seriesName, color, isDark = false) => {
  const c = themeColors(isDark);
  const base = chartBase(isDark);
  return {
    ...base,
    chart: { ...base.chart, type: "bar", height: Math.max(180, items.length * 40) },
    title: { text: null },
    xAxis: { categories: items.map((i) => i.label), lineColor: c.axisLine, labels: { style: { color: c.text } } },
    yAxis: {
      title: { text: null },
      gridLineColor: c.gridLine,
      labels: { style: { color: c.text }, formatter() { return shortMoney(this.value); } },
    },
    tooltip: { ...base.tooltip, formatter() { return `${this.x}: <b>${shortMoney(this.y)}</b>`; } },
    plotOptions: { bar: { borderRadius: 4, borderWidth: 0, color } },
    series: [{ name: seriesName, data: items.map((i) => Number(i.amount ?? 0)) }],
  };
};
