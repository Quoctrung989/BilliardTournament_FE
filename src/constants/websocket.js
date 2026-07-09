/** STOMP broker URL — http→ws, https→wss */
export const getWebSocketUrl = () => {
  const base = process.env.REACT_APP_API_URL || "http://localhost:8080";
  return base.replace(/^http/, "ws") + "/ws";
};

export const tournamentMatchesTopic = (tournamentId) =>
  `/topic/tournament/${tournamentId}/matches`;

export const tournamentBracketTopic = (tournamentId) =>
  `/topic/tournament/${tournamentId}/bracket`;

/** @typedef {'connecting' | 'connected' | 'reconnecting' | 'disconnected'} SocketConnectionState */
