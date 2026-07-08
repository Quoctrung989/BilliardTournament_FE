import { VN_PHONE_PATTERN } from "../../constants/profileConfig";

export const profileToForm = (profile) => ({
  fullName: profile?.fullName || "",
  displayName: profile?.displayName || "",
  phone: profile?.phone || "",
  avatarPreviewUrl: profile?.avatarUrl || "",
  avatarObjectKey: "",
  dateOfBirth: profile?.dateOfBirth || "",
  gender: profile?.gender || "",
  billiardRank: profile?.billiardRank || "UNRANKED",
  bio: profile?.bio || "",
});

export const validateProfileForm = (form, { mode = "edit", isPlayer = true } = {}) => {
  const errors = {};

  if (!form.fullName?.trim()) {
    errors.fullName = "Họ và tên là bắt buộc";
  }

  if (mode === "edit" && form.phone?.trim() && !VN_PHONE_PATTERN.test(form.phone.trim())) {
    errors.phone = "Số điện thoại VN hợp lệ: 10 số, bắt đầu 03/05/07/08/09";
  }

  if (form.dateOfBirth && form.dateOfBirth > new Date().toISOString().slice(0, 10)) {
    errors.dateOfBirth = "Ngày sinh không được là ngày trong tương lai";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const body = {
    fullName: form.fullName.trim(),
  };

  const optional = (key, value) => {
    if (value != null && String(value).trim() !== "") {
      body[key] = String(value).trim();
    }
  };

  optional("displayName", form.displayName);
  /** BE lưu objectKey; field API vẫn là avatarUrl */
  optional("avatarUrl", form.avatarObjectKey);
  optional("dateOfBirth", form.dateOfBirth);
  optional("gender", form.gender);
  optional("bio", form.bio);

  if (mode === "edit") {
    optional("phone", form.phone);
  }

  if (isPlayer) {
    body.billiardRank = form.billiardRank?.trim() || "UNRANKED";
  }

  return { body, errors: null };
};
