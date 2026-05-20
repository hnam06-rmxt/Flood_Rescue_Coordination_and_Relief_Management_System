import { useEffect, useState } from "react";
import { Plus, Package, AlertTriangle, Archive, History, ArrowRight } from "lucide-react";
import { reliefApi, teamApi, shelterApi, rescueApi } from "../services/apiService";
import type { ReliefItem, ReliefDistribution, RescueTeam, Shelter, RescueRequest } from "../types/rescue";

export function ReliefPage() {
  const [activeTab, setActiveTab] = useState<"STOCK" | "DISTRIBUTIONS">("STOCK");
  const [items, setItems] = useState<ReliefItem[]>([]);
  const [distributions, setDistributions] = useState<ReliefDistribution[]>([]);
  
  // Recipient resources for beautiful dropdowns
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [requests, setRequests] = useState<RescueRequest[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [showDistForm, setShowDistForm] = useState(false);
  
  const [form, setForm] = useState({ name: "", category: "FOOD", unit: "Thùng", quantityInStock: 100, minimumStockLevel: 10, description: "" });
  const [distForm, setDistForm] = useState({ reliefItemId: 0, quantity: 1, recipientType: "RESCUE_TEAM", recipientId: 0, notes: "" });

  useEffect(() => { load(); }, []);
  
  async function load() { 
    try { 
      const [iData, dData, tData, sData, rData] = await Promise.all([
        reliefApi.getItems(),
        reliefApi.getDistributions(),
        teamApi.getAll().catch(() => []),
        shelterApi.getAll().catch(() => []),
        rescueApi.getAll().catch(() => []),
      ]);
      
      setItems(iData || []); 
      setDistributions(dData || []);
      setTeams(tData || []);
      setShelters(sData || []);
      setRequests(rData || []);

      // Auto-default the selections
      let defaultItemId = 0;
      if (iData && iData.length > 0) defaultItemId = iData[0].id;

      let defaultRecipientId = 0;
      if (tData && tData.length > 0) defaultRecipientId = tData[0].teamId;

      setDistForm(prev => ({
        ...prev,
        reliefItemId: defaultItemId,
        recipientId: defaultRecipientId
      }));
    } catch { 
      setItems([]); 
      setDistributions([]);
    } 
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { await reliefApi.createItem(form); setShowForm(false); load(); } catch {}
  }

  async function handleCreateDist(e: React.FormEvent) {
    e.preventDefault();
    
    let targetReliefItemId = distForm.reliefItemId;
    if (targetReliefItemId === 0) {
      if (items.length > 0) targetReliefItemId = items[0].id;
      else { alert("Vui lòng thêm hàng vào kho trước."); return; }
    }

    const selectedItem = items.find(i => i.id === targetReliefItemId);
    if (!selectedItem) {
      alert("Vui lòng chọn một mặt hàng hợp lệ.");
      return;
    }

    if (selectedItem.quantityInStock < distForm.quantity) {
      alert(`Xuất kho thất bại: Số lượng tồn kho không đủ (Hiện tại chỉ còn ${selectedItem.quantityInStock} ${selectedItem.unit}).`);
      return;
    }

    let recipientName = "";
    let recipientLocation = "";
    let rescueRequestId: number | undefined = undefined;

    // Map recipientId to actual names and locations
    if (distForm.recipientType === "RESCUE_TEAM") {
      const team = teams.find(t => t.teamId === distForm.recipientId);
      recipientName = team ? team.teamName : `Đội cứu hộ #${distForm.recipientId}`;
      recipientLocation = team ? team.currentLocation || "Tọa độ đội cứu hộ" : "Tọa độ đội cứu hộ";
    } else if (distForm.recipientType === "SHELTER") {
      const shelter = shelters.find(s => s.id === distForm.recipientId);
      recipientName = shelter ? shelter.name : `Điểm an toàn #${distForm.recipientId}`;
      recipientLocation = shelter ? shelter.location : "Vị trí điểm an toàn";
    } else if (distForm.recipientType === "CITIZEN") {
      const req = requests.find(r => r.requestId === distForm.recipientId);
      recipientName = req ? `Hộ dân (SOS #${req.requestId})` : `Hộ dân #${distForm.recipientId}`;
      recipientLocation = req ? req.location : "Vị trí hộ dân";
      rescueRequestId = distForm.recipientId > 0 ? distForm.recipientId : undefined;
    }

    const payload = {
      itemId: targetReliefItemId,
      quantity: distForm.quantity,
      recipientName,
      recipientLocation,
      rescueRequestId,
      notes: distForm.notes
    };

    try { 
      await reliefApi.distribute(payload); 
      setShowDistForm(false); 
      load(); 
      alert("Xuất kho viện trợ thành công!");
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || "Lỗi kiểm tra tính hợp lệ dữ liệu của Server.";
      alert(`Xuất kho thất bại: ${errMsg}`);
    }
  }

  async function updateStock(id: number, currentItem: ReliefItem, change: number) {
    const newStock = currentItem.quantityInStock + change;
    if (newStock < 0) return;
    try {
      await reliefApi.updateItem(id, { ...currentItem, quantityInStock: newStock });
      load();
    } catch {}
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Cứu trợ & Logistics</h1>
          <p className="text-sm text-slate">Quản lý kho hàng và nhật ký cấp phát viện trợ</p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "STOCK" && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary"><Plus size={16} /> Nhập kho</button>
          )}
          {activeTab === "DISTRIBUTIONS" && (
            <button onClick={() => {
              setShowDistForm(!showDistForm);
              // Default values on toggling dist form
              if (!showDistForm) {
                const defaultItemId = items.length > 0 ? items[0].id : 0;
                const defaultRecipientId = teams.length > 0 ? teams[0].teamId : 0;
                setDistForm({
                  reliefItemId: defaultItemId,
                  quantity: 1,
                  recipientType: "RESCUE_TEAM",
                  recipientId: defaultRecipientId,
                  notes: ""
                });
              }
            }} className="btn-primary !bg-brand-orange-deep"><Plus size={16} /> Xuất cấp phát</button>
          )}
        </div>
      </div>

      <div className="flex border-b border-hairline">
        <button onClick={() => setActiveTab("STOCK")} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "STOCK" ? "text-primary border-b-2 border-primary" : "text-slate hover:text-ink"}`}>
          <Archive size={16} className="inline mr-1.5" /> Kho hàng
        </button>
        <button onClick={() => setActiveTab("DISTRIBUTIONS")} className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === "DISTRIBUTIONS" ? "text-primary border-b-2 border-primary" : "text-slate hover:text-ink"}`}>
          <History size={16} className="inline mr-1.5" /> Nhật ký phân phối
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Tên</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Loại</label>
              <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="FOOD">Thực phẩm</option><option value="WATER">Nước</option><option value="MEDICINE">Thuốc</option>
                <option value="CLOTHING">Quần áo</option><option value="EQUIPMENT">Trang thiết bị</option>
              </select></div>
            <div><label className="block text-sm font-medium mb-1">Đơn vị</label>
              <input className="input-field" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Tồn kho</label>
              <input type="number" className="input-field" value={form.quantityInStock} onChange={e => setForm({ ...form, quantityInStock: +e.target.value })} /></div>
            <div><label className="block text-sm font-medium mb-1">Tồn kho tối thiểu</label>
              <input type="number" className="input-field" value={form.minimumStockLevel} onChange={e => setForm({ ...form, minimumStockLevel: +e.target.value })} /></div>
            <div className="flex items-end gap-2">
              <button type="submit" className="btn-primary">Tạo</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {activeTab === "STOCK" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const lowStock = item.quantityInStock <= item.minimumStockLevel;
              return (
                <div key={item.id} className={`card p-5 hover:shadow-mockup transition-all duration-200 ${lowStock ? "border-semantic-error" : ""}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-tint-peach flex items-center justify-center">
                      <Package size={18} className="text-brand-orange-deep" />
                    </div>
                    {lowStock && <span className="badge-red flex items-center gap-1 animate-pulse"><AlertTriangle size={10} /> Sắp hết</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-ink">{item.name}</h3>
                  <p className="text-xs text-slate mt-1">{item.category} · {item.unit}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{item.quantityInStock}</p>
                      <p className="text-xs text-slate">Tồn kho</p>
                    </div>
                    <div className="flex items-center gap-1 border border-hairline rounded p-1">
                      <button onClick={() => updateStock(item.id, item, -10)} className="w-6 h-6 rounded bg-surface hover:bg-surface-soft flex items-center justify-center text-slate font-medium" title="Trừ 10">-10</button>
                      <button onClick={() => updateStock(item.id, item, 10)} className="w-6 h-6 rounded bg-surface hover:bg-surface-soft flex items-center justify-center text-slate font-medium" title="Cộng 10">+10</button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate">{item.minimumStockLevel}</p>
                      <p className="text-xs text-slate">Tối thiểu</p>
                    </div>
                  </div>
                  {/* Stock bar */}
                  <div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${lowStock ? "bg-semantic-error" : "bg-semantic-success"}`}
                      style={{ width: `${Math.min((item.quantityInStock / Math.max(item.minimumStockLevel * 5, 1)) * 100, 100)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === "DISTRIBUTIONS" && (
        <>
          {showDistForm && (
            <div className="card p-6 animate-slide-up mb-4">
              <form onSubmit={handleCreateDist} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Mặt hàng xuất phát</label>
                  <select className="input-field" value={distForm.reliefItemId} onChange={e => setDistForm({ ...distForm, reliefItemId: +e.target.value })}>
                    {items.length === 0 && <option value={0}>-- Kho trống --</option>}
                    {items.map(i => <option key={i.id} value={i.id}>{i.name} (Tồn: {i.quantityInStock} {i.unit})</option>)}
                  </select>
                </div>
                <div><label className="block text-sm font-medium mb-1">Số lượng xuất</label>
                  <input type="number" min="1" className="input-field" value={distForm.quantity} onChange={e => setDistForm({ ...distForm, quantity: +e.target.value })} /></div>
                
                <div><label className="block text-sm font-medium mb-1">Đối tượng nhận (Phân loại)</label>
                  <select className="input-field" value={distForm.recipientType} onChange={e => {
                    const newType = e.target.value;
                    let defaultId = 0;
                    if (newType === "RESCUE_TEAM" && teams.length > 0) defaultId = teams[0].teamId;
                    else if (newType === "SHELTER" && shelters.length > 0) defaultId = shelters[0].id;
                    else if (newType === "CITIZEN" && requests.length > 0) defaultId = requests[0].requestId;
                    setDistForm({ ...distForm, recipientType: newType, recipientId: defaultId });
                  }}>
                    <option value="RESCUE_TEAM">Đội cứu hộ (Xuất lên xe/thuyền)</option>
                    <option value="CITIZEN">Hộ dân (Phát trực tiếp SOS)</option>
                    <option value="SHELTER">Điểm an toàn (Tiếp tế)</option>
                  </select>
                </div>

                <div><label className="block text-sm font-medium mb-1">Chọn đối tượng nhận cụ thể</label>
                  {distForm.recipientType === "RESCUE_TEAM" && (
                    <select className="input-field" value={distForm.recipientId} onChange={e => setDistForm({ ...distForm, recipientId: +e.target.value })}>
                      {teams.length === 0 && <option value={0}>-- Không tìm thấy đội cứu hộ --</option>}
                      {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.teamName} (Lực lượng: {t.memberCount} người)</option>)}
                    </select>
                  )}
                  {distForm.recipientType === "SHELTER" && (
                    <select className="input-field" value={distForm.recipientId} onChange={e => setDistForm({ ...distForm, recipientId: +e.target.value })}>
                      {shelters.length === 0 && <option value={0}>-- Không tìm thấy điểm an toàn --</option>}
                      {shelters.map(s => <option key={s.id} value={s.id}>{s.name} (Đang chứa: {s.currentOccupancy}/{s.capacity})</option>)}
                    </select>
                  )}
                  {distForm.recipientType === "CITIZEN" && (
                    <select className="input-field" value={distForm.recipientId} onChange={e => setDistForm({ ...distForm, recipientId: +e.target.value })}>
                      {requests.length === 0 && <option value={0}>-- Không tìm thấy yêu cầu SOS nào --</option>}
                      {requests.map(r => <option key={r.requestId} value={r.requestId}>SOS #{r.requestId} - {r.description.slice(0, 30)}... ({r.location})</option>)}
                    </select>
                  )}
                </div>

                <div className="md:col-span-2"><label className="block text-sm font-medium mb-1">Ghi chú (Chiến dịch, Đợt cấp phát)</label>
                  <input className="input-field" value={distForm.notes} onChange={e => setDistForm({ ...distForm, notes: e.target.value })} placeholder="VD: Cứu trợ đợt 1 tại Xã A..." /></div>
                <div className="md:col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary !bg-brand-orange-deep">Ghi nhận xuất kho</button>
                  <button type="button" onClick={() => setShowDistForm(false)} className="btn-secondary">Hủy</button>
                </div>
              </form>
            </div>
          )}

          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
                  <th className="px-4 py-3">Mặt hàng xuất</th><th className="px-4 py-3">Đối tượng nhận</th>
                  <th className="px-4 py-3">Số lượng</th><th className="px-4 py-3">Ghi chú</th>
                  <th className="px-4 py-3">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {distributions.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate">Chưa có nhật ký cấp phát</td></tr> :
                  distributions.map(d => {
                    const item = items.find(i => i.id === d.itemId);
                    return (
                      <tr key={d.id} className="hover:bg-surface-soft transition-colors">
                        <td className="px-4 py-3 font-medium text-ink flex items-center gap-2">
                          <ArrowRight size={14} className="text-brand-orange-deep" /> {d.itemName || item?.name || `Sản phẩm #${d.itemId}`}
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge-soft-purple">{d.recipientName || '---'}</span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-semantic-error">-{d.quantity} {item?.unit}</td>
                        <td className="px-4 py-3 text-xs text-slate">{d.notes}</td>
                        <td className="px-4 py-3 text-xs text-slate">{d.distributedAt ? new Date(d.distributedAt).toLocaleString() : '---'}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
