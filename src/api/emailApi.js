import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));
const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

/** Admin — quản lý mẫu email, automation rule, nhật ký gửi trên toàn hệ thống. */
export const adminEmailApi = {
  listTemplates: (params) => unwrapPaged(axiosClient.get("/admin/email/templates", { params })),
  listVariables: () => unwrap(axiosClient.get("/admin/email/templates/variables")),
  getTemplate: (id) => unwrap(axiosClient.get(`/admin/email/templates/${id}`)),
  createTemplate: (body) => unwrap(axiosClient.post("/admin/email/templates", body)),
  updateTemplate: (id, body) => unwrap(axiosClient.put(`/admin/email/templates/${id}`, body)),
  setTemplateActive: (id, active) =>
    unwrap(axiosClient.patch(`/admin/email/templates/${id}/active`, null, { params: { active } })),
  previewTemplate: (id, body) => unwrap(axiosClient.post(`/admin/email/templates/${id}/preview`, body)),

  listRules: (params) => unwrapPaged(axiosClient.get("/admin/email/automation-rules", { params })),
  createRule: (body) => unwrap(axiosClient.post("/admin/email/automation-rules", body)),
  updateRule: (id, body) => unwrap(axiosClient.put(`/admin/email/automation-rules/${id}`, body)),
  setRuleEnabled: (id, enabled) =>
    unwrap(axiosClient.patch(`/admin/email/automation-rules/${id}/enabled`, null, { params: { enabled } })),

  listLogs: (params) => unwrapPaged(axiosClient.get("/admin/email/logs", { params })),
  getLogDetail: (id) => unwrap(axiosClient.get(`/admin/email/logs/${id}`)),

  getLayoutSettings: () => unwrap(axiosClient.get("/admin/email/layout")),
  updateLayoutSettings: (body) => unwrap(axiosClient.put("/admin/email/layout", body)),
};

/** Owner/Manager — email theo phạm vi 1 giải đấu. */
export const createTournamentEmailApi = (scope) => {
  const base = `/${scope}`;
  return {
    listTemplates: (params) => unwrapPaged(axiosClient.get(`${base}/email/templates`, { params })),
    preview: (tournamentId, body) =>
      unwrap(axiosClient.post(`${base}/tournaments/${tournamentId}/email/preview`, body)),
    sendManual: (tournamentId, body) =>
      unwrap(axiosClient.post(`${base}/tournaments/${tournamentId}/email/send-manual`, body)),
    listAutomationRules: (tournamentId) =>
      unwrap(axiosClient.get(`${base}/tournaments/${tournamentId}/email/automation-rules`)),
    setRuleEnabled: (tournamentId, ruleId, enabled) =>
      unwrap(
        axiosClient.patch(
          `${base}/tournaments/${tournamentId}/email/automation-rules/${ruleId}/enabled`,
          null,
          { params: { enabled } }
        )
      ),
    listLogs: (tournamentId, params) =>
      unwrapPaged(axiosClient.get(`${base}/tournaments/${tournamentId}/email/logs`, { params })),
  };
};

export const ownerEmailApi = createTournamentEmailApi("owner");
export const managerEmailApi = createTournamentEmailApi("manager");
