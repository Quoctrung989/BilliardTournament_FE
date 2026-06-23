export const BILLIARD_RANK_OPTIONS = [
  { value: "UNRANKED", label: "Chưa xếp hạng" },
  { value: "BEGINNER", label: "Mới chơi" },
  { value: "AMATEUR", label: "Phong trào" },
  { value: "SEMI_PRO", label: "Bán chuyên" },
  { value: "PRO", label: "Chuyên nghiệp" },
];

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
  billiardRank: "UNRANKED",
  bio: "",
};

export const VN_PHONE_PATTERN = /^(03|05|07|08|09)\d{8}$/;

export const ACCEPTED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
