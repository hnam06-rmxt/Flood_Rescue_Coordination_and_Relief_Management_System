import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MapPin, CheckCircle, ArrowRight, UserPlus, XCircle, Navigation, Radio, HeartHandshake, Eye, UserCheck, Map, ShieldCheck, ShieldX, Gift, ImagePlus } from "lucide-react";

import { rescueApi, teamApi, uploadApi } from "../services/apiService";
import { useUserStore } from "../hooks/useUserStore";
import { wsService } from "../lib/websocket";
import type { RescueRequest, CreateRescueRequest, RescueTeam, NearbyTeamSuggestion } from "../types/rescue";

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

const urgencyBadge: Record<string, string> = { 
  CRITICAL: "badge-red", 
  HIGH: "badge-orange", 
  MEDIUM: "badge-blue", 
  LOW: "badge-green" 
};
const statusBadge: Record<string, string> = { 
  PENDING: "badge-orange", 
  VERIFIED: "badge-blue",
  ASSIGNED: "badge-blue", 
  IN_PROGRESS: "badge-purple", 
  COMPLETED: "badge-green", 
  RELIEF_RECEIVED: "badge-green",
  CANCELLED: "badge-red",
  REJECTED: "badge-red"
};
const statusLabel: Record<string, string> = {
  PENDING: "Chờ xác minh",
  VERIFIED: "Đã xác minh",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang cứu hộ",
  COMPLETED: "Hoàn thành",
  RELIEF_RECEIVED: "Đã nhận cứu trợ",
  CANCELLED: "Đã hủy",
  REJECTED: "Bị từ chối",
};

export function RescueRequestsPage() {
  const navigate = useNavigate();
  const profile = useUserStore(s => s.profile);
  const isCitizen = profile?.role === "CITIZEN";
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "COORDINATOR";
  const isRescuer = profile?.role === "RESCUER";
  const isStaff = isAdmin || isRescuer || profile?.role === "MANAGER";
  
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<number | null>(null);
  const [nearbyTeams, setNearbyTeams] = useState<NearbyTeamSuggestion[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);
  // Completion modal
  const [completionModal, setCompletionModal] = useState<{ id: number } | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completionFiles, setCompletionFiles] = useState<File[]>([]);
  const [completionPreviews, setCompletionPreviews] = useState<string[]>([]);
  const [completionUploading, setCompletionUploading] = useState(false);
  const [form, setForm] = useState<CreateRescueRequest>({ description: "", location: "", latitude: 0, longitude: 0, urgencyLevel: "MEDIUM", image: "", numberOfPeople: 1 });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sosActive, setSosActive] = useState<Record<number, boolean>>({});
  const [teamLocationActive, setTeamLocationActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<RescueRequest | null>(null);
  const [updateLocationModal, setUpdateLocationModal] = useState<{ id: number, lat: number, lng: number } | null>(null);
  const wsInitialized = useRef(false);

  useEffect(() => { 
    load(); 
    teamApi.getAll().then(setTeams).catch(() => {});
    // WebSocket: subscribe to SOS updates for real-time refresh
    if (!wsInitialized.current) {
      wsInitialized.current = true;
      const unsub = wsService.subscribe("/topic/sos-updates", () => {
        load();
      });
      return () => unsub();
    }
  }, [isCitizen, isStaff]);

  useEffect(() => {
    if (!showAssignModal) {
      setNearbyTeams([]);
      return;
    }
    setNearbyLoading(true);
    rescueApi.getNearbyTeams(showAssignModal)
      .then((data) => setNearbyTeams(data || []))
      .catch(() => setNearbyTeams([]))
      .finally(() => setNearbyLoading(false));
  }, [showAssignModal]);

  async function load() {
    setLoading(true);
    try {
      let data: RescueRequest[];
      if (isCitizen) {
        data = await rescueApi.getMyRequests();
      } else if (isRescuer) {
        // FR-fix: Rescuer chỉ xem ca của đội mình
        const allTeams = await teamApi.getAll();
        const myTeam = allTeams.find(t => t.teamLeaderId === profile?.id);
        if (myTeam) {
          data = await rescueApi.getByTeam(myTeam.teamId);
        } else {
          data = await rescueApi.getAll();
        }
      } else {
        data = await rescueApi.getAll();
      }
      setRequests(data || []);
    } catch (err) { 
      console.error("Load requests failed:", err);
      setRequests([]); 
    }
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.location || form.latitude === 0) {
      alert("Vui long dien day du thong tin va lay toa do GPS.");
      return;
    }
    try {
      setUploadingImages(true);
      const uploadedImages = selectedImages.length > 0
        ? await uploadApi.uploadImages(selectedImages, "rescue-requests")
        : null;

      await rescueApi.create({ ...form, image: uploadedImages?.joinedUrls || "" });
      setShowForm(false);
      setForm({ description: "", location: "", latitude: 0, longitude: 0, urgencyLevel: "MEDIUM", image: "", numberOfPeople: 1 });
      setSelectedImages([]);
      setImagePreviewUrls([]);
      alert("Gui yeu cau cuu ho thanh cong!");
      load();
    } catch (err: any) {
      alert("Loi khi gui yeu cau. Chi tiet: " + (err.response?.data?.message || err.message));
    } finally {
      setUploadingImages(false);
    }
  }
  function handleGetLocation() {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    
    // Thêm feedback đang tải
    alert("Đang lấy vị trí... Vui lòng chờ vài giây (nếu bạn dùng PC không có GPS có thể sẽ mất thời gian hoặc thất bại).");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        alert("Đã lấy được vị trí thành công!");
      },
      (error) => {
        console.error("Error getting location:", error);
        let msg = "Không thể lấy vị trí hiện tại.";
        if (error.code === 1) msg = "Trình duyệt hoặc hệ điều hành của bạn đang từ chối quyền truy cập vị trí. Vui lòng kiểm tra lại cài đặt.";
        if (error.code === 2) msg = "Không thể xác định được vị trí (Thiết bị không có GPS hoặc mạng không hỗ trợ định vị). Bạn có thể nhập tay số Vĩ độ/Kinh độ.";
        if (error.code === 3) msg = "Quá thời gian chờ định vị. Vui lòng thử lại hoặc nhập tay.";
        alert(`Lỗi: ${msg}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function updateStatus(id: number, status: string) {
    if (!confirm(`Xác nhận chuyển trạng thái sang ${statusLabel[status] || status}?`)) return;
    try { 
      await rescueApi.updateStatus(id, status); 
      load(); 
    } catch (err) {
      console.error("Update status failed:", err);
      alert("Cập nhật trạng thái thất bại. Vui lòng kiểm tra lại.");
    }
  }

  async function handleVerify(id: number) {
    if (!confirm("Xác minh yêu cầu SOS này là hợp lệ?")) return;
    try { await rescueApi.verifyRequest(id); load(); }
    catch { alert("Xác minh thất bại."); }
  }

  async function handleReject(id: number) {
    if (!confirm("Từ chối SOS này? Hành động này không thể hoàn tác.")) return;
    try { await rescueApi.updateStatus(id, "REJECTED"); load(); }
    catch { alert("Từ chối thất bại."); }
  }

  async function handleMarkReliefReceived(id: number) {
    if (!confirm("Đảm bảo bạn đã nhận được hàng cứu trợ?")) return;
    try { await rescueApi.markReliefReceived(id); load(); }
    catch { alert("Xác nhận thất bại."); }
  }

  async function handleCompletionConfirm() {
    if (!completionModal) return;
    setCompletionUploading(true);
    try {
      let proofImageUrl = "";
      if (completionFiles.length > 0) {
        // Upload ảnh lên server trước
        const uploaded = await uploadApi.uploadImages(completionFiles, "rescue-proof");
        proofImageUrl = uploaded?.joinedUrls || uploaded?.urls?.join("|||") || "";
      }
      await rescueApi.updateStatus(completionModal.id, "COMPLETED", completionNotes, proofImageUrl);
      setCompletionModal(null);
      setCompletionNotes("");
      setCompletionFiles([]);
      setCompletionPreviews([]);
      load();
    } catch {
      alert("Hoàn thành thất bại, vui lòng thử lại.");
    } finally {
      setCompletionUploading(false);
    }
  }

  async function handleUpdateUrgency(id: number, urgency: string) {
    if (!confirm(`Xác nhận đổi mức độ khẩn cấp sang ${urgency}?`)) return;
    try { await rescueApi.updateUrgency(id, urgency); load(); } 
    catch (err) { alert("Cập nhật mức độ thất bại."); }
  }

  async function handleConfirmRescued(id: number) {
    if (!confirm("Bạn xác nhận đã được cứu hộ an toàn / nhận đủ nhu yếu phẩm?")) return;
    try {
      await rescueApi.confirmRescued(id);
      load();
    } catch {}
  }

  function toggleSos(requestId: number) {
    setSosActive(prev => {
      const isActive = prev[requestId];
      if (isActive) {
        alert("Đã tắt chế độ SOS cho yêu cầu này.");
        return { ...prev, [requestId]: false };
      } else {
        if (!navigator.geolocation) {
          alert("Trình duyệt không hỗ trợ định vị GPS.");
          return prev;
        }
        alert("Đã bật chế độ SOS! Vị trí của bạn sẽ được cập nhật liên tục mỗi 30 giây.");
        pingLocation(requestId);
        return { ...prev, [requestId]: true };
      }
    });
  }

  function pingLocation(requestId: number) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await rescueApi.updateLocation(requestId, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }); } 
        catch (e) { console.error("SOS ping failed", e); }
      },
      (err) => console.error("SOS location error", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function toggleTeamLocation() {
    setTeamLocationActive(prev => {
      if (prev) {
         alert("Đã dừng phát vị trí đội cứu hộ.");
         return false;
      }
      if (!navigator.geolocation) {
         alert("Trình duyệt không hỗ trợ định vị GPS.");
         return false;
      }
      const myTeam = teams.find(t => t.teamLeaderId === profile?.id);
      if (!myTeam) {
         alert("Bạn không phải là đội trưởng hoặc chưa được phân công vào đội nào!");
         return false;
      }
      alert("Đã bật chia sẻ GPS thực địa! Tọa độ đội cứu hộ sẽ liên tục được báo cáo về Sở chỉ huy.");
      pingTeamLocation(myTeam.teamId);
      return true;
    });
  }

  function pingTeamLocation(teamId: number) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try { await teamApi.updateLocation(teamId, { latitude: pos.coords.latitude, longitude: pos.coords.longitude }); } 
        catch (e) { console.error("Team location ping failed", e); }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    if (teamLocationActive) {
      const interval = setInterval(() => {
         const myTeam = teams.find(t => t.teamLeaderId === profile?.id);
         if (myTeam) pingTeamLocation(myTeam.teamId);
      }, 10000); // 10s cập nhật 1 lần
      return () => clearInterval(interval);
    }
  }, [teamLocationActive, teams, profile?.id]);

  useEffect(() => {
    const activeRequests = Object.keys(sosActive).filter(id => sosActive[Number(id)]);
    if (activeRequests.length === 0) return;
    const interval = setInterval(() => {
      activeRequests.forEach(id => pingLocation(Number(id)));
    }, 30000);
    return () => clearInterval(interval);
  }, [sosActive]);

  async function handleAssign(requestId: number, teamId: number) {
    try { 
      await rescueApi.assignTeam(requestId, teamId); 
      setShowAssignModal(null);
      setNearbyTeams([]);
      load(); 
    } catch (err) {
      console.error("Assign team failed:", err);
      alert("Phân công đội thất bại.");
    }
  }

  async function openAssignModal(requestId: number) {
    setShowAssignModal(requestId);
    setNearbyLoading(true);
    try {
      const suggestions = await rescueApi.getNearbyTeams(requestId);
      setNearbyTeams(suggestions || []);
    } catch {
      // Fallback to all ACTIVE teams sorted by distance client-side
      setNearbyTeams([]);
    } finally {
      setNearbyLoading(false);
    }
  }

  const filtered = requests.filter(r => {
    if (search && !r.description.toLowerCase().includes(search.toLowerCase()) && !r.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">Yêu cầu cứu hộ</h1>
          <p className="text-sm text-slate">{isCitizen ? "Các yêu cầu bạn đã gửi" : "Tất cả yêu cầu trong hệ thống"}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus size={16} /> Tạo yêu cầu
        </button>
      </div>

      {showForm && (
        <div className="card p-6 animate-slide-up">
          <h3 className="text-sm font-semibold text-ink mb-4">Tạo yêu cầu cứu hộ mới</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Mô tả tình huống</label>
              <textarea className="input-field h-20" placeholder="Mô tả chi tiết..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Vị trí</label>
              <input className="input-field" placeholder="Địa chỉ..." value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Mức độ khẩn cấp</label>
              <select className="input-field" value={form.urgencyLevel} onChange={e => setForm({ ...form, urgencyLevel: e.target.value })}>
                <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option><option value="CRITICAL">Khẩn cấp</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Số người cần cứu</label>
              <input type="number" min="1" className="input-field" value={form.numberOfPeople} onChange={e => setForm({ ...form, numberOfPeople: +e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1">Hinh anh dinh kem (co the chon nhieu anh)</label>
              <input type="file" accept="image/*" multiple className="input-field file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-tint-mint file:text-brand-green hover:file:bg-brand-green hover:file:text-white"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;
                  const nextFiles = [...selectedImages, ...Array.from(files)];
                  setSelectedImages(nextFiles);
                  setImagePreviewUrls(nextFiles.map(file => URL.createObjectURL(file)));
                }} />
              {imagePreviewUrls.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {imagePreviewUrls.map((img, i) => (
                    <div key={i} className="relative">
                       <img src={img} alt="Preview" className="w-16 h-16 object-cover rounded shadow border border-hairline" />
                       <button type="button" onClick={() => {
                          const nextFiles = selectedImages.filter((_, index) => index !== i);
                          setSelectedImages(nextFiles);
                          setImagePreviewUrls(nextFiles.map(file => URL.createObjectURL(file)));
                       }} className="absolute -top-2 -right-2 bg-semantic-error text-white rounded-full p-0.5 shadow-sm hover:scale-110 transition-transform">
                         <XCircle size={14} />
                       </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1 flex items-center justify-between">
                <span>Vị trí trên Bản đồ (Click để chọn Vĩ độ/Kinh độ)</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-brand-teal font-semibold font-mono bg-tint-mint px-2 py-0.5 rounded border border-brand-teal/20">
                    {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                  </span>
                  <button type="button" onClick={handleGetLocation} className="btn-secondary !py-0.5 !px-2 text-xs" title="Lấy vị trí hiện tại (GPS)">
                    <Navigation size={12} className="inline mr-1" /> Định vị GPS
                  </button>
                </div>
              </label>
              <div className="h-[250px] w-full rounded-md border border-hairline overflow-hidden mt-1 relative z-0">
                <MapContainer center={[form.latitude || 15.825, form.longitude || 108.236]} zoom={13} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker 
                    position={[form.latitude || 15.825, form.longitude || 108.236]} 
                    setPosition={(pos) => setForm({ ...form, latitude: pos[0], longitude: pos[1] })} 
                  />
                </MapContainer>
              </div>
            </div>
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="btn-primary" disabled={uploadingImages}>{uploadingImages ? "Dang tai anh..." : "Gui yeu cau"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Hủy</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {isRescuer && (
          <button onClick={toggleTeamLocation}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border ${teamLocationActive ? 'bg-error text-white border-error animate-pulse' : 'bg-surface text-slate border-hairline hover:bg-surface-soft'}`}>
            <Radio size={14} /> {teamLocationActive ? "Đang chia sẻ vị trí Đội" : "Bật chia sẻ GPS Đội"}
          </button>
        )}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" />
          <input className="input-field pl-9" placeholder="Tìm kiếm..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface">
              <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Vị trí</th><th className="px-4 py-3">Khẩn cấp</th>
                <th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Đội cứu hộ</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline-soft">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate">Đang tải...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate">Không có dữ liệu</td></tr>
              ) : filtered.map(req => {
                const r = req as any;
                const isSos = sosActive[r.requestId] || false;
                return (
                <tr key={r.requestId} className={`hover:bg-surface-soft transition-colors ${isSos ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">#{r.requestId}</td>
                  <td className="px-4 py-3 max-w-xs truncate">
                    {req.description}
                    {isCitizen && r.status !== "CANCELLED" && (
                      <div className="mt-2 text-[10px] text-slate flex gap-1 items-center font-medium">
                        <span className={r.status === "PENDING" ? "text-primary" : "text-brand-green"}>Chờ tiếp nhận</span>
                        <span>&rsaquo;</span>
                        <span className={r.status === "ASSIGNED" ? "text-primary" : (r.status === "IN_PROGRESS" || r.status === "COMPLETED" ? "text-brand-green" : "text-slate")}>Đã phân công</span>
                        <span>&rsaquo;</span>
                        <span className={r.status === "IN_PROGRESS" ? "text-primary" : (r.status === "COMPLETED" ? "text-brand-green" : "text-slate")}>Đang đến</span>
                        <span>&rsaquo;</span>
                        <span className={r.status === "COMPLETED" ? "text-brand-green" : "text-slate"}>Hoàn thành</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs"><MapPin size={12} className="inline mr-1" />{req.location}</td>
                  <td className="px-4 py-3">
                    {isAdmin ? (
                      <select className={`text-xs font-semibold px-2 py-1 rounded-full cursor-pointer ${urgencyBadge[req.urgencyLevel] || "badge-soft-purple"}`}
                        value={req.urgencyLevel}
                        onChange={(e) => handleUpdateUrgency(r.requestId, e.target.value)}>
                        <option value="LOW" className="bg-white text-ink">LOW</option>
                        <option value="MEDIUM" className="bg-white text-ink">MEDIUM</option>
                        <option value="HIGH" className="bg-white text-ink">HIGH</option>
                        <option value="CRITICAL" className="bg-white text-ink">CRITICAL</option>
                      </select>
                    ) : (
                      <span className={urgencyBadge[req.urgencyLevel] || "badge-soft-purple"}>{req.urgencyLevel}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge[req.status] || "badge-soft-purple"}>{req.status}</span>
                    <br/><span className="text-xs text-slate mt-1 block">{(req as any).numberOfPeople || 1} người</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate">
                    {req.assignedTeamName || "---"}
                    {req.image && (
                      <div className="mt-1 flex gap-2 flex-wrap">
                        {req.image.split("|||").map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="text-primary hover:underline">Ảnh {i+1}</a>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 max-w-[150px] ml-auto">
                      <button onClick={() => setSelectedRequestDetails(req)} 
                        className="btn-secondary !py-1 !px-2 text-xs border-primary text-primary hover:bg-tint-lavender flex items-center gap-1"
                        title="Xem chi tiết yêu cầu">
                        <Eye size={14} /> Chi tiết
                      </button>
                      {isCitizen && ["PENDING", "ASSIGNED", "IN_PROGRESS"].includes(r.status) && (
                        <button onClick={() => toggleSos(r.requestId)} 
                          className={`btn-secondary !py-1 !px-2 text-xs flex items-center gap-1 ${isSos ? 'bg-error text-white border-error animate-pulse' : 'text-error border-error'}`}>
                          <Radio size={14} /> {isSos ? "TẮT SOS" : "SOS"}
                        </button>
                      )}
                      {isCitizen && ["ASSIGNED", "IN_PROGRESS"].includes(r.status) && (
                        <button onClick={() => handleConfirmRescued(r.requestId)} 
                          className="btn-primary !bg-brand-green !py-1 !px-2 text-xs flex items-center gap-1">
                          <HeartHandshake size={14} /> Đã cứu
                        </button>
                      )}
                      {isAdmin && ["PENDING", "VERIFIED"].includes(req.status) && (
                         <button onClick={() => openAssignModal(r.requestId)} 
                          className="btn-secondary !py-1 !px-2 text-xs border-primary text-primary hover:bg-tint-lavender"
                          title="Điều phối đội cứu hộ">
                          <UserPlus size={14} /> Điều phối
                        </button>
                      )}
                      {/* Coordinator: Verify / Reject PENDING */}
                      {isAdmin && req.status === "PENDING" && (
                        <>
                          <button onClick={() => handleVerify(r.requestId)}
                            className="btn-secondary !py-1 !px-2 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 flex items-center gap-1"
                            title="Xác minh SOS hợp lệ">
                            <ShieldCheck size={14} /> Xác minh
                          </button>
                          <button onClick={() => handleReject(r.requestId)}
                            className="btn-secondary !py-1 !px-2 text-xs border-error text-error hover:bg-tint-rose flex items-center gap-1"
                            title="Từ chối SOS giả">
                            <ShieldX size={14} /> Từ chối
                          </button>
                        </>
                      )}
                      {isStaff && req.status === "ASSIGNED" && (
                        <>
                          <button onClick={() => updateStatus(r.requestId, "IN_PROGRESS")} 
                            className="btn-primary !py-1 !px-2 text-xs border-brand-teal bg-brand-teal">
                            <CheckCircle size={14} /> Tiếp nhận
                          </button>
                          <button onClick={() => {
                            const reason = prompt("Lý do từ chối nhiệm vụ (Hỏng xe, hết xăng...):");
                            if (reason) updateStatus(r.requestId, "CANCELLED");
                          }} className="btn-secondary !py-1 !px-2 text-xs border-error text-error hover:bg-tint-rose">
                            Từ chối
                          </button>
                        </>
                      )}
                      {isStaff && req.status === "IN_PROGRESS" && (
                        <button onClick={() => {
                          setCompletionModal({ id: r.requestId });
                          setCompletionNotes("");
                          setCompletionFiles([]);
                          setCompletionPreviews([]);
                        }}
                          className="btn-primary !py-1 !px-2 text-xs !bg-brand-green flex items-center gap-1">
                          <CheckCircle size={14} /> Hoàn thành
                        </button>
                      )}
                      {/* Citizen: Đã nhận cứu trợ */}
                      {isCitizen && ["COMPLETED", "IN_PROGRESS"].includes(r.status) && (
                        <button onClick={() => handleMarkReliefReceived(r.requestId)}
                          className="btn-primary !py-1 !px-2 text-xs !bg-emerald-600 flex items-center gap-1"
                          title="Xác nhận đã nhận hàng cứu trợ">
                          <Gift size={14} /> Đã nhận cứu trợ
                        </button>
                      )}
                      {(isStaff || isCitizen) && ["PENDING", "ASSIGNED"].includes(req.status) && (
                        <button onClick={() => updateStatus(r.requestId, "CANCELLED")} 
                          className="btn-secondary !py-1 !px-2 text-xs border-error text-error hover:bg-tint-rose">
                          <XCircle size={14} /> Hủy
                        </button>
                      )}
                      {isCitizen && ["PENDING", "ASSIGNED"].includes(r.status) && (
                        <button onClick={() => setUpdateLocationModal({ id: r.requestId, lat: r.latitude || 15.825, lng: r.longitude || 108.236 })} 
                          className="btn-secondary !py-1 !px-2 text-xs border-brand-purple text-brand-purple hover:bg-tint-lavender flex items-center gap-1">
                          <Map size={14} /> Sửa vị trí
                        </button>
                      )}
                      {/* FR-3.2 Navigation */}
                      {(isStaff || isCitizen) && ["ASSIGNED", "IN_PROGRESS"].includes(req.status) && req.latitude && req.longitude && (
                        <button
                          onClick={() => {
                            navigate(`/map?focusRequest=${req.requestId}&focusTeam=${req.assignedTeamId || ""}`);
                          }}
                          className="btn-secondary !py-1 !px-2 text-xs border-link text-link hover:bg-link hover:text-white flex items-center gap-1"
                        >
                          <Navigation size={14} /> Dẫn đường
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal - dùng Redis Geo API */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-lg font-semibold text-ink mb-1">Điều phối đội cứu hộ</h3>
            <p className="text-xs text-slate mb-4">
              {nearbyLoading ? "Đang tìm đội gần nhất qua Redis Geo..." : `Gợi ý ${nearbyTeams.length} đội có sẵn gần nhất`}
            </p>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {nearbyLoading && (
                <div className="py-6 text-center text-slate text-sm animate-pulse">Đang tìm kiếm...</div>
              )}
              {!nearbyLoading && nearbyTeams.length === 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-md">Không có đội nào gần trong bán kính tìm kiếm. Hiển thị tất cả đội ACTIVE:</p>
                  {teams.filter(t => t.status === "ACTIVE").map((t) => (
                    <button key={t.teamId} onClick={() => handleAssign(showAssignModal, t.teamId)}
                      className="flex items-center justify-between w-full p-3 rounded-md border border-hairline hover:bg-surface transition-colors">
                      <div className="text-left">
                        <p className="text-sm font-medium text-ink">{t.teamName}</p>
                        <p className="text-xs text-slate">{t.memberCount} thành viên · {t.contactPhone}</p>
                      </div>
                      <ArrowRight size={14} className="text-slate shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {!nearbyLoading && nearbyTeams.map((t, index) => (
                <button key={t.teamId} onClick={() => handleAssign(showAssignModal, t.teamId)}
                  className={`flex items-center justify-between w-full p-3 rounded-md border transition-colors ${
                    index < 3 ? 'border-primary bg-primary/5 hover:bg-primary/10' : 'border-hairline hover:bg-surface'
                  }`}>
                  <div className="text-left">
                    <p className="text-sm font-medium text-ink flex items-center gap-2">
                      {t.teamName}
                      {index === 0 && <span className="badge-green !py-0.5 !px-1.5 !text-[9px]">Gần nhất</span>}
                    </p>
                    <p className="text-xs text-slate">{t.memberCount} thành viên · {t.contactPhone}</p>
                    {t.teamLeaderName && (
                      <p className="text-xs text-slate">Trưởng đội: {t.teamLeaderName}</p>
                    )}
                    <p className="text-xs text-primary font-medium mt-0.5 flex items-center gap-1">
                      <MapPin size={12}/> {t.distanceDisplay || `~${t.distanceKm} km`}
                    </p>
                    {t.vehicleNames && t.vehicleNames.length > 0 && (
                      <p className="text-[10px] text-brand-teal font-medium mt-1">
                        🚛 {t.vehicleNames.join(", ")}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={14} className="text-slate shrink-0" />
                </button>
              ))}
            </div>
            <div className="mt-6">
              <button onClick={() => { setShowAssignModal(null); setNearbyTeams([]); }} className="btn-secondary w-full">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Modal - upload ảnh minh chứng thực sự */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="card w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-base font-semibold text-ink mb-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-brand-green" /> Báo cáo hoàn thành cứu hộ
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Ghi chú kết quả</label>
                <textarea
                  className="input-field h-20 resize-none"
                  placeholder="Mô tả tình trạng sau cứu hộ, số người được cứu..."
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">
                  Ảnh minh chứng
                  <span className="text-xs text-slate font-normal ml-1">(tùy chọn, tối đa 5 ảnh)</span>
                </label>
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-hairline rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-tint-lavender transition-colors">
                  <ImagePlus size={18} className="text-slate" />
                  <span className="text-sm text-slate">Chọn ảnh từ thiết bị</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []).slice(0, 5);
                      setCompletionFiles(files);
                      setCompletionPreviews(files.map(f => URL.createObjectURL(f)));
                    }}
                  />
                </label>
                {completionPreviews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {completionPreviews.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt={`Ảnh ${i+1}`} className="w-full h-20 object-cover rounded border border-hairline" />
                        <button
                          type="button"
                          onClick={() => {
                            const next = completionFiles.filter((_, idx) => idx !== i);
                            setCompletionFiles(next);
                            setCompletionPreviews(next.map(f => URL.createObjectURL(f)));
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setCompletionModal(null); setCompletionFiles([]); setCompletionPreviews([]); }}
                className="btn-secondary flex-1"
                disabled={completionUploading}
              >Hủy</button>
              <button
                onClick={handleCompletionConfirm}
                className="btn-primary flex-1 !bg-brand-green flex items-center justify-center gap-1"
                disabled={completionUploading}
              >
                {completionUploading ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Đang tải ảnh...</>
                ) : (
                  <><CheckCircle size={14} /> Xác nhận hoàn thành</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View Modal */}
      {selectedRequestDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-2xl p-6 animate-fade-in !bg-canvas !text-ink border border-hairline shadow-xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-hairline pb-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Yêu cầu cứu hộ #{selectedRequestDetails.requestId}</h3>
                <p className="text-xs text-slate mt-0.5">Thời gian gửi: {selectedRequestDetails.createdTime ? new Date(selectedRequestDetails.createdTime).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
              </div>
              <div className="flex gap-2">
                <span className={urgencyBadge[selectedRequestDetails.urgencyLevel] || "badge-soft-purple"}>
                  {selectedRequestDetails.urgencyLevel}
                </span>
                <span className={statusBadge[selectedRequestDetails.status] || "badge-soft-purple"}>
                  {selectedRequestDetails.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">Mô tả tình huống</h4>
                  <p className="text-sm text-ink mt-1 bg-surface-soft p-3 rounded border border-hairline whitespace-pre-wrap leading-relaxed">{selectedRequestDetails.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">Số người cần cứu</h4>
                    <p className="text-sm text-ink font-medium mt-1">{(selectedRequestDetails as any).numberOfPeople || 1} người</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">Mã người dùng</h4>
                    <p className="text-sm text-ink font-medium mt-1">#{selectedRequestDetails.userId}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">Vị trí thực địa</h4>
                  <p className="text-sm text-ink mt-1 flex items-start gap-1">
                    <MapPin size={16} className="text-brand-green shrink-0 mt-0.5" />
                    <span>{selectedRequestDetails.location}</span>
                  </p>
                  {selectedRequestDetails.latitude && selectedRequestDetails.longitude && (
                    <>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            navigate(`/map?focusRequest=${selectedRequestDetails.requestId}&focusTeam=${selectedRequestDetails.assignedTeamId || ""}`);
                          }}
                          className="btn-secondary !py-1 !px-2.5 text-xs border-link text-link hover:bg-link hover:text-white flex items-center gap-1"
                        >
                          <Navigation size={12} /> Dẫn đường tích hợp
                        </button>
                        <span className="text-[10px] text-slate self-center">
                          GPS: {selectedRequestDetails.latitude.toFixed(6)}, {selectedRequestDetails.longitude.toFixed(6)}
                        </span>
                      </div>
                      
                      <div className="mt-3 rounded-lg overflow-hidden border border-hairline-soft h-40 relative z-0 shadow-sm">
                        <MapContainer 
                          center={[selectedRequestDetails.latitude, selectedRequestDetails.longitude]} 
                          zoom={14} 
                          className="w-full h-full"
                          zoomControl={false}
                          dragging={false}
                          scrollWheelZoom={false}
                        >
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                          <Marker position={[selectedRequestDetails.latitude, selectedRequestDetails.longitude]} />
                        </MapContainer>
                        <div className="absolute inset-0 z-[1000] pointer-events-none shadow-[inset_0_0_12px_rgba(0,0,0,0.1)] rounded-lg"></div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wider">Hình ảnh đính kèm</h4>
                  {selectedRequestDetails.image ? (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {selectedRequestDetails.image.split("|||").map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="relative group overflow-hidden rounded border border-hairline shadow-sm hover:border-primary block">
                          <img src={img} alt={`Minh chứng ${i+1}`} className="w-full h-32 object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-0.5 rounded">Xem ảnh lớn</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate italic mt-2 bg-surface p-4 text-center rounded border border-hairline border-dashed">Không có hình ảnh đính kèm</p>
                  )}
                </div>

                <div className="border-t border-hairline pt-4">
                  <h4 className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">Đội cứu hộ đảm nhận</h4>
                  {(() => {
                    const assignedTeam = teams.find(t => t.teamId === selectedRequestDetails.assignedTeamId);
                    if (selectedRequestDetails.assignedTeamName || assignedTeam) {
                      return (
                        <div className="bg-primary/5 border border-primary/20 rounded p-3 text-xs space-y-1.5">
                          <p className="font-semibold text-primary flex items-center gap-1">
                            <UserCheck size={14} /> {selectedRequestDetails.assignedTeamName || assignedTeam?.teamName}
                          </p>
                          {assignedTeam && (
                            <>
                              <p className="text-slate">Số lượng thành viên: {assignedTeam.memberCount} người</p>
                              <p className="text-slate">Số điện thoại liên hệ: {assignedTeam.contactPhone}</p>
                              {assignedTeam.vehicleNames && assignedTeam.vehicleNames.length > 0 && (
                                <p className="text-brand-teal font-medium">🚛 Phương tiện: {assignedTeam.vehicleNames.join(", ")}</p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-slate italic bg-surface p-4 text-center rounded border border-hairline border-dashed">Chưa có đội cứu hộ nào được phân công</p>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="border-t border-hairline pt-4 flex justify-end">
              <button onClick={() => setSelectedRequestDetails(null)} className="btn-secondary min-w-[100px]">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Update Location Modal */}
      {updateLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card w-full max-w-xl p-6 animate-fade-in space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-2">
              <h3 className="text-md font-semibold text-ink flex items-center gap-1.5">
                <MapPin size={16} className="text-brand-purple" /> Cập nhật vị trí hiện tại
              </h3>
              <button type="button" onClick={() => setUpdateLocationModal(null)} className="text-slate hover:text-ink text-sm">Đóng</button>
            </div>
            
            <p className="text-sm text-slate">Vui lòng click lên bản đồ để chọn lại vị trí chính xác của bạn (trong trường hợp đã di chuyển hoặc GPS sai lệch).</p>

            <div className="h-[300px] w-full rounded-md border border-hairline overflow-hidden relative z-0">
              <MapContainer center={[updateLocationModal.lat, updateLocationModal.lng]} zoom={14} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker 
                  position={[updateLocationModal.lat, updateLocationModal.lng]} 
                  setPosition={(pos) => setUpdateLocationModal({ ...updateLocationModal, lat: pos[0], lng: pos[1] })} 
                />
              </MapContainer>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-hairline">
              <button type="button" onClick={() => setUpdateLocationModal(null)} className="btn-secondary">Hủy</button>
              <button type="button" onClick={async () => {
                try {
                  await rescueApi.updateLocation(updateLocationModal.id, { latitude: updateLocationModal.lat, longitude: updateLocationModal.lng });
                  alert("Cập nhật vị trí thành công!");
                  setUpdateLocationModal(null);
                  load();
                } catch {
                  alert("Cập nhật vị trí thất bại.");
                }
              }} className="btn-primary">Lưu vị trí mới</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



