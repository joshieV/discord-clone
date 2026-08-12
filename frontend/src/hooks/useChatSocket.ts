import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { getToken } from "../api/client";
import type { ChatMessage } from "../api/messages";

const WS_URL = "http://localhost:8080/ws";

export function useChatSocket(roomName: string, onMessage: (msg: ChatMessage) => void) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      brokerURL: undefined,
      webSocketFactory: () => new WebSocket(WS_URL.replace("http", "ws")),
      connectHeaders: {
        Authorization: `Bearer ${getToken() ?? ""}`,
      },
      reconnectDelay: 3000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/rooms/${roomName}`, (frame) => {
          onMessage(JSON.parse(frame.body) as ChatMessage);
        });
      },
      onStompError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  function sendMessage(content: string) {
    clientRef.current?.publish({
      destination: `/app/rooms/${roomName}/send`,
      body: JSON.stringify({ content }),
    });
  }

  return { connected, sendMessage };
}
