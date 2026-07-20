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
  // Tournament info (needed for status-driven UI)
  getTournament: (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}`)),
  getParticipants:(tournamentId)   => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/participants`)),

  // Bracket generation
  generateDraw:        (tournamentId)    => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/draw`, {})),
  confirmDraw:         (tournamentId)    => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/draw/confirm`)),
  swapPlayers:         (tournamentId, body) => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/draw/swap`, body)),
  // CUT_TO_SE: điền SE bracket từ DE survivors
  populateFinalBracket:(tournamentId)    => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/populate-final-bracket`)),
  // GROUP_PLAYOFF: xếp hạng + loại bottom
  getStandings:        (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/standings`)),
  eliminateBottom:     (tournamentId, body) => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/eliminate-bottom`, body)),
  // GROUP_PLAYOFF: populate playoff bracket từ standings
  generatePlayoff:     (tournamentId)    => unwrap(axiosClient.post(`/${scope}/tournaments/${tournamentId}/generate-playoff`)),

  // Read stages + matches
  getStages:     (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/stages`)),
  getMatches:    (tournamentId)    => unwrap(axiosClient.get(`/${scope}/tournaments/${tournamentId}/matches`)),

  // Match lifecycle
  startMatch:    (matchId)         => unwrap(axiosClient.patch(`/${scope}/matches/${matchId}/start`)),
  updateScore:   (matchId, body)   => unwrap(axiosClient.put(`/${scope}/matches/${matchId}/score`, body)),
  completeMatch: (matchId, body)   => unwrap(axiosClient.post(`/${scope}/matches/${matchId}/complete`, body)),
  walkover:      (matchId, body)   => unwrap(axiosClient.post(`/${scope}/matches/${matchId}/walkover`, body)),

  // Gán bàn / giờ thi đấu / trọng tài
  assignMatch:       (matchId, body) => unwrap(axiosClient.patch(`/${scope}/matches/${matchId}/assignment`, body)),
  bulkAssignMatches: (body)          => unwrap(axiosClient.patch(`/${scope}/matches/bulk-assignment`, body)),
  listActiveTables:  ()              =>
    unwrap(axiosClient.get(scope === "owner" ? "/owner/tables/active" : "/manager/tables")),
});

export const ownerMatchApi   = createMatchApi("owner");
export const managerMatchApi = createMatchApi("manager");

/* ── Player ── */
export const getMyMatches = () => unwrap(axiosClient.get("/player/matches"));
