import { useTournamentSocket } from "./useTournamentSocket";

/**
 * @deprecated Dùng {@link useTournamentSocket} — giữ để DrawPage / MatchesTab không vỡ.
 *
 * @param {number|null} tournamentId
 * @param {(match: object) => void} onMatchUpdate
 */
export function useMatchWebSocket(tournamentId, onMatchUpdate) {
  useTournamentSocket(tournamentId, { onMatchUpdate });
}
