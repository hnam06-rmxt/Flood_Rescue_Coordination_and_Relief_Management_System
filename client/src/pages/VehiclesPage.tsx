import { useEffect, useState } from "react";
import { Plus, Truck, UserCheck, Edit, Trash2, ClipboardList } from "lucide-react";
import { vehicleApi, teamApi } from "../services/apiService";
import type { RescueVehicle, RescueTeam, VehicleUsageLog } from "../types/rescue";

const statusBadge: Record<string, string> = { 
  AVAILABLE: "badge-green", 
  IN_USE: "badge-purple", 
  MAINTENANCE: "badge-orange", 
  DECOMMISSIONED: "badge-red" 
};

export function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<"vehicles" | "logs">("vehicles");
  const [vehicles, setVehicles] = useState<RescueVehicle[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [usageLogs, setUsageLogs] = useState<VehicleUsageLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "BOAT", licensePlate: "", capacity: 10, currentLocation: "", status: "AVAILABLE" });

  const [editingVehicle, setEditingVehicle] = useState<RescueVehicle | null>(null);
  const [editForm, setEditForm] = useState({ name: "", type: "BOAT", licensePlate: "", capacity: 10, currentLocation: "", status: "AVAILABLE" });

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (activeTab === "logs") loadLogs();
  }, [activeTab]);

  async function load() { 
    try { 
      const [vData, tData] = await Promise.all([vehicleApi.getAll(), teamApi.getAll()]);
      setVehicles(vData || []); 
      setTeams(tData || []);
    } catch { 
      setVehicles([]); 
    } 
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { 
      await vehicleApi.create(form); 
      setShowForm(false); 
      setForm({ name: "", type: "BOAT", licensePlate: "", capacity: 10, currentLocation: "", status: "AVAILABLE" });
      load(); 
    } catch {}
  }

  async function handleAssignTeam(vehicleId: number, teamId: number) {
    try {
      await vehicleApi.assignTeam(vehicleId, teamId);
      load();
    } catch (err) {
      alert("Gán đội thất bại");
    }
  }

  function handleEditClick(v: RescueVehicle) {
    setEditingVehicle(v);
    setEditForm({
      name: v.name,
      type: v.type,
      licensePlate: v.licensePlate || "",
      capacity: v.capacity || 10,
      currentLocation: v.currentLocation || "",
      status: v.status
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingVehicle) return;
    try {
      await vehicleApi.update(editingVehicle.vehicleId, editForm);
      setEditingVehicle(null);
      load();
    } catch (err) {
      alert("Cập nhật phương tiện thất bại");
    }
  }

  async function handleDelete(vehicleId: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa phương tiện này không?")) return;
    try {
      await vehicleApi.delete(vehicleId);
      load();
    } catch (err) {
      alert("Xóa phương tiện thất bại");
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const logs = await vehicleApi.getAllLogs();
      setUsageLogs(logs || []);
    } catch {
      setUsageLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Phương tiện cứu hộ</h1>
          <p className="text-sm text-slate">Quản lý và điều phối phương tiện cho các đội</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex rounded-lg border border-hairline overflow-hidden text-xs font-medium">
            <button onClick={() => setActiveTab("vehicles")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                activeTab === "vehicles" ? "bg-primary text-white" : "text-slate hover:bg-surface"
              }`}>
              <Truck size={13} /> Phương tiện
            </button>
            <button onClick={() => setActiveTab("logs")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                activeTab === "logs" ? "bg-primary text-white" : "text-slate hover:bg-surface"
              }`}>
              <ClipboardList size={13} /> Nhật ký sử dụng
            </button>
          </div>
          {activeTab === "vehicles" && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs">
              <Plus size={14} /> Thêm phương tiện
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tên phương tiện</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Loại</label>
              <select className="input-field" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                <option value="BOAT">Thuyền</option>
                <option value="TRUCK">Xe tải</option>
                <option value="HELICOPTER">Trực thăng</option>
                <option value="AMBULANCE">Xe cứu thương</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Biển số / Mã số</label>
              <input className="input-field" value={form.licensePlate} onChange={e => setForm({ ...form, licensePlate: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sức chứa (người)</label>
              <input type="number" className="input-field" value={form.capacity} onChange={e => setForm({ ...form, capacity: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-3 flex gap-2">
              <button type="submit" className="btn-primary">Tạo phương tiện</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-6 animate-fade-in bg-white dark:bg-zinc-900 border border-hairline shadow-lg">
            <h3 className="text-lg font-semibold text-ink mb-4">Cập nhật phương tiện</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên phương tiện</label>
                <input className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại</label>
                <select className="input-field" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  <option value="BOAT">Thuyền</option>
                  <option value="TRUCK">Xe tải</option>
                  <option value="HELICOPTER">Trực thăng</option>
                  <option value="AMBULANCE">Xe cứu thương</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Biển số / Mã số</label>
                <input className="input-field" value={editForm.licensePlate} onChange={e => setEditForm({ ...editForm, licensePlate: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sức chứa (người)</label>
                <input type="number" className="input-field" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: Number(e.target.value) })} />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary flex-1">Lưu thay đổi</button>
                <button type="button" onClick={() => setEditingVehicle(null)} className="btn-secondary flex-1">Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
                <th className="px-4 py-3">Phương tiện</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Đội đang sử dụng</th>
                <th className="px-4 py-3">Sức chứa</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Gán đội</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate">Không có dữ liệu</td>
                </tr>
              ) : (
                vehicles.map(v => (
                  <tr key={v.vehicleId} className="hover:bg-surface-soft transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <Truck size={14} className="text-brand-teal" />
                      <div>
                        <p>{v.name}</p>
                        <p className="text-[10px] text-slate font-normal">{v.licensePlate}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{v.type}</td>
                    <td className="px-4 py-3">
                      {v.assignedTeamName ? (
                        <span className="flex items-center gap-1 text-primary font-medium">
                          <UserCheck size={12} /> {v.assignedTeamName}
                        </span>
                      ) : (
                        <span className="text-slate italic">Chưa gán đội</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{v.capacity} người</td>
                    <td className="px-4 py-3">
                      <select 
                        className={`text-xs border border-hairline rounded px-1 py-0.5 outline-none focus:border-primary font-semibold ${statusBadge[v.status] || "badge-soft-purple"}`}
                        value={v.status}
                        onChange={async (e) => {
                          try {
                             await vehicleApi.updateStatus(v.vehicleId, e.target.value);
                             load();
                          } catch { 
                            alert("Cập nhật trạng thái thất bại"); 
                          }
                        }}
                      >
                        <option value="AVAILABLE" className="text-ink bg-white">Sẵn sàng</option>
                        <option value="IN_USE" className="text-ink bg-white">Đang hoạt động</option>
                        <option value="MAINTENANCE" className="text-ink bg-white">Đang bảo trì</option>
                        <option value="DECOMMISSIONED" className="text-ink bg-white">Hỏng/Ngừng HĐ</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select 
                        className="text-xs border border-hairline rounded px-1 py-0.5 bg-white outline-none focus:border-primary w-full"
                        value={v.assignedTeamId || ""}
                        onChange={(e) => handleAssignTeam(v.vehicleId, Number(e.target.value))}
                      >
                        <option value="">-- Chọn đội --</option>
                        {teams.map(t => (
                          <option key={t.teamId} value={t.teamId}>{t.teamName}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleEditClick(v)} 
                          className="btn-secondary !p-1.5 border-primary text-primary hover:bg-tint-lavender" 
                          title="Sửa thông tin"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(v.vehicleId)} 
                          className="btn-secondary !p-1.5 border-error text-error hover:bg-tint-rose" 
                          title="Xóa phương tiện"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Usage Logs Tab */}
      {activeTab === "logs" && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
              <ClipboardList size={16} className="text-primary" /> Nhật ký sử dụng phương tiện
            </h3>
            <button onClick={loadLogs} className="btn-secondary text-xs !py-1 !px-2">Làm mới</button>
          </div>
          {logsLoading ? (
            <div className="p-8 text-center text-slate">Đang tải nhật ký...</div>
          ) : usageLogs.length === 0 ? (
            <div className="p-8 text-center text-slate">Chưa có nhật ký nào</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface-soft">
                    <th className="px-4 py-3 text-left font-medium text-slate text-xs">Thời gian</th>
                    <th className="px-4 py-3 text-left font-medium text-slate text-xs">Phương tiện</th>
                    <th className="px-4 py-3 text-left font-medium text-slate text-xs">Hành động</th>
                    <th className="px-4 py-3 text-left font-medium text-slate text-xs">Đội</th>
                    <th className="px-4 py-3 text-left font-medium text-slate text-xs">Trạng thái cũ → Mới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-soft">
                  {usageLogs.map(log => (
                    <tr key={log.id} className="hover:bg-surface-soft transition-colors">
                      <td className="px-4 py-3 text-xs text-slate">
                        {log.loggedAt ? new Date(log.loggedAt).toLocaleString("vi-VN") : "---"}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.vehicleName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          log.action === "ASSIGNED" ? "bg-blue-50 text-blue-700" :
                          log.action === "RETURNED" ? "bg-green-50 text-green-700" :
                          log.action === "MAINTENANCE" ? "bg-orange-50 text-orange-700" :
                          "bg-slate-50 text-slate-700"
                        }`}>{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">{log.teamName || "---"}</td>
                      <td className="px-4 py-3 text-xs text-slate">
                        {log.oldStatus && log.newStatus ? `${log.oldStatus} → ${log.newStatus}` : log.newStatus || "---"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
