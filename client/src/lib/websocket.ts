import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const WS_URL = (import.meta.env.VITE_WS_URL as string) || "http://localhost:8080/ws";

type MessageCallback = (body: Record<string, unknown>) => void;

class WebSocketService {
  private client: Client | null = null;
  private connected = false;
  private subscriptions: Map<string, { id: string; callback: MessageCallback }[]> = new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

  connect(onConnected?: () => void): void {
    if (this.client && this.connected) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL) as WebSocket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      onConnect: () => {
        this.connected = true;
        // Re-subscribe tất cả topics sau khi reconnect
        this.subscriptions.forEach((callbacks, topic) => {
          callbacks.forEach(({ callback }) => this._subscribe(topic, callback));
        });
        onConnected?.();
      },

      onDisconnect: () => {
        this.connected = false;
      },

      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers["message"]);
      },
    });

    this.client.activate();
  }

  private _subscribe(topic: string, callback: MessageCallback): string {
    if (!this.client || !this.connected) return "";
    const sub = this.client.subscribe(topic, (message) => {
      try {
        const body = JSON.parse(message.body) as Record<string, unknown>;
        callback(body);
      } catch {
        // ignore parse errors
      }
    });
    return sub.id;
  }

  subscribe(topic: string, callback: MessageCallback): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    let subId = "";
    if (this.connected) {
      subId = this._subscribe(topic, callback);
    }
    const entry = { id: subId, callback };
    this.subscriptions.get(topic)!.push(entry);

    // Return unsubscribe function
    return () => {
      const list = this.subscriptions.get(topic) ?? [];
      const idx = list.indexOf(entry);
      if (idx !== -1) list.splice(idx, 1);
      if (subId && this.client && this.connected) {
        try { this.client.unsubscribe(subId); } catch { /* ignore */ }
      }
    };
  }

  subscribePersonal(userId: number | string, callback: MessageCallback): () => void {
    return this.subscribe(`/user/${userId}/queue/notifications`, callback);
  }

  disconnect(): void {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.subscriptions.clear();
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Singleton
export const wsService = new WebSocketService();
