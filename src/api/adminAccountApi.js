import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /admin/accounts */
export const getAccounts = (params) =>
  unwrapPaged(axiosClient.get("/admin/accounts", { params }));

/** POST /admin/accounts/admin */
export const createAdmin = (body) =>
  unwrap(axiosClient.post("/admin/accounts/admin", body));

/** POST /admin/accounts/owner */
export const createOwner = (body) =>
  unwrap(axiosClient.post("/admin/accounts/owner", body));

/** PUT /admin/accounts/{id}/deactivate */
export const deactivateAccount = (id) =>
  unwrap(axiosClient.put(`/admin/accounts/${id}/deactivate`));
