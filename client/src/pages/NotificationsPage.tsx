import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { notifApi } from "../services/apiService";
import { useNotificationSocket } from "../hooks/useNotificationSocket";
import type { Notification } from "../types/rescue";

export function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const load = useCallback(async () => {
    try { setNotifs(await notifApi.getAll() || []); } catch { setNotifs([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useNotificationSocket({ onNotification: load, fallbackPollMs: 0 });

  async function markAllRead() {
    try { await notifApi.markAllRead(); load(); } catch {}
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-semibold text-ink">Thông báo</h1>
          <p className="text-sm text-slate">Các thông báo từ hệ thống</p></div>
        <button onClick={markAllRead} className="btn-secondary"><CheckCheck size={14} /> Đọc tất cả</button>
      </div>

      <div className="space-y-2">
        {notifs.length === 0 ? <div className="card p-8 text-center text-slate">Không có thông báo</div> :
          notifs.map(n => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 transition-all ${!n.isRead ? "bg-tint-lavender/30 border-primary/20" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? "bg-primary/10" : "bg-surface"}`}>
                <Bell size={14} className={!n.isRead ? "text-primary" : "text-slate"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${!n.isRead ? "font-semibold text-ink" : "text-slate"}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-xs text-slate mt-0.5">{n.message}</p>
                <p className="text-xs text-muted mt-1">{new Date(n.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              {!n.isRead && (
                <button onClick={async () => { await notifApi.markRead(n.id); load(); }}
                  className="shrink-0 p-1.5 rounded hover:bg-surface transition-colors" title="Đánh dấu đã đọc">
                  <Check size={14} className="text-slate" />
                </button>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
