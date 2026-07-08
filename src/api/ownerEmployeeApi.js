import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /owner/employees */
export const getEmployees = (params) =>
  unwrapPaged(axiosClient.get("/owner/employees", { params }));

/** POST /owner/accounts/manager */
export const createManager = (body) =>
  unwrap(axiosClient.post("/owner/accounts/manager", body));

/** POST /owner/accounts/staff */
export const createStaff = (body) =>
  unwrap(axiosClient.post("/owner/accounts/staff", body));

/** GET /owner/employees/{id} */
export const getEmployee = (id) =>
  unwrap(axiosClient.get(`/owner/employees/${id}`));

/** PUT /owner/employees/{id}/deactivate */
export const deactivateEmployee = (id) =>
  unwrap(axiosClient.put(`/owner/employees/${id}/deactivate`));

/** PUT /owner/employees/{id} */
export const updateEmployee = (id, body) =>
  unwrap(axiosClient.put(`/owner/employees/${id}`, body));
