import { useEffect, useState } from "react";
import { Plus, Shield, MapPin, Users as UsersIcon, Edit2, Trash2, Navigation, X } from "lucide-react";
import { shelterApi } from "../services/apiService";
import type { Shelter } from "../types/rescue";
import { useUserStore } from "../hooks/useUserStore";
import { useDrivingRoute } from "../hooks/useDrivingRoute";
import type { LatLngTuple } from "../services/routingService";

import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from "react-leaflet";
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

function FitRouteBounds({ positions }: { positions: LatLngTuple[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 2) return;
    map.fitBounds(L.latLngBounds(positions), { padding: [24, 24] });
  }, [map, positions]);

  return null;
}

export function SheltersPage() {
  const profile = useUserStore(s => s.profile);
  const userRole = profile?.role || "";
  const isAuthorized = userRole === "ADMIN" || userRole === "MANAGER";
  const isCitizen = userRole === "CITIZEN";

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);
  const [routeTarget, setRouteTarget] = useState<Shelter | null>(null);
  const [routeStart, setRouteStart] = useState<LatLngTuple | null>(null);
  const [locatingRoute, setLocatingRoute] = useState<number | null>(null);
  
  const [form, setForm] = useState({ name: "", location: "", latitude: 15.825, longitude: 108.236, capacity: 100, currentOccupancy: 0, status: "OPEN", contactInfo: "" });
  const [editForm, setEditForm] = useState({ name: "", location: "", latitude: 15.825, longitude: 108.236, capacity: 100, currentOccupancy: 0, status: "OPEN", contactInfo: "" });
  const shelterRoute = useDrivingRoute(routeStart, routeTarget ? [routeTarget.latitude, routeTarget.longitude] : null);

  useEffect(() => { load(); }, []);
  async function load() { 
    try { setShelters(await shelterApi.getAll() || []); } catch { setShelters([]); } 
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try { 
      await shelterApi.create(form); 
      setShowForm(false); 
      setForm({ name: "", location: "", latitude: 15.825, longitude: 108.236, capacity: 100, currentOccupancy: 0, status: "OPEN", contactInfo: "" });
      load(); 
      alert("Thêm điểm an toàn thành công!");
    } catch (err: any) {
      alert("Lỗi tạo điểm an toàn: " + (err.response?.data?.message || err.message));
    }
  }

  function startEdit(s: Shelter) {
    setEditingShelter(s);
    setEditForm({
      name: s.name,
      location: s.location,
      latitude: s.latitude,
      longitude: s.longitude,
      capacity: s.capacity,
      currentOccupancy: s.currentOccupancy,
      status: s.status,
      contactInfo: s.contactInfo || ""
    });
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingShelter) return;
    try {
      await shelterApi.update(editingShelter.id, editForm);
      setEditingShelter(null);
      load();
      alert("Cập nhật điểm an toàn thành công!");
    } catch (err: any) {
      alert("Cập nhật thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Bạn có chắc chắn muốn xóa điểm an toàn này không? Hành động này không thể hoàn tác.")) return;
    try {
      await shelterApi.delete(id);
      load();
      alert("Xóa điểm an toàn thành công!");
    } catch (err: any) {
      alert("Xóa thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  async function adjustOccupancy(s: Shelter, change: number) {
    const newOccupancy = s.currentOccupancy + change;
    if (newOccupancy < 0) {
      alert("Số lượng người trú ẩn không thể nhỏ hơn 0.");
      return;
    }
    if (newOccupancy > s.capacity) {
      alert("Số lượng người trú ẩn đã vượt quá sức chứa tối đa của điểm lánh nạn.");
      return;
    }
    try {
      await shelterApi.update(s.id, {
        ...s,
        currentOccupancy: newOccupancy,
      });
      load();
    } catch (err: any) {
      alert("Cập nhật số lượng người thất bại: " + (err.response?.data?.message || err.message));
    }
  }

  function findRouteToShelter(shelter: Shelter) {
    if (!shelter.latitude || !shelter.longitude) {
      alert("Điểm an toàn này chưa có tọa độ để tìm đường.");
      return;
    }
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
      return;
    }

    setLocatingRoute(shelter.id);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRouteStart([position.coords.latitude, position.coords.longitude]);
        setRouteTarget(shelter);
        setLocatingRoute(null);
      },
      (error) => {
        console.error("Get route location failed:", error);
        setLocatingRoute(null);
        alert("Không lấy được vị trí hiện tại. Vui lòng bật quyền truy cập vị trí rồi thử lại.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function openExternalDirections() {
    if (!routeStart || !routeTarget) return;
    const [fromLat, fromLng] = routeStart;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${fromLat},${fromLng}&destination=${routeTarget.latitude},${routeTarget.longitude}&travelmode=driving`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink">Điểm an toàn</h1>
          <p className="text-sm text-slate">Quản lý các điểm trú ẩn an toàn và tiếp tế lương thực</p>
        </div>
        {isAuthorized && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> {showForm ? "Đóng form" : "Thêm điểm"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h2 className="text-sm font-semibold text-ink mb-4">📍 Thêm Điểm Trú Ẩn Mới</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Tên điểm an toàn</label>
              <input className="input-field" placeholder="Trường Tiểu học Nguyễn Huệ..." value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium mb-1">Địa chỉ (Vị trí)</label>
              <input className="input-field" placeholder="123 Nguyễn Trãi, Phường A..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium mb-1">Sức chứa (Người)</label>
              <input type="number" min="1" className="input-field" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} required /></div>
            <div><label className="block text-sm font-medium mb-1">Liên hệ / Điện thoại</label>
              <input className="input-field" placeholder="SĐT Ban chỉ huy: 0987..." value={form.contactInfo} onChange={e => setForm({ ...form, contactInfo: e.target.value })} /></div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                <span>Vị trí trên Bản đồ (Click để chọn tọa độ)</span>
                <span className="text-xs text-brand-teal font-semibold font-mono bg-tint-mint px-2 py-0.5 rounded border border-brand-teal/20">
                  Vĩ độ: {form.latitude.toFixed(6)}, Kinh độ: {form.longitude.toFixed(6)}
                </span>
              </label>
              <div className="h-[250px] w-full rounded-md border border-hairline overflow-hidden mt-1 relative z-0">
                <MapContainer center={[form.latitude, form.longitude]} zoom={13} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    position={[form.latitude, form.longitude]} 
                    setPosition={(pos) => setForm({ ...form, latitude: pos[0], longitude: pos[1] })} 
                  />
                </MapContainer>
              </div>
            </div>

            <div className="md:col-span-2 flex gap-2 pt-2 border-t border-hairline">
              <button type="submit" className="btn-primary">Tạo mới</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal Popup */}
      {editingShelter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-3xl w-full p-6 animate-scale-up space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h3 className="text-md font-semibold text-ink flex items-center gap-1.5">
                <Edit2 size={16} className="text-brand-purple" /> Cập nhật điểm an toàn
              </h3>
              <button type="button" onClick={() => setEditingShelter(null)} className="text-slate hover:text-ink text-sm">Đóng</button>
            </div>

            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Tên điểm an toàn</label>
                <input className="input-field" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Địa chỉ (Vị trí)</label>
                <input className="input-field" value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Sức chứa tối đa (Người)</label>
                <input type="number" min="1" className="input-field" value={editForm.capacity} onChange={e => setEditForm({ ...editForm, capacity: +e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Số người đang trú ẩn</label>
                <input type="number" min="0" max={editForm.capacity} className="input-field" value={editForm.currentOccupancy} onChange={e => setEditForm({ ...editForm, currentOccupancy: +e.target.value })} required /></div>
              <div><label className="block text-sm font-medium mb-1">Trạng thái điểm</label>
                <select className="input-field" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} required>
                  <option value="OPEN">ĐANG MỞ (OPEN)</option>
                  <option value="CLOSED">ĐÃ ĐÓNG (CLOSED)</option>
                </select></div>
              <div><label className="block text-sm font-medium mb-1">Thông tin liên hệ</label>
                <input className="input-field" value={editForm.contactInfo} onChange={e => setEditForm({ ...editForm, contactInfo: e.target.value })} /></div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 flex items-center justify-between">
                  <span>Vị trí trên Bản đồ (Click để chọn lại tọa độ)</span>
                  <span className="text-xs text-brand-purple font-semibold font-mono bg-tint-lavender px-2 py-0.5 rounded border border-brand-purple/20">
                    Vĩ độ: {editForm.latitude.toFixed(6)}, Kinh độ: {editForm.longitude.toFixed(6)}
                  </span>
                </label>
                <div className="h-[250px] w-full rounded-md border border-hairline overflow-hidden mt-1 relative z-0">
                  <MapContainer center={[editForm.latitude, editForm.longitude]} zoom={14} className="h-full w-full">
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker 
                      position={[editForm.latitude, editForm.longitude]} 
                      setPosition={(pos) => setEditForm({ ...editForm, latitude: pos[0], longitude: pos[1] })} 
                    />
                  </MapContainer>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-hairline">
                <button type="button" onClick={() => setEditingShelter(null)} className="btn-secondary">Hủy</button>
                <button type="submit" className="btn-primary">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCitizen && routeTarget && routeStart && (
        <div className="card p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Navigation size={16} className="text-brand-teal" /> Tuyến đường tới {routeTarget.name}
              </h2>
              <p className="text-xs text-slate mt-1">
                {shelterRoute.loading
                  ? "Đang tính tuyến đường..."
                  : shelterRoute.distanceKm
                    ? `${shelterRoute.distanceKm} km, khoảng ${shelterRoute.durationMin} phút`
                    : "Đang hiển thị đường thẳng dự phòng khi không lấy được tuyến đường thực tế."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={openExternalDirections} className="btn-secondary !py-1.5 !px-2 text-xs">
                Mở Google Maps
              </button>
              <button type="button" onClick={() => { setRouteTarget(null); setRouteStart(null); }} className="p-2 rounded hover:bg-surface" title="Đóng tuyến đường">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="h-[320px] w-full rounded-md border border-hairline overflow-hidden relative z-0">
            <MapContainer center={routeStart} zoom={13} className="h-full w-full">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <FitRouteBounds positions={shelterRoute.positions.length >= 2 ? shelterRoute.positions : [routeStart, [routeTarget.latitude, routeTarget.longitude]]} />
              <Marker position={routeStart}>
                <Popup>Vị trí của bạn</Popup>
              </Marker>
              <Marker position={[routeTarget.latitude, routeTarget.longitude]}>
                <Popup>{routeTarget.name}</Popup>
              </Marker>
              <Polyline
                positions={shelterRoute.positions.length >= 2 ? shelterRoute.positions : [routeStart, [routeTarget.latitude, routeTarget.longitude]]}
                pathOptions={{ color: "#0f766e", weight: 5, opacity: 0.85 }}
              />
            </MapContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelters.length === 0 ? (
          <div className="col-span-full card p-8 text-center text-slate">Không tìm thấy điểm an toàn nào</div>
        ) : (
          shelters.map(s => {
            const occupancyPct = s.capacity > 0 ? (s.currentOccupancy / s.capacity) * 100 : 0;
            const isFull = occupancyPct >= 90;
            return (
              <div key={s.id} className="card p-5 hover:shadow-mockup transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-tint-mint flex items-center justify-center">
                      <Shield size={18} className="text-brand-green" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={s.status === "OPEN" ? "badge-green" : "badge-red"}>
                        {s.status === "OPEN" ? "ĐANG MỞ" : "ĐÃ ĐÓNG"}
                      </span>
                      {isAuthorized && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => startEdit(s)} className="p-1 hover:bg-surface rounded text-slate hover:text-brand-purple transition-colors" title="Chỉnh sửa">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="p-1 hover:bg-surface rounded text-slate hover:text-semantic-error transition-colors" title="Xóa">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-ink">{s.name}</h3>
                  <p className="text-xs text-slate mt-1 flex items-center gap-1">
                    <MapPin size={12} className="shrink-0 text-slate" />
                    <span className="truncate" title={s.location}>{s.location}</span>
                  </p>
                  
                  {s.contactInfo && (
                    <p className="text-xs text-slate mt-1 font-mono">📞 {s.contactInfo}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-xs">
                      <UsersIcon size={12} className="text-slate" />
                      <span className="font-semibold text-ink">{s.currentOccupancy}</span>
                      <span className="text-slate">/ {s.capacity} người</span>
                    </div>
                    {isAuthorized && s.status === "OPEN" && (
                      <div className="flex items-center gap-1 border border-hairline rounded p-0.5 bg-surface-soft">
                        <button onClick={() => adjustOccupancy(s, -5)} className="px-1.5 py-0.5 text-2xs rounded bg-surface hover:bg-surface-dark flex items-center justify-center text-slate font-semibold" title="Bớt 5 người">-5</button>
                        <button onClick={() => adjustOccupancy(s, 5)} className="px-1.5 py-0.5 text-2xs rounded bg-surface hover:bg-surface-dark flex items-center justify-center text-slate font-semibold" title="Thêm 5 người">+5</button>
                      </div>
                    )}
                    <span className="text-2xs text-slate font-medium">Trống: {s.capacity - s.currentOccupancy}</span>
                  </div>

                  {/* Occupancy ratio bar */}
                  <div className="mt-3 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${isFull ? "bg-semantic-error" : "bg-brand-green"}`}
                      style={{ width: `${Math.min(occupancyPct, 100)}%` }} />
                  </div>
                </div>
                {isCitizen && (
                  <button
                    type="button"
                    onClick={() => findRouteToShelter(s)}
                    disabled={locatingRoute === s.id || s.status !== "OPEN"}
                    className="btn-primary mt-4 w-full justify-center text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Navigation size={14} />
                    {locatingRoute === s.id ? "Đang lấy vị trí..." : "Tìm đường tới đây"}
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
