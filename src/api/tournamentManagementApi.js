import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";
import { parsePagedResponse } from "../utils/pagination";

const unwrap = (promise) => promise.then((res) => getApiData(res));

const unwrapPaged = (promise, fallbackSize) =>
  promise.then((res) => parsePagedResponse(getApiData(res), fallbackSize));

export const createTournamentManagementApi = (scope) => {
  const base = `/${scope}`;

  return {
    listTournaments: (params) =>
      unwrapPaged(axiosClient.get(`${base}/tournaments`, { params })),
    listFormats: () => unwrap(axiosClient.get(`${base}/formats`)),
    listGameTypes: () => unwrap(axiosClient.get(`${base}/game-types`)),
    createTournament: (body) => unwrap(axiosClient.post(`${base}/tournaments`, body)),
    updateTournament: (id, body) => unwrap(axiosClient.put(`${base}/tournaments/${id}`, body)),
    getTournament: (id) => unwrap(axiosClient.get(`${base}/tournaments/${id}`)),
    getConfigForm: (id) => unwrap(axiosClient.get(`${base}/tournaments/${id}/config-form`)),
    saveConfig: (id, body) => unwrap(axiosClient.put(`${base}/tournaments/${id}/config`, body)),
    getResolvedConfig: (id) => unwrap(axiosClient.get(`${base}/tournaments/${id}/config`)),
    validateConfig: (id) =>
      unwrap(axiosClient.post(`${base}/tournaments/${id}/config/validate`, {})),
    patchStatus: (id, body) =>
      unwrap(axiosClient.patch(`${base}/tournaments/${id}/status`, body)),
    listRegistrationFormTemplates: () =>
      unwrap(axiosClient.get(`${base}/registration-form-templates`)),
    getTournamentRegistrationForm: (id) =>
      unwrap(axiosClient.get(`${base}/tournaments/${id}/registration-form`)),
    listTournamentRegistrations: (id, params) =>
      unwrapPaged(axiosClient.get(`${base}/tournaments/${id}/registrations`, { params })),
    getRegistrationDetail: (id) => unwrap(axiosClient.get(`${base}/registrations/${id}`)),
    approveRegistration: (id) =>
      unwrap(axiosClient.post(`${base}/registrations/${id}/approve`, {})),
    rejectRegistration: (id, body) =>
      unwrap(axiosClient.post(`${base}/registrations/${id}/reject`, body)),
  };
};

export const ownerTournamentApi = createTournamentManagementApi("owner");
export const managerTournamentApi = createTournamentManagementApi("manager");
