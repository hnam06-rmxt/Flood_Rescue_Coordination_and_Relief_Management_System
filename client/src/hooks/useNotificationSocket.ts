import { useEffect } from "react";
import { connectNotificationSocket } from "../services/notificationSocket";
import { useUserStore } from "./useUserStore";

type Options = {
  onNotification?: () => void;
  onUnreadCount?: () => void;
  /** Poll dự phòng khi WebSocket lỗi (ms). 0 = tắt */
  fallbackPollMs?: number;
};

export function useNotificationSocket(options: Options = {}) {
  const profile = useUserStore((s) => s.profile);
  const userId = profile?.id;
  const { onNotification, onUnreadCount, fallbackPollMs = 30000 } = options;

  useEffect(() => {
    if (!userId) return;

    const disconnect = connectNotificationSocket(userId, {
      onNotification: () => {
        onNotification?.();
        onUnreadCount?.();
      },
      onUnreadCount: () => onUnreadCount?.(),
    });

    let pollId: ReturnType<typeof setInterval> | undefined;
    if (fallbackPollMs > 0) {
      pollId = setInterval(() => onUnreadCount?.(), fallbackPollMs);
    }

    return () => {
      disconnect();
      if (pollId) clearInterval(pollId);
    };
  }, [userId, onNotification, onUnreadCount, fallbackPollMs]);
}
