import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * GET /employees — danh sách nhân viên & trọng tài công khai (mọi role đã đăng nhập).
 * Backend cần mở endpoint này; FE đã wire sẵn.
 * params: { page, size, keyword, type } — type = "STAFF" | "REFEREE" (tùy backend hỗ trợ).
 */
export const listPublicEmployees = (params) =>
  unwrapPaged(axiosClient.get("/employees", { params }));
