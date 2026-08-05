export const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;

export const CATALOG_DATA_TYPES = [
  { value: "BOOLEAN", label: "Có / Không" },
  { value: "INT", label: "Số nguyên" },
  { value: "ENUM", label: "Danh sách chọn" },
  { value: "STRING", label: "Chuỗi văn bản" },
];

export const CATALOG_DATA_TYPE_LABELS = {
  BOOLEAN: "Có / Không",
  INT: "Số nguyên",
  ENUM: "Danh sách chọn",
  STRING: "Chuỗi văn bản",
};

export const CATALOG_FIELD_SCOPES = [
  { value: "COMMON", label: "Chung" },
  { value: "KNOCKOUT", label: "Loại trực tiếp" },
  { value: "DOUBLE_ELIM", label: "Loại kép" },
  { value: "PROGRESSIVE", label: "Vòng tròn loại dần" },
];

export const CATALOG_SCOPE_LABELS = Object.fromEntries(
  CATALOG_FIELD_SCOPES.map((o) => [o.value, o.label])
);

export const CATALOG_UI_LABELS = {
  CHECKBOX: "Hộp chọn",
  NUMBER: "Ô nhập số",
  SELECT: "Danh sách thả",
  TEXT: "Ô nhập chữ",
};

export const UI_COMPONENT_BY_DATA_TYPE = {
  BOOLEAN: "CHECKBOX",
  INT: "NUMBER",
  ENUM: "SELECT",
  STRING: "TEXT",
};
