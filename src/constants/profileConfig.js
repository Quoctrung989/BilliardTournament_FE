/**
 * Hạng cơ thủ theo hệ phân hạng bi-a Việt Nam — PHẢI khớp enum `BilliardRank` phía backend
 * (cả `value` lẫn thứ tự mạnh→yếu, vì backend dùng thứ tự này để xếp hạt giống).
 *
 * Nhóm I→L là hạng nội bộ CLB, sinh ra do CLB đông cần chia thêm giải cho người mới.
 */
export const BILLIARD_RANK_OPTIONS = [
  { value: "CHAMPION", label: "CN — Tuyển quốc gia/tỉnh, chuyên nghiệp" },
  { value: "A", label: "A — Bán chuyên, top CLB/tỉnh" },
  { value: "B", label: "B — Chạy bàn tương đối, điều bi khá" },
  { value: "C", label: "C — Có kinh nghiệm, kỹ thuật đúng" },
  { value: "D", label: "D — Phong trào, mới lên trình" },
  { value: "E", label: "E — Phong trào, đánh được cơ bản" },
  { value: "F", label: "F — Phong trào, chơi vài tháng" },
  { value: "G", label: "G — Phong trào, người mới" },
  { value: "H", label: "H — Phong trào" },
  { value: "I", label: "I — Nội bộ CLB" },
  { value: "J", label: "J — Nội bộ CLB" },
  { value: "K", label: "K — Nội bộ CLB" },
  { value: "L", label: "L — Nội bộ CLB" },
  { value: "UNKNOWN", label: "Chưa xếp hạng" },
];

/** Mã ngắn để hiển thị gọn trên bảng/thẻ cơ thủ (vd "CN", "B"). */
export const BILLIARD_RANK_SHORT = {
  CHAMPION: "CN",
  UNKNOWN: "—",
};

export const billiardRankShort = (value) =>
  BILLIARD_RANK_SHORT[value] ?? (value || "—");

export const BILLIARD_RANK_LABELS = Object.fromEntries(
  BILLIARD_RANK_OPTIONS.map((o) => [o.value, o.label])
);

export const GENDER_LABELS = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export const EMPTY_PROFILE_FORM = {
  fullName: "",
  displayName: "",
  phone: "",
  /** Presigned URL từ GET /profile hoặc preview tạm sau upload — chỉ hiển thị */
  avatarPreviewUrl: "",
  /** MinIO objectKey — gửi vào body profile dưới tên avatarUrl */
  avatarObjectKey: "",
  dateOfBirth: "",
  gender: "",
  billiardRank: "UNKNOWN",
  bio: "",
};

export const VN_PHONE_PATTERN = /^(03|05|07|08|09)\d{8}$/;

export const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
