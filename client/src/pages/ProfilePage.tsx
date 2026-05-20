import { useUserStore } from "../hooks/useUserStore";
import { User, Mail, Phone, MapPin, Shield, Clock } from "lucide-react";

const roleBadge: Record<string, string> = { ADMIN: "badge-purple", COORDINATOR: "badge-blue", MANAGER: "badge-orange", RESCUER: "badge-green", CITIZEN: "badge-soft-purple" };

export function ProfilePage() {
  const profile = useUserStore(s => s.profile);
  if (!profile) return <div className="p-8 text-center text-slate">Đang tải...</div>;

  const fields = [
    { icon: <User size={16} />, label: "Họ và tên", value: profile.fullName },
    { icon: <User size={16} />, label: "Username", value: `@${profile.username}` },
    { icon: <Mail size={16} />, label: "Email", value: profile.email || "Chưa cập nhật" },
    { icon: <Phone size={16} />, label: "Số điện thoại", value: profile.phone || "Chưa cập nhật" },
    { icon: <MapPin size={16} />, label: "Địa chỉ", value: profile.address || "Chưa cập nhật" },
    { icon: <Shield size={16} />, label: "Vai trò", value: profile.role },
    { icon: <Clock size={16} />, label: "Lần đăng nhập gần nhất", value: profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString("vi-VN") : "N/A" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-ink">{profile.fullName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={roleBadge[profile.role || ""] || "badge-soft-purple"}>{profile.role}</span>
              <span className={profile.status === "ACTIVE" ? "badge-green" : "badge-red"}>{profile.status}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(f => (
            <div key={f.label} className="flex items-start gap-3 p-3 rounded-lg bg-surface">
              <div className="mt-0.5 text-slate">{f.icon}</div>
              <div>
                <p className="text-xs text-slate">{f.label}</p>
                <p className="text-sm font-medium text-ink mt-0.5">{f.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
