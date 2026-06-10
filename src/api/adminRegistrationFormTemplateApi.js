import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const getRegistrationFormTemplates = (params) =>
  unwrapPaged(axiosClient.get("/admin/registration-form-templates", { params }));

export const getRegistrationFormTemplate = (id) =>
  unwrap(axiosClient.get(`/admin/registration-form-templates/${id}`));

export const createRegistrationFormTemplate = (body) =>
  unwrap(axiosClient.post("/admin/registration-form-templates", body));

export const updateRegistrationFormTemplate = (id, body) =>
  unwrap(axiosClient.put(`/admin/registration-form-templates/${id}`, body));

export const patchRegistrationFormTemplateActive = (id, body) =>
  unwrap(axiosClient.patch(`/admin/registration-form-templates/${id}`, body));

export const getRegistrationFormTemplateFields = (id) =>
  unwrap(axiosClient.get(`/admin/registration-form-templates/${id}/fields`));

export const saveRegistrationFormTemplateFields = (id, body) =>
  unwrap(axiosClient.put(`/admin/registration-form-templates/${id}/fields`, body));

export const deleteRegistrationFormTemplateField = (id, fieldKey) =>
  unwrap(axiosClient.delete(`/admin/registration-form-templates/${id}/fields/${fieldKey}`));

export const getRegistrationFormTemplatePreview = (id) =>
  unwrap(axiosClient.get(`/admin/registration-form-templates/${id}/preview`));
