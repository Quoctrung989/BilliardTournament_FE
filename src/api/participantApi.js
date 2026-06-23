import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (promise) => promise.then((res) => getApiData(res));

export const createParticipantApi = (scope) => ({
  listParticipants: (tournamentId) =>
    unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/participants`)),

  addManual: (tournamentId, body) =>
    unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/participants/manual`, body)),

  importExcel: (tournamentId, file) => {
    const form = new FormData();
    form.append("file", file);
    return unwrap(
      axiosClient.post(`/${scope}/tournaments/${tournamentId}/participants/import-excel`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  withdraw: (participantId) =>
    unwrap(axiosClient.patch(`/${scope}/participants/${participantId}/withdraw`)),
});

export const ownerParticipantApi  = createParticipantApi("owner");
export const managerParticipantApi = createParticipantApi("manager");

/** Public — no auth */
export const listPublicParticipants = (tournamentId) =>
  unwrap(axiosClient.get(`/tournaments/${tournamentId}/participants`));
