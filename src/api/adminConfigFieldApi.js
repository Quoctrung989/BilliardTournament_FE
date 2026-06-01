import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /admin/config-field-catalog?page=&size= + filter */
export const getCatalog = (params) =>
  unwrapPaged(axiosClient.get("/admin/config-field-catalog", { params }));

export const getCatalogItem = (fieldKey) =>
  unwrap(axiosClient.get(`/admin/config-field-catalog/${fieldKey}`));
