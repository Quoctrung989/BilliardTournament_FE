/** Mã loại bi — UPPER_SNAKE_CASE, vd. 9_BALL */
export const GAME_TYPE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_]*$/;

export const COMPATIBLE_TABLE_TYPES = [
  { value: "POOL", label: "Bida lỗ (Pool)" },
  { value: "SNOOKER", label: "Snooker" },
  { value: "CAROM", label: "Bida 3 băng (Carom)" },
];

export const TABLE_TYPE_LABELS = Object.fromEntries(
  COMPATIBLE_TABLE_TYPES.map((o) => [o.value, o.label])
);

export const EMPTY_GAME_TYPE_FORM = {
  code: "",
  name: "",
  description: "",
  defaultRaceTo: 7,
  compatibleTableTypes: ["POOL"],
  isActive: true,
};
