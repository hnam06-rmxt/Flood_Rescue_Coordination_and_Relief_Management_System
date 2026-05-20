import { useEffect, useState } from "react";
import { User, Zap } from "lucide-react";
import { adminApi } from "../services/apiService";
import { useUserStore } from "../hooks/useUserStore";
import type { UserProfile } from "../types/user";

const roleColors: Record<string, string> = {
  ADMIN: "bg-red-100 text-red-700 border-red-200",
  COORDINATOR: "bg-orange-100 text-orange-700 border-orange-200",
  MANAGER: "bg-blue-100 text-blue-700 border-blue-200",
  RESCUER: "bg-green-100 text-green-700 border-green-200",
  CITIZEN: "bg-slate-100 text-slate-700 border-slate-200",
};

export function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const myProfile = useUserStore(s => s.profile);
  
  useEffect(() => { load(); }, []);
  
  async function load() {
    try { setUsers(await adminApi.getUsers()); } 
    catch { setUsers([]); }
  }

  async function handleRoleChange(id: number, newRole: string) {
    try {
      await adminApi.updateRole(id, newRole);
      load();
    } catch { alert("Lỗi khi phân quyền"); }
  }

  async function handleStatusChange(id: number, newStatus: string) {
    try {
      await adminApi.updateStatus(id, newStatus);
      load();
    } catch { alert("Lỗi khi cập nhật trạng thái"); }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink flex items-center gap-2">Quản lý Cấu hình Người dùng <Zap size={20} className="text-primary" /></h1>
          <p className="text-sm text-slate">Phân quyền động (RBAC) và quản lý tài khoản hệ thống (Keycloak & DB)</p>
        </div>
      </div>

      <div className="card overflow-hidden shadow-mockup border-none">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
              <th className="px-4 py-3">Người dùng</th>
              <th className="px-4 py-3">Liên hệ</th>
              <th className="px-4 py-3">Vai trò (Role)</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-surface-soft transition-colors">
                <td className="px-4 py-3 font-medium flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-ink font-semibold">{u.fullName}</p>
                    <p className="text-xs text-slate">{u.username}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-ink">{u.email}</p>
                  <p className="text-xs text-slate">{u.phone || "-"}</p>
                </td>
                <td className="px-4 py-3">
                  <select 
                    className={`text-xs font-semibold rounded px-2 py-1 outline-none border ${roleColors[u.role || ""] || "bg-white"} ${u.id === myProfile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={u.role ?? ""}
                    disabled={u.id === myProfile?.id}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="ADMIN" className="bg-white text-ink">Quản trị viên (Admin)</option>
                    <option value="COORDINATOR" className="bg-white text-ink">Điều phối viên</option>
                    <option value="MANAGER" className="bg-white text-ink">Quản lý Kho (Manager)</option>
                    <option value="RESCUER" className="bg-white text-ink">Đội cứu hộ (Rescuer)</option>
                    <option value="CITIZEN" className="bg-white text-ink">Người dân (Citizen)</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    className={`text-xs font-medium rounded px-2 py-1 outline-none border ${u.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'} ${u.id === myProfile?.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={u.status ?? ""}
                    disabled={u.id === myProfile?.id}
                    onChange={(e) => handleStatusChange(u.id, e.target.value)}
                  >
                    <option value="ACTIVE" className="bg-white text-ink">Đang hoạt động</option>
                    <option value="LOCKED" className="bg-white text-ink">Đã khóa</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
