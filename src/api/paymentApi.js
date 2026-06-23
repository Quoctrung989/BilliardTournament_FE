import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));
const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** Player: Tạo link thanh toán PayOS cho một đăng ký */
export const createCheckout = (registrationId) =>
  unwrap(axiosClient.post(`/player/registrations/${registrationId}/checkout`));

/** Player: Xác nhận thanh toán sau khi PayOS redirect về (backup cho webhook) */
export const confirmPaymentReturn = (orderCode, status = "PAID") =>
  unwrap(axiosClient.post("/player/payments/confirm-return", null, {
    params: { orderCode, status },
  }));

/** Player: Lịch sử thanh toán */
export const getMyPayments = (params) =>
  unwrapPaged(axiosClient.get("/player/payments", { params }));

/** Manager/Owner: Lịch sử thanh toán theo registration */
export const getPaymentsByRegistration = (registrationId, scope = "manager") =>
  unwrap(axiosClient.get(`/${scope}/registrations/${registrationId}/payments`));
