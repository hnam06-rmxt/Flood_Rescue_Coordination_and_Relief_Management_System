import { Client, type IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getStoredAccessToken } from "./sessionStorage";
import type { Notification } from "../types/rescue";

const wsBase =
  import.meta.env.VITE_WS_BASE_URL?.trim() ||
  (typeof window !== "undefined" ? `${window.location.origin}/ws` : "http://localhost:8080/ws");

export type NotificationSocketHandlers = {
  onNotification?: (notification: Notification) => void;
  onUnreadCount?: () => void;
};

export function connectNotificationSocket(
  userId: number,
  handlers: NotificationSocketHandlers
): () => void {
  const token = getStoredAccessToken();
  if (!token || !userId) {
    return () => {};
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(wsBase),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      client.subscribe(`/topic/notifications/${userId}`, (message: IMessage) => {
        try {
          const payload = JSON.parse(message.body) as Notification;
          handlers.onNotification?.(payload);
          handlers.onUnreadCount?.();
        } catch {
          handlers.onUnreadCount?.();
        }
      });
    },
  });

  client.activate();

  return () => {
    void client.deactivate();
  };
}
