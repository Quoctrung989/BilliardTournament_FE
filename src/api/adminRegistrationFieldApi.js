import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const getRegistrationFieldCatalog = (params) =>
  unwrapPaged(axiosClient.get("/admin/registration-field-catalog", { params }));

export const getRegistrationFieldCatalogItem = (fieldKey) =>
  unwrap(axiosClient.get(`/admin/registration-field-catalog/${fieldKey}`));

export const createRegistrationField = (body) =>
  unwrap(axiosClient.post("/admin/registration-field-catalog", body));

export const updateRegistrationField = (fieldKey, body) =>
  unwrap(axiosClient.put(`/admin/registration-field-catalog/${fieldKey}`, body));

export const patchRegistrationFieldActive = (fieldKey, body) =>
  unwrap(axiosClient.patch(`/admin/registration-field-catalog/${fieldKey}`, body));
