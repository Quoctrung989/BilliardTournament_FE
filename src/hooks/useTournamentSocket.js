import { useCallback, useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import {
  getWebSocketUrl,
  tournamentBracketTopic,
  tournamentMatchesTopic,
} from "../constants/websocket";

/**
 * Hook STOMP dùng chung — subscribe /matches + /bracket, tự reconnect.
 *
 * @param {number|string|null} tournamentId
 * @param {{
 *   onMatchUpdate?: (match: object) => void,
 *   onBracketSync?: (matches: object[]) => void,
 *   onReconnect?: () => void,
 *   enabled?: boolean,
 * }} [options]
 * @returns {{
 *   connectionState: import('../constants/websocket').SocketConnectionState,
 *   isConnected: boolean,
 * }}
 */
export function useTournamentSocket(tournamentId, options = {}) {
  const {
    onMatchUpdate,
    onBracketSync,
    onReconnect,
    enabled = true,
  } = options;

  const [connectionState, setConnectionState] = useState("disconnected");

  const clientRef = useRef(null);
  const subsRef = useRef([]);
  const wasConnectedRef = useRef(false);
  const onMatchUpdateRef = useRef(onMatchUpdate);
  const onBracketSyncRef = useRef(onBracketSync);
  const onReconnectRef = useRef(onReconnect);

  useEffect(() => { onMatchUpdateRef.current = onMatchUpdate; }, [onMatchUpdate]);
  useEffect(() => { onBracketSyncRef.current = onBracketSync; }, [onBracketSync]);
  useEffect(() => { onReconnectRef.current = onReconnect; }, [onReconnect]);

  const cleanupSubscriptions = useCallback(() => {
    subsRef.current.forEach((sub) => {
      try {
        sub?.unsubscribe();
      } catch {
        /* ignore */
      }
    });
    subsRef.current = [];
  }, []);

  const handleMatchesMessage = useCallback((msg) => {
    try {
      const payload = JSON.parse(msg.body);
      if (payload?.type === "BRACKET_SYNC" && Array.isArray(payload.matches)) {
        onBracketSyncRef.current?.(payload.matches);
        return;
      }
      const match = payload?.match ?? payload;
      if (match?.id != null) {
        onMatchUpdateRef.current?.(match);
      }
    } catch (e) {
      console.warn("[WS] matches parse error", e);
    }
  }, []);

  const handleBracketMessage = useCallback((msg) => {
    try {
      const payload = JSON.parse(msg.body);
      if (payload?.type === "BRACKET_SYNC" && Array.isArray(payload.matches)) {
        onBracketSyncRef.current?.(payload.matches);
        return;
      }
      const match = payload?.match;
      if (match?.id != null) {
        onMatchUpdateRef.current?.(match);
      }
    } catch (e) {
      console.warn("[WS] bracket parse error", e);
    }
  }, []);

  useEffect(() => {
    if (!enabled || tournamentId == null || tournamentId === "") {
      setConnectionState("disconnected");
      return undefined;
    }

    wasConnectedRef.current = false;
    setConnectionState("connecting");

    const client = new Client({
      brokerURL: getWebSocketUrl(),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        const isReconnect = wasConnectedRef.current;
        wasConnectedRef.current = true;
        setConnectionState("connected");

        cleanupSubscriptions();
        subsRef.current = [
          client.subscribe(tournamentMatchesTopic(tournamentId), handleMatchesMessage),
          client.subscribe(tournamentBracketTopic(tournamentId), handleBracketMessage),
        ];

        if (isReconnect) {
          onReconnectRef.current?.();
        }
      },

      onWebSocketClose: () => {
        if (wasConnectedRef.current) {
          setConnectionState("reconnecting");
        }
      },

      onDisconnect: () => {
        cleanupSubscriptions();
        if (!client.active) {
          setConnectionState("disconnected");
        }
      },

      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers?.message);
        setConnectionState("reconnecting");
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      cleanupSubscriptions();
      wasConnectedRef.current = false;
      client.deactivate();
      clientRef.current = null;
      setConnectionState("disconnected");
    };
  }, [
    tournamentId,
    enabled,
    cleanupSubscriptions,
    handleMatchesMessage,
    handleBracketMessage,
  ]);

  return {
    connectionState,
    isConnected: connectionState === "connected",
  };
}
