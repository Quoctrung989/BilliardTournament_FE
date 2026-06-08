export const ACCOUNT_STATUS_LABELS = {
  ACTIVE: "Đang hoạt động",
  LOCKED: "Đã khóa",
  INACTIVE: "Không hoạt động",
  PENDING: "Chờ xử lý",
};

export const ACCOUNT_ROLE_LABELS = {
  ADMIN: "Admin",
  OWNER: "Owner",
  MANAGER: "Manager",
  STAFF: "Staff",
  PLAYER: "Player",
};

export const GENDER_OPTIONS = [
  { value: "", label: "— Không chọn —" },
  { value: "MALE", label: "Nam" },
  { value: "FEMALE", label: "Nữ" },
  { value: "OTHER", label: "Khác" },
];

export const ADMIN_ROLE_FILTER = [
  { value: "", label: "Tất cả vai trò" },
  { value: "ADMIN", label: "Admin" },
  { value: "OWNER", label: "Owner" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
  { value: "PLAYER", label: "Player" },
];

export const OWNER_ROLE_FILTER = [
  { value: "", label: "Tất cả" },
  { value: "MANAGER", label: "Manager" },
  { value: "STAFF", label: "Staff" },
];
