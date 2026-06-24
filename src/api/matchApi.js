import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

const unwrap = (p) => p.then((r) => getApiData(r));

/* ── Public ── */
export const getPublicStages  = (tournamentId) => unwrap(axiosClient.get(`/tournaments/${tournamentId}/stages`));
export const getPublicMatches = (tournamentId) => unwrap(axiosClient.get(`/tournaments/${tournamentId}/matches`));
export const getMatchDetail   = (matchId)      => unwrap(axiosClient.get(`/matches/${matchId}`));
export const getMatchEvents   = (matchId)      => unwrap(axiosClient.get(`/matches/${matchId}/events`));

/* ── Owner / Manager ── */
export const createMatchApi = (scope) => ({
  // Bracket generation
  generateDraw:  (tournamentId)    => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/draw`, {})),

  // Read stages + matches
  getStages:     (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/stages`)),
  getMatches:    (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/matches`)),

  // Match lifecycle
  startMatch:    (matchId)         => unwrap(axiosClient.patch(`/${scope}/matches/${matchId}/start`)),
  updateScore:   (matchId, body)   => unwrap(axiosClient.put(`/${scope}/matches/${matchId}/score`, body)),
  completeMatch: (matchId, body)   => unwrap(axiosClient.post(`/${scope}/matches/${matchId}/complete`, body)),
  walkover:      (matchId, body)   => unwrap(axiosClient.post(`/${scope}/matches/${matchId}/walkover`, body)),
});

export const ownerMatchApi   = createMatchApi("owner");
export const managerMatchApi = createMatchApi("manager");

/* ── Player ── */
export const getMyMatches = () => unwrap(axiosClient.get("/player/matches"));
