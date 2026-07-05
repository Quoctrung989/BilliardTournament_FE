import { useEffect, useRef, useCallback } from "react";
import { Client } from "@stomp/stompjs";

const WS_URL = (process.env.REACT_APP_API_URL || "http://localhost:8080")
  .replace(/^http/, "ws") + "/ws";

/**
 * Hook kết nối STOMP WebSocket và lắng nghe update trận đấu theo tournament.
 *
 * @param {number|null} tournamentId  - ID giải đấu cần subscribe
 * @param {function}    onMatchUpdate - callback(matchResponse) khi có update
 */
export function useMatchWebSocket(tournamentId, onMatchUpdate) {
  const clientRef    = useRef(null);
  const subscribeRef = useRef(null);
  const callbackRef  = useRef(onMatchUpdate);

  // Luôn dùng callback mới nhất mà không reconnect
  useEffect(() => { callbackRef.current = onMatchUpdate; }, [onMatchUpdate]);

  const connect = useCallback(() => {
    if (!tournamentId) return;

    const client = new Client({
      brokerURL: WS_URL,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        const topic = `/topic/tournament/${tournamentId}/matches`;
        subscribeRef.current = client.subscribe(topic, (msg) => {
          try {
            const payload = JSON.parse(msg.body);
            // Backend gửi MatchUpdateMessage wrapper: { type, match, matches }
            const match = payload?.match ?? payload;
            callbackRef.current?.(match);
          } catch (e) {
            console.warn("[WS] parse error", e);
          }
        });
      },

      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers?.message);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [tournamentId]);

  useEffect(() => {
    connect();
    return () => {
      subscribeRef.current?.unsubscribe();
      clientRef.current?.deactivate();
    };
  }, [connect]);
}
