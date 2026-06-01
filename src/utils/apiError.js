export const getApiData = (response) => response?.data?.data;

export const getApiErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return "Có lỗi xảy ra. Vui lòng thử lại.";
};

export const getApiErrorCode = (error) => error?.response?.data?.code;
