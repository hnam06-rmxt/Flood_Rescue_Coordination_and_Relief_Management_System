import { useEffect, useState } from "react";
import { Plus, Users, Phone, MapPin, User as UserIcon, Edit, Trash2 } from "lucide-react";
import { teamApi, adminApi } from "../services/apiService";
import type { RescueTeam } from "../types/rescue";
import type { UserProfile } from "../types/user";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function LocationPicker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });
  return <Marker position={position} />;
}

const statusBadge: Record<string, string> = { 
  ACTIVE: "badge-green", 
  INACTIVE: "badge-red", 
  ON_DUTY: "badge-purple" 
};

export function TeamsPage() {
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    teamName: "",
    memberCount: 5,
    contactPhone: "",
    status: "ACTIVE",
    currentLocation: "",
    latitude: 16.047079,
    longitude: 108.206230,
    description: "",
    teamLeaderId: ""
  });

  const [editingTeam, setEditingTeam] = useState<RescueTeam | null>(null);
  const [editForm, setEditForm] = useState({
    teamName: "",
    memberCount: 5,
    contactPhone: "",
    status: "ACTIVE",
    currentLocation: "",
    latitude: 16.047079,
    longitude: 108.206230,
    description: "",
    teamLeaderId: ""
  });

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [teamsData, usersData] = await Promise.all([
        teamApi.getAll(),
        adminApi.getAllUsers().catch(() => []) // Fallback if not admin
      ]);
      setTeams(teamsData || []);
      setUsers(usersData || []);
    } catch (err) {
      console.error("Load teams/users failed:", err);
      setTeams([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.teamLeaderId) {
      alert("Vui lòng chọn đội trưởng");
      return;
    }
    try {
      await teamApi.create({
        ...form,
        teamLeaderId: parseInt(form.teamLeaderId)
      });
      setShowForm(false);
      load();
      setForm({ teamName: "", memberCount: 5, contactPhone: "", status: "ACTIVE", currentLocation: "", latitude: 16.047079, longitude: 108.206230, description: "", teamLeaderId: "" });
    } catch (err) {
      console.error("Create team failed:", err);
      alert("Tạo đội thất bại. Vui lòng kiểm tra lại thông tin.");
    }
  }

  function handleEditClick(t: RescueTeam) {
    setEditingTeam(t);
    setEditForm({
      teamName: t.teamName,
      memberCount: t.memberCount,
      contactPhone: t.contactPhone,
      status: t.status,
      currentLocation: t.currentLocation,
      latitude: t.latitude || 16.047079,
      longitude: t.longitude || 108.206230,
      description: t.description || "",
      teamLeaderId: t.teamLeaderId ? t.teamLeaderId.toString() : ""
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingTeam) return;
    if (!editForm.teamLeaderId) {
      alert("Vui lòng chọn đội trưởng");
      return;
    }
    try {
      await teamApi.update(editingTeam.teamId, {
        ...editForm,
        teamLeaderId: parseInt(editForm.teamLeaderId)
      });
      setEditingTeam(null);
      load();
    } catch (err) {
      console.error("Update team failed:", err);
      alert("Cập nhật đội thất bại. Vui lòng kiểm tra lại.");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa đội cứu hộ này không?")) return;
    try {
      await teamApi.delete(id);
      load();
    } catch (err) {
      console.error("Delete team failed:", err);
      alert("Xóa đội cứu hộ thất bại.");
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Đội cứu hộ</h1>
          <p className="text-sm text-slate">Quản lý các đội cứu hộ trong hệ thống</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={16} /> Thêm đội</button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-ink mb-4">Thêm đội cứu hộ mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên đội</label>
              <input className="input-field" value={form.teamName} onChange={e => setForm({ ...form, teamName: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Đội trưởng</label>
              <select className="input-field" value={form.teamLeaderId} onChange={e => setForm({ ...form, teamLeaderId: e.target.value })} required>
                <option value="">{users.filter(u => u.role !== "CITIZEN").length === 0 ? "-- Không có nhân sự nào hợp lệ --" : "-- Chọn đội trưởng --"}</option>
                {users.filter(u => u.role !== "CITIZEN").map(u => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                ))}
              </select>
              {users.length === 0 && (
                <p className="text-[10px] text-semantic-error mt-1">
                  * Bạn cần đăng nhập tài khoản ADMIN (admin/admin123) để xem danh sách và tạo đội.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Số thành viên</label>
              <input type="number" className="input-field" value={form.memberCount} onChange={e => setForm({ ...form, memberCount: +e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">SĐT liên hệ</label>
              <input className="input-field" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Vị trí hiện tại</label>
              <input className="input-field mb-2" value={form.currentLocation} onChange={e => setForm({ ...form, currentLocation: e.target.value })} required placeholder="Nhập tên địa chỉ..." />
              <div className="h-48 rounded-lg overflow-hidden border border-hairline relative z-0">
                <MapContainer center={[form.latitude, form.longitude]} zoom={12} className="w-full h-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    position={[form.latitude, form.longitude]} 
                    setPosition={(pos) => setForm({ ...form, latitude: pos[0], longitude: pos[1] })} 
                  />
                </MapContainer>
                <div className="absolute inset-x-0 bottom-0 p-1.5 bg-white/80 backdrop-blur-sm text-[10px] text-center text-slate border-t border-hairline z-[1000] pointer-events-none">
                  Click lên bản đồ để chọn tọa độ GPS cho đội cứu hộ
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả</label>
              <textarea className="input-field" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="md:col-span-2 flex gap-2 mt-2">
              <button type="submit" className="btn-primary">Tạo đội</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.length === 0 ? (
          <div className="md:col-span-3 card p-8 text-center text-slate">Chưa có đội cứu hộ nào</div>
        ) : teams.map(team => (
          <div key={team.teamId} className="card p-5 hover:shadow-mockup transition-all duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-tint-sky flex items-center justify-center">
                  <Users size={18} className="text-link" />
                </div>
                <select 
                  className={`text-xs border border-hairline rounded px-1 py-0.5 outline-none focus:border-primary font-semibold ${statusBadge[team.status] || "badge-soft-purple"}`}
                  value={team.status}
                  onChange={async (e) => {
                    try {
                      await teamApi.updateStatus(team.teamId, e.target.value);
                      load();
                    } catch {
                      alert("Cập nhật trạng thái thất bại");
                    }
                  }}
                >
                  <option value="ACTIVE" className="text-ink bg-white">Hoạt động</option>
                  <option value="INACTIVE" className="text-ink bg-white">Không HĐ</option>
                  <option value="ON_DUTY" className="text-ink bg-white">Làm nhiệm vụ</option>
                </select>
              </div>
              <h3 className="text-sm font-semibold text-ink mb-2">{team.teamName}</h3>
              <div className="space-y-1.5 text-xs text-slate">
                <p className="flex items-center gap-2"><UserIcon size={12} className="text-primary" /> Đội trưởng: <span className="font-medium text-ink">{team.teamLeaderName || "---"}</span></p>
                <p className="flex items-center gap-2"><Users size={12} /> {team.memberCount} thành viên</p>
                <p className="flex items-center gap-2"><Phone size={12} /> {team.contactPhone || "---"}</p>
                <p className="flex items-center gap-2"><MapPin size={12} /> {team.currentLocation || "---"}</p>
                {team.description && <p className="text-[11px] italic mt-1 text-slate border-l-2 border-hairline pl-2">{team.description}</p>}
              </div>
            </div>
            
            <div className="border-t border-hairline pt-3 mt-4 flex justify-end gap-2">
              <button 
                onClick={() => handleEditClick(team)} 
                className="btn-secondary !py-1 !px-2 text-xs border-primary text-primary hover:bg-tint-lavender flex items-center gap-1"
                title="Chỉnh sửa đội"
              >
                <Edit size={12} /> Sửa
              </button>
              <button 
                onClick={() => handleDelete(team.teamId)} 
                className="btn-secondary !py-1 !px-2 text-xs border-error text-error hover:bg-tint-rose flex items-center gap-1"
                title="Xóa đội"
              >
                <Trash2 size={12} /> Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-lg p-6 animate-fade-in bg-white dark:bg-zinc-900 border border-hairline shadow-xl animate-slide-up">
            <h3 className="text-sm font-semibold text-ink mb-4">Chỉnh sửa đội cứu hộ</h3>
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên đội</label>
                <input className="input-field" value={editForm.teamName} onChange={e => setEditForm({ ...editForm, teamName: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Đội trưởng</label>
                <select className="input-field" value={editForm.teamLeaderId} onChange={e => setEditForm({ ...editForm, teamLeaderId: e.target.value })} required>
                  <option value="">{users.filter(u => u.role !== "CITIZEN").length === 0 ? "-- Không có nhân sự nào hợp lệ --" : "-- Chọn đội trưởng --"}</option>
                  {users.filter(u => u.role !== "CITIZEN").map(u => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số thành viên</label>
                <input type="number" className="input-field" value={editForm.memberCount} onChange={e => setEditForm({ ...editForm, memberCount: +e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SĐT liên hệ</label>
                <input className="input-field" value={editForm.contactPhone} onChange={e => setEditForm({ ...editForm, contactPhone: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Vị trí hiện tại</label>
                <input className="input-field mb-2" value={editForm.currentLocation} onChange={e => setEditForm({ ...editForm, currentLocation: e.target.value })} required placeholder="Nhập tên địa chỉ..." />
                <div className="h-48 rounded-lg overflow-hidden border border-hairline relative z-0">
                  <MapContainer center={[editForm.latitude, editForm.longitude]} zoom={12} className="w-full h-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker 
                      position={[editForm.latitude, editForm.longitude]} 
                      setPosition={(pos) => setEditForm({ ...editForm, latitude: pos[0], longitude: pos[1] })} 
                    />
                  </MapContainer>
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-white/80 backdrop-blur-sm text-[10px] text-center text-slate border-t border-hairline z-[1000] pointer-events-none">
                    Click lên bản đồ để cập nhật tọa độ GPS
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea className="input-field" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value || "" })} rows={2} />
              </div>
              <div className="md:col-span-2 flex justify-end gap-2 mt-2 border-t border-hairline pt-3">
                <button type="submit" className="btn-primary">Lưu thay đổi</button>
                <button type="button" onClick={() => setEditingTeam(null)} className="btn-secondary">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
