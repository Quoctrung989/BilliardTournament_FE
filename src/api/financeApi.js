import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (promise) => promise.then((res) => getApiData(res));

export const createFinanceApi = (scope) => ({
  getSummary: (tournamentId) =>
    unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/finance`)),

  createEntry: (tournamentId, body) =>
    unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/finance`, body)),

  updateEntry: (tournamentId, entryId, body) =>
    unwrap(axiosClient.put(`/${scope}/tournaments/${tournamentId}/finance/${entryId}`, body)),

  deleteEntry: (tournamentId, entryId) =>
    unwrap(axiosClient.delete(`/${scope}/tournaments/${tournamentId}/finance/${entryId}`)),
});

export const ownerFinanceApi = createFinanceApi("owner");
export const managerFinanceApi = createFinanceApi("manager");
