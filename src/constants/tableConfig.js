export const EMPTY_TABLE_FORM = {
  name: "",
  tableNumber: "",
  tableType: "",
  branchId: "",
};

export const TABLE_STATUS_LABELS = {
  ACTIVE: "Hoạt động",
  INACTIVE: "Ngừng hoạt động",
};

export const TABLE_TYPE_LABELS = {
  POOL: "Pool",
  CAROM: "Carom",
  SNOOKER: "Snooker",
  OTHER: "Khác",
};

export const TABLE_TYPE_OPTIONS = Object.entries(TABLE_TYPE_LABELS).map(([value, label]) => ({ value, label }));
