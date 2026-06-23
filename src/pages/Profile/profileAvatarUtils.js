/** objectKey từ POST /storage/images — dùng làm avatarUrl khi lưu profile */
export const pickAvatarObjectKey = (data) =>
  data?.objectKey || data?.avatarObjectKey || "";
