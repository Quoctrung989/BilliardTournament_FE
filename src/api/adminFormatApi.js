import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** GET /admin/formats?page=&size= + filter */
export const getFormats = (params) =>
  unwrapPaged(axiosClient.get("/admin/formats", { params }));

export const getFormat = (code) =>
  unwrap(axiosClient.get(`/admin/formats/${code}`));

export const createFormat = (body) =>
  unwrap(axiosClient.post("/admin/formats", body));

export const updateFormat = (code, body) =>
  unwrap(axiosClient.put(`/admin/formats/${code}`, body));

export const patchFormatActive = (code, body) =>
  unwrap(axiosClient.patch(`/admin/formats/${code}`, body));

export const getSetupStatus = (code) =>
  unwrap(axiosClient.get(`/admin/formats/${code}/setup-status`));

export const getConfigFields = (code) =>
  unwrap(axiosClient.get(`/admin/formats/${code}/config-fields`));

export const saveConfigFields = (code, body) =>
  unwrap(axiosClient.put(`/admin/formats/${code}/config-fields`, body));

export const getRaceToRules = (code) =>
  unwrap(axiosClient.get(`/admin/formats/${code}/race-to-rules`));

export const saveRaceToRules = (code, body) =>
  unwrap(axiosClient.put(`/admin/formats/${code}/race-to-rules`, body));

export const getSetupSummary = (code) =>
  unwrap(axiosClient.get(`/admin/formats/${code}/setup-summary`));

export const activateFormat = (code) =>
  unwrap(axiosClient.post(`/admin/formats/${code}/activate`));

export const bootstrapDefaults = (code, body) =>
  unwrap(axiosClient.post(`/admin/formats/${code}/bootstrap-defaults`, body));
