export const getApiData = (response) => response?.data?.data;

export const getApiErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "Có lỗi xảy ra. Vui lòng thử lại.";
};

export const getFriendlyApiErrorMessage = (error, fallback) => {
  const msg = getApiErrorMessage(error);
  if (!msg) {
    return fallback || "Có lỗi xảy ra. Vui lòng thử lại.";
  }
  const lower = String(msg).toLowerCase();
  const looksTechnical =
    lower.includes("network error") ||
    lower.includes("failed to fetch") ||
    lower.includes("timeout") ||
    lower.includes("status code") ||
    lower.includes("exception") ||
    lower.includes("stack");
  if (looksTechnical) {
    return fallback || "Không thể kết nối máy chủ. Vui lòng thử lại.";
  }
  return msg;
};

export const getApiErrorCode = (error) => error?.response?.data?.code;

export const getApiValidationDetails = (error) =>
  error?.response?.data?.details || [];
