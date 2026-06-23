export const REGISTRATION_DATA_TYPES = [
  { value: "STRING", label: "Chuỗi" },
  { value: "INT", label: "Số nguyên" },
  { value: "DECIMAL", label: "Số thập phân" },
  { value: "BOOLEAN", label: "Có/Không" },
  { value: "ENUM", label: "Lựa chọn" },
  { value: "DATE", label: "Ngày" },
  { value: "PHONE", label: "Số điện thoại" },
  { value: "EMAIL", label: "Email" },
];

export const REGISTRATION_UI_COMPONENTS = [
  { value: "TEXT", label: "Ô text" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "NUMBER", label: "Số" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "SELECT", label: "Dropdown" },
  { value: "RADIO", label: "Radio" },
  { value: "DATE_PICKER", label: "Chọn ngày" },
  { value: "PHONE_INPUT", label: "Số điện thoại" },
  { value: "EMAIL_INPUT", label: "Email" },
];

export const REGISTRATION_STATUS_LABELS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  APPROVED: "Tham gia chính thức",
  REJECTED: "Không được tham gia",
  CANCELLED: "Đã hủy",
};

export const REGISTRATION_STATUS_STYLES = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-blue-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};
