import { useEffect, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { adminApi } from "../services/apiService";
import type { UserProfile } from "../types/user";

const roleBadge: Record<string, string> = { ADMIN: "badge-purple", COORDINATOR: "badge-blue", MANAGER: "badge-orange", RESCUER: "badge-green", CITIZEN: "badge-soft-purple" };

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ fullName: "", username: "", password: "", email: "", phone: "", role: "CITIZEN" });

  useEffect(() => { load(); }, []);
  async function load() { try { setUsers(await adminApi.getUsers() || []); } catch { setUsers([]); } }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await adminApi.createUser(form); setShowForm(false); load(); } catch {}
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa người dùng này?")) return;
    try { await adminApi.deleteUser(id); load(); } catch {}
  }

  const filtered = users.filter(u => !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl font-semibold text-ink">Quản lý người dùng</h1>
          <p className="text-sm text-slate">Quản trị tài khoản người dùng hệ thống</p></div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={16} /> Tạo user</button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Họ tên</label>
              <input className="input-field" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Username</label>
              <input className="input-field" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Password</label>
              <input type="password" className="input-field" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label>
              <input className="input-field" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">SĐT</label>
              <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Vai trò</label>
              <select className="input-field" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                {["CITIZEN", "RESCUER", "COORDINATOR", "MANAGER", "ADMIN"].map(r => <option key={r} value={r}>{r}</option>)}
              </select></div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="btn-primary">Tạo</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
        <input className="input-field pl-9" placeholder="Tìm kiếm user..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Email</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline-soft">
            {filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate">Không có dữ liệu</td></tr> :
              filtered.map(u => (
                <tr key={u.id} className="hover:bg-surface-soft transition-colors">
                  <td className="px-4 py-3 font-medium">#{u.id}</td>
                  <td className="px-4 py-3 font-medium">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate">@{u.username}</td>
                  <td className="px-4 py-3 text-xs">{u.email || "-"}</td>
                  <td className="px-4 py-3">
                    <select 
                      className={`text-xs font-semibold rounded px-2 py-1 outline-none border ${roleBadge[u.role || ""] || "badge-soft-purple"}`}
                      value={u.role ?? ""}
                      onChange={async (e) => {
                        try {
                          await adminApi.updateRole(u.id, e.target.value);
                          load();
                        } catch { alert("Lỗi khi cập nhật vai trò"); }
                      }}
                    >
                      {["CITIZEN", "RESCUER", "COORDINATOR", "MANAGER", "ADMIN"].map(r => (
                        <option key={r} value={r} className="bg-white text-ink">{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select 
                      className={`text-xs font-medium rounded px-2 py-1 outline-none border ${u.status === "ACTIVE" ? "badge-green" : "badge-red"}`}
                      value={u.status ?? ""}
                      onChange={async (e) => {
                        try {
                          await adminApi.updateStatus(u.id, e.target.value);
                          load();
                        } catch { alert("Lỗi khi cập nhật trạng thái"); }
                      }}
                    >
                      <option value="ACTIVE" className="bg-white text-ink">ACTIVE</option>
                      <option value="LOCKED" className="bg-white text-ink">LOCKED</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(u.id)} className="p-1.5 rounded hover:bg-semantic-error/10 transition-colors">
                      <Trash2 size={14} className="text-semantic-error" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
