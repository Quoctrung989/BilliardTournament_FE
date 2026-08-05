import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (promise) => promise.then((res) => getApiData(res));

export const createParticipantApi = (scope) => ({
  listParticipants: (tournamentId) =>
    unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/participants`)),

  addManual: (tournamentId, body) =>
    unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/participants/manual`, body)),

  previewImportExcel: (tournamentId, file) => {
    const form = new FormData();
    form.append("file", file);
    return unwrap(
      axiosClient.post(`/${scope}/tournaments/${tournamentId}/participants/import-excel/preview`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
    );
  },

  confirmImportExcel: (tournamentId, rows) =>
    unwrap(
      axiosClient.post(`/${scope}/tournaments/${tournamentId}/participants/import-excel/confirm`, { rows })
    ),

  withdraw: (participantId) =>
    unwrap(axiosClient.patch(`/${scope}/participants/${participantId}/withdraw`)),

  downloadImportTemplate: async (tournamentId) => {
    const res = await axiosClient.get(
      `/${scope}/tournaments/${tournamentId}/participants/import-template`,
      { responseType: "blob" }
    );
    const disposition = res.headers?.["content-disposition"] || "";
    const match = disposition.match(/filename="?([^";\s]+)"?/i);
    const filename = match?.[1] || "template_import_participant.xlsx";
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
});

export const ownerParticipantApi  = createParticipantApi("owner");
export const managerParticipantApi = createParticipantApi("manager");

/** Public — no auth */
export const listPublicParticipants = (tournamentId) =>
  unwrap(axiosClient.get(`/tournaments/${tournamentId}/participants`));
