/** Chuẩn hóa response GET setup-summary từ BE */
export const normalizeSetupSummary = (data) => {
  if (!data) return null;

  const validationErrors =
    data.validationErrors ?? data.validation_errors ?? data.errors ?? [];

  const canActivateRaw =
    data.canActivate ??
    data.can_activate ??
    data.readyToActivate ??
    data.ready_to_activate;

  const setupStatus = data.setupStatus ?? data.setup_status;
  const canActivate =
    canActivateRaw === true ||
    canActivateRaw === "true" ||
    setupStatus === "READY_TO_ACTIVATE" ||
    setupStatus === "ACTIVE";

  return {
    ...data,
    canActivate,
    setupStatus,
    validationErrors: Array.isArray(validationErrors) ? validationErrors : [],
    configFields: data.configFields ?? data.config_fields ?? [],
    raceToRules: data.raceToRules ?? data.race_to_rules ?? [],
  };
};

export const getActivateBlockReason = (summary) => {
  if (!summary) return "Chưa tải được dữ liệu tóm tắt.";
  const errors = summary.validationErrors ?? [];
  if (errors.length > 0) {
    return "Còn lỗi validation — xem danh sách phía trên.";
  }
  if (!summary.canActivate) {
    return "Chưa đủ điều kiện kích hoạt. Hoàn tất bước Thông số thi đấu và Số ván mỗi vòng, hoặc dùng mẫu dựng sẵn.";
  }
  return null;
};
