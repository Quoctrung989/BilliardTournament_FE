export const RANGE_PRESETS = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "3 tháng" },
  { value: "365d", label: "12 tháng" },
  { value: "custom", label: "Tùy chỉnh" },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);

/**
 * Luôn là cửa sổ trượt kết thúc ở hôm nay (rolling window), KHÔNG bám theo ranh giới quý/năm dương
 * lịch — tránh trường hợp gây khó hiểu như "Quý này" (calendar quarter) bỏ sót giao dịch tháng
 * trước chỉ vì quý mới vừa bắt đầu vài ngày.
 */
export const resolveRange = (preset, customFrom, customTo) => {
  const today = new Date();
  const toStr = toDateStr(today);
  const rollingFrom = (daysBack) => {
    const from = new Date(today); from.setDate(from.getDate() - daysBack);
    return toDateStr(from);
  };
  switch (preset) {
    case "7d":
      return { from: rollingFrom(7), to: toStr, granularity: "day" };
    case "30d":
      return { from: rollingFrom(30), to: toStr, granularity: "day" };
    case "90d":
      return { from: rollingFrom(90), to: toStr, granularity: "week" };
    case "365d":
      return { from: rollingFrom(365), to: toStr, granularity: "month" };
    case "custom":
      return { from: customFrom || undefined, to: customTo || undefined, granularity: "month" };
    default:
      return { from: undefined, to: undefined, granularity: "month" };
  }
};
