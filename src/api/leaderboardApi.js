import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * Bảng xếp hạng điểm tích lũy cơ thủ (công khai).
 *
 * @param {object} params
 * @param {"MONTH"|"QUARTER"|"YEAR"|"ALL"} params.period kỳ thống kê
 * @param {number} [params.year]    năm áp dụng — mặc định năm hiện tại
 * @param {number} [params.quarter] quý 1-4, chỉ dùng khi period = QUARTER
 * @param {number} [params.month]   tháng 1-12, chỉ dùng khi period = MONTH
 * @param {number} [params.page]
 * @param {number} [params.size]
 */
export const getLeaderboard = (params, fallbackSize) =>
  unwrapPaged(axiosClient.get("/leaderboard", { params }), fallbackSize);
