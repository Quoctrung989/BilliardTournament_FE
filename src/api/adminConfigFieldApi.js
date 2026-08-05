import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/**
 * GET /admin/config-field-catalog
 * @param {number} [page=0]
 * @param {number} [size=10]
 * @param {string} [scope] — một giá trị UPPERCASE hoặc chuỗi "COMMON,KNOCKOUT"; omit = tất cả phạm vi
 * @param {boolean} [isActive] — omit = BE mặc định true (chỉ active)
 */
export const getCatalog = ({ page = 0, size = 10, scope, isActive } = {}) => {
  const params = { page, size };

  if (scope) {
    params.scope = scope;
  }

  if (isActive !== undefined) {
    params.isActive = isActive;
  }

  return unwrapPaged(
    axiosClient.get("/admin/config-field-catalog", { params }),
    size
  );
};

export const getCatalogItem = (fieldKey) =>
  unwrap(axiosClient.get(`/admin/config-field-catalog/${fieldKey}`));

/** POST /admin/config-field-catalog */
export const createCatalogItem = (body) =>
  unwrap(axiosClient.post("/admin/config-field-catalog", body));

/** PUT /admin/config-field-catalog/{fieldKey} */
export const updateCatalogItem = (fieldKey, body) =>
  unwrap(axiosClient.put(`/admin/config-field-catalog/${fieldKey}`, body));

/** PATCH /admin/config-field-catalog/{fieldKey}/active — body: { isActive } */
export const patchCatalogItemActive = (fieldKey, body) =>
  unwrap(axiosClient.patch(`/admin/config-field-catalog/${fieldKey}/active`, body));
