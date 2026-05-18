import { useEffect, useState } from "react";
import { Plus, AlertTriangle, Clock, Edit2, Trash2 } from "lucide-react";
import { alertApi } from "../services/apiService";
import type { FloodAlert } from "../types/rescue";
import { useUserStore } from "../hooks/useUserStore";

const severityBadge: Record<string, string> = { 
  EMERGENCY: "badge-red", 
  WARNING: "badge-orange", 
  WATCH: "badge-blue", 
  ADVISORY: "badge-soft-purple" 
};

const severityBg: Record<string, string> = { 
  EMERGENCY: "border-l-semantic-error", 
  WARNING: "border-l-brand-orange-deep", 
  WATCH: "border-l-link", 
  ADVISORY: "border-l-brand-purple" 
};

const severityLabel: Record<string, string> = {
  EMERGENCY: "KHẨN CẤP (EMERGENCY)",
  WARNING: "CẢNH BÁO (WARNING)",
  WATCH: "THEO DÕI (WATCH)",
  ADVISORY: "TƯ VẤN (ADVISORY)"
};

export function AlertsPage() {
  const profile = useUserStore(s => s.profile);
  const userRole = profile?.role || "";
  const isAuthorized = userRole === "ADMIN" || userRole === "COORDINATOR" || userRole === "MANAGER";

  const [alerts, setAlerts] = useState<FloodAlert[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<FloodAlert | null>(null);
  
  const [form, setForm] = useState({ title: "", description: "", severity: "WARNING", locationArea: "" });
  const [editForm, setEditForm] = useState({ title: "", description: "", severity: "WARNING", locationArea: "" });

  useEffect(() => { load(); }, []);
  async function load() { 
    try { setAlerts(await alertApi.getAll() || []); } catch { setAlerts([]); } 
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { 
      await alertApi.create(form); 
      setShowForm(false); 
      setForm({ title: "", description: "", severity: "WARNING", locationArea: "" });
      alert("Phát cảnh báo thành công!");
      load(); 
    } catch (err: any) {
      alert("Lỗi phát cảnh báo: " + (err.response?.data?.message || err.message));
    }
  }

  function startEdit(a: FloodAlert) {
    setEditingAlert(a);
    setEditForm({
      title: a.title,
      description: a.description || "",
      severity: a.severity,
      locationArea: a.locationArea
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAlert) return;
    try {
      await alertApi.update(editingAlert.id, editForm);
      setEditingAlert(null);
      load();
      alert("Cập nhật cảnh báo thành công!");
    } catch (err: any) {
      alert("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa tin cảnh báo lũ lụt này không?")) return;
    try {
      await alertApi.delete(id);
      load();
      alert("Xóa cảnh báo thành công!");
    } catch (err: any) {
      alert("Xóa thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Cảnh báo lũ lụt</h1>
          <p className="text-sm text-slate">Phát hành và quản lý tin cảnh báo thiên tai khẩn cấp</p>
        </div>
        {isAuthorized && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> {showForm ? "Đóng form" : "Tạo cảnh báo"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-sm font-semibold text-ink mb-4">📢 Phát Hành Cảnh Báo Thiên Tai Mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Tiêu đề bản tin</label>
              <input className="input-field" placeholder="Lũ quét tràn qua sông Hương..." value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Mô tả chi tiết / Chỉ thị ứng phó</label>
              <textarea className="input-field h-24" placeholder="Người dân vùng trũng khẩn trương di chuyển lên cao..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mức độ nghiêm trọng</label>
              <select className="input-field" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="ADVISORY">Tư vấn (ADVISORY)</option>
                <option value="WATCH">Theo dõi (WATCH)</option>
                <option value="WARNING">Cảnh báo (WARNING)</option>
                <option value="EMERGENCY">Khẩn cấp (EMERGENCY)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Khu vực cảnh báo (Địa bàn)</label>
              <input className="input-field" placeholder="Huyện Quảng Điền, Huyện Phú Vang..." value={form.locationArea} onChange={e => setForm({ ...form, locationArea: e.target.value })} required />
            </div>
            <div className="md:col-span-2 flex gap-2 pt-2">
              <button type="submit" className="btn-primary !bg-error hover:!bg-error/90 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Phát cảnh báo khẩn
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Alert Modal Popup */}
      {editingAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full p-6 animate-scale-up space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h3 className="text-md font-semibold text-ink flex items-center gap-1.5">
                <Edit2 size={16} className="text-brand-purple" /> Chỉnh sửa tin cảnh báo lũ lụt
              </h3>
              <button onClick={() => setEditingAlert(null)} className="text-slate hover:text-ink text-sm">Đóng</button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Tiêu đề bản tin</label>
                <input className="input-field" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Mô tả chi tiết / Chỉ thị ứng phó</label>
                <textarea className="input-field h-28" value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mức độ nghiêm trọng</label>
                <select className="input-field" value={editForm.severity} onChange={e => setEditForm({ ...editForm, severity: e.target.value })} required>
                  <option value="ADVISORY">Tư vấn (ADVISORY)</option>
                  <option value="WATCH">Theo dõi (WATCH)</option>
                  <option value="WARNING">Cảnh báo (WARNING)</option>
                  <option value="EMERGENCY">Khẩn cấp (EMERGENCY)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Khu vực địa bàn</label>
                <input className="input-field" value={editForm.locationArea} onChange={e => setEditForm({ ...editForm, locationArea: e.target.value })} required />
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-hairline">
                <button type="button" onClick={() => setEditingAlert(null)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="card p-8 text-center text-slate">Hiện tại không có tin cảnh báo lũ lụt nào hoạt động</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`card p-5 border-l-4 ${severityBg[alert.severity] || "border-l-slate"} hover:shadow-card transition-all flex flex-col justify-between`}>
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={alert.severity === "EMERGENCY" ? "text-semantic-error animate-pulse" : "text-brand-orange-deep"} />
                    <span className={severityBadge[alert.severity] || "badge-soft-purple"}>
                      {severityLabel[alert.severity] || alert.severity}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-slate font-mono">
                      <Clock size={12} />
                      {new Date(alert.createdAt).toLocaleString("vi-VN")}
                    </div>
                    {isAuthorized && (
                      <div className="flex items-center gap-1.5 border-l border-hairline pl-3">
                        <button onClick={() => startEdit(alert)} className="p-1 hover:bg-surface rounded text-slate hover:text-brand-purple transition-colors" title="Chỉnh sửa">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(alert.id)} className="p-1 hover:bg-surface rounded text-slate hover:text-semantic-error transition-colors" title="Xóa">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-ink mb-1">{alert.title}</h3>
                <p className="text-sm text-slate whitespace-pre-line">{alert.description}</p>
                <p className="text-xs text-slate mt-2 font-medium">📍 Phạm vi ảnh hưởng: <span className="text-ink">{alert.locationArea}</span></p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
