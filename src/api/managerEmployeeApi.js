import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /manager/accounts/staffs */
export const getStaffs = (params) =>
  unwrapPaged(axiosClient.get("/manager/accounts/staffs", { params }));

/** POST /manager/accounts/staff */
export const createStaff = (body) =>
  unwrap(axiosClient.post("/manager/accounts/staff", body));

/** GET /manager/employees/{id} */
export const getEmployee = (id) =>
  unwrap(axiosClient.get(`/manager/employees/${id}`));

/** PUT /manager/accounts/staffs/{id}/deactivate */
export const deactivateStaff = (id) =>
  unwrap(axiosClient.put(`/manager/accounts/staffs/${id}/deactivate`));
