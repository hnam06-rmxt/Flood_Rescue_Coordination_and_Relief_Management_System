import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, useMapEvents, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { rescueApi, shelterApi, teamApi } from "../services/apiService";
import type { RescueRequest, Shelter, RescueTeam } from "../types/rescue";
import { LifeBuoy, Shield, Layers, Truck, TriangleAlert, MapPin, Navigation, Clock, Users, Phone } from "lucide-react";
import { useUserStore } from "../hooks/useUserStore";
import { useSearchParams } from "react-router-dom";
import { useDrivingRoute } from "../hooks/useDrivingRoute";
import { RoadRoutePolyline } from "../components/RoadRoutePolyline";
import type { LatLngTuple } from "../services/routingService";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Premium Vector SVGs in L.divIcon
const rescueIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 rounded-full bg-red-500 opacity-40 animate-ping"></div>
      <div class="relative w-9 h-9 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-life-buoy"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const teamIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-10 h-10 rounded-full bg-blue-500 opacity-30 animate-pulse"></div>
      <div class="relative w-9 h-9 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><circle cx="7.5" cy="18.5" r="2.5"/><path d="M10.5 18.5h4"/><path d="M14 10.5h8.25a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-.75.75H20"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const shelterIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="relative w-9 h-9 rounded-full bg-emerald-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const myLocationIcon = L.divIcon({
  className: "custom-div-icon",
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute w-12 h-12 rounded-full bg-violet-500 opacity-40 animate-ping"></div>
      <div class="relative w-9 h-9 rounded-full bg-violet-600 border-2 border-white shadow-lg flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
      </div>
    </div>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

function FitBounds({ positions, disabled }: { positions: [number, number][], disabled?: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0 && !disabled) {
      map.fitBounds(positions, { padding: [50, 50], maxZoom: 13 });
    }
  }, [map, positions, disabled]);
  return null;
}

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, { animate: true, duration: 1.5 });
    }
  }, [map, position]);
  return null;
}

function FitRouteBounds({ positions }: { positions: LatLngTuple[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(positions, { padding: [60, 60], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

function MapDrawHandler({ isDrawing, onAddPoint, onFinish }: any) {
  useMapEvents({
    click(e) {
      if (!isDrawing) return;
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
    contextmenu(e) {
      e.originalEvent.preventDefault();
      if (isDrawing) onFinish();
    }
  });
  return null;
}

export function MapPage() {
  const profile = useUserStore(s => s.profile);
  const isAdmin = profile?.role === "ADMIN" || profile?.role === "COORDINATOR";
  const [searchParams, setSearchParams] = useSearchParams();
  const focusRequestId = searchParams.get("focusRequest");
  const [focusPosition, setFocusPosition] = useState<[number, number] | null>(null);

  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);

  useEffect(() => {
    if (focusRequestId && requests.length > 0) {
      const req = requests.find(r => r.requestId === Number(focusRequestId));
      if (req && req.latitude && req.longitude) {
        setFocusPosition([req.latitude, req.longitude]);
      }
    }
  }, [focusRequestId, requests]);
  
  const [showRequests, setShowRequests] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showTeams, setShowTeams] = useState(true);

  // My Location
  const [myLocation, setMyLocation] = useState<[number, number] | null>(null);

  // Geo-fencing state
  const [dangerZones, setDangerZones] = useState<[number, number][][]>([]);
  const [drawingZone, setDrawingZone] = useState<[number, number][]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const locateMe = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt không hỗ trợ GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLocation([pos.coords.latitude, pos.coords.longitude]),
      () => alert("Không thể lấy vị trí hiện tại."),
      { enableHighAccuracy: true }
    );
  };

  const loadData = () => {
    rescueApi.getAll().then(setRequests).catch(() => {});
    shelterApi.getAll().then(setShelters).catch(() => {});
    teamApi.getAll().then(setTeams).catch(() => {});
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Tự động refresh mỗi 10s (Live Dashboard)
    return () => clearInterval(interval);
  }, []);

  const getNearestTeamOrShelter = (req: RescueRequest) => {
    let closestPos: [number, number] | null = null;
    let minDistance = Infinity;
    let sourceName = "";

    // Check teams
    teams.forEach(t => {
      if (t.latitude && t.longitude) {
        const d = Math.pow(t.latitude - req.latitude, 2) + Math.pow(t.longitude - req.longitude, 2);
        if (d < minDistance) {
          minDistance = d;
          closestPos = [t.latitude, t.longitude];
          sourceName = `Đội cứu hộ: ${t.teamName}`;
        }
      }
    });

    // Check shelters
    shelters.forEach(s => {
      if (s.latitude && s.longitude) {
        const d = Math.pow(s.latitude - req.latitude, 2) + Math.pow(s.longitude - req.longitude, 2);
        if (d < minDistance) {
          minDistance = d;
          closestPos = [s.latitude, s.longitude];
          sourceName = `Trạm lánh nạn: ${s.name}`;
        }
      }
    });

    return { position: closestPos, name: sourceName };
  };

  const focusRouteEndpoints = useMemo(() => {
    if (!focusRequestId) {
      return { from: null as LatLngTuple | null, to: null as LatLngTuple | null, originName: "" };
    }
    const targetReq = requests.find((r) => r.requestId === Number(focusRequestId));
    if (!targetReq?.latitude || !targetReq?.longitude) {
      return { from: null, to: null, originName: "" };
    }

    const to: LatLngTuple = [targetReq.latitude, targetReq.longitude];
    const team = teams.find((t) => t.teamId === targetReq.assignedTeamId);
    if (team?.latitude && team?.longitude) {
      return {
        from: [team.latitude, team.longitude] as LatLngTuple,
        to,
        originName: `Đội phản ứng nhanh: ${team.teamName}`,
      };
    }
    if (myLocation) {
      return { from: myLocation, to, originName: "Vị trí GPS của bạn" };
    }
    const nearest = getNearestTeamOrShelter(targetReq);
    if (nearest.position) {
      return { from: nearest.position, to, originName: `${nearest.name} (Tài nguyên gần nhất)` };
    }
    return { from: null, to, originName: "" };
  }, [focusRequestId, requests, teams, myLocation, shelters]);

  const focusRoute = useDrivingRoute(focusRouteEndpoints.from, focusRouteEndpoints.to);

  const allPositions: [number, number][] = [
    ...(showRequests ? requests.filter(r => r.latitude && r.longitude).map(r => [r.latitude, r.longitude] as [number, number]) : []),
    ...(showShelters ? shelters.filter(s => s.latitude && s.longitude).map(s => [s.latitude, s.longitude] as [number, number]) : []),
    ...(showTeams ? teams.filter(t => t.latitude && t.longitude).map(t => [t.latitude, t.longitude] as [number, number]) : []),
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <style>{`
        .leaflet-container {
          font-family: 'Outfit', 'Inter', sans-serif;
          border-radius: 8px;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash {
          animation: dash 1.2s linear infinite;
        }
        .custom-div-icon {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          padding: 4px !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important;
        }
        .leaflet-popup-tip {
          background: white !important;
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink flex items-center gap-2">Bản đồ Giám sát Trực quan <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span></span></h1>
          <p className="text-sm text-slate">Cập nhật thời gian thực vị trí cứu hộ, lộ trình tác chiến và điểm lánh nạn</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <button onClick={() => {
              if (isDrawing) { setDangerZones([...dangerZones, drawingZone]); setDrawingZone([]); setIsDrawing(false); }
              else { setIsDrawing(true); alert("Click chuột lên bản đồ để vẽ các điểm của vùng nguy hiểm. Click chuột phải để kết thúc vùng vẽ."); }
            }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${isDrawing ? "bg-brand-orange-deep text-white shadow-md animate-pulse" : "bg-surface text-slate border border-hairline hover:bg-surface-soft"}`}>
              <TriangleAlert size={14} /> {isDrawing ? "Hoàn tất vẽ" : "Khoanh vùng đỏ"}
            </button>
          )}
          <button onClick={() => setShowRequests(!showRequests)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${showRequests ? "bg-semantic-error/10 text-semantic-error font-bold" : "bg-surface text-slate border border-hairline hover:bg-surface-soft"}`}>
            <LifeBuoy size={14} /> Cứu hộ
          </button>
          <button onClick={() => setShowTeams(!showTeams)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${showTeams ? "bg-link/10 text-link font-bold" : "bg-surface text-slate border border-hairline hover:bg-surface-soft"}`}>
            <Truck size={14} /> Đội cứu hộ
          </button>
          <button onClick={() => setShowShelters(!showShelters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${showShelters ? "bg-semantic-success/10 text-semantic-success font-bold" : "bg-surface text-slate border border-hairline hover:bg-surface-soft"}`}>
            <Shield size={14} /> Điểm an toàn
          </button>
          <button onClick={locateMe}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-brand-purple text-brand-purple hover:bg-tint-lavender`}>
            <Navigation size={14} /> Vị trí của tôi
          </button>
        </div>
      </div>

      <div className="card overflow-hidden relative" style={{ height: "calc(100vh - 200px)" }}>
        <MapContainer center={[16.047079, 108.206230]} zoom={6} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allPositions} disabled={myLocation !== null || focusPosition !== null} />
          <FlyToLocation position={myLocation} />
          <FlyToLocation position={focusPosition} />
          {focusRoute.isRoadRoute && focusRoute.positions.length >= 2 && (
            <FitRouteBounds positions={focusRoute.positions} />
          )}

          {myLocation && (
            <Marker position={myLocation} icon={myLocationIcon}>
              <Popup>
                <div className="font-semibold text-brand-purple flex items-center gap-1 p-1">
                  <MapPin size={14} className="animate-bounce" /> Bạn đang ở đây (GPS)
                </div>
              </Popup>
            </Marker>
          )}

          {showRequests && requests.filter(r => r.latitude && r.longitude).map(req => (
            <Marker key={`req-${req.requestId}`} position={[req.latitude, req.longitude]} icon={rescueIcon}>
              <Popup>
                <div className="min-w-[240px] max-w-[280px] p-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      req.urgencyLevel === "CRITICAL" ? "bg-red-100 text-red-700 border border-red-200 animate-pulse" :
                      req.urgencyLevel === "HIGH" ? "bg-orange-100 text-orange-700 border border-orange-200" :
                      req.urgencyLevel === "MEDIUM" ? "bg-blue-100 text-blue-700 border border-blue-200" :
                      "bg-green-100 text-green-700 border border-green-200"
                    }`}>
                      {req.urgencyLevel}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      req.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      req.status === "ASSIGNED" ? "bg-indigo-100 text-indigo-800" :
                      req.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800 animate-pulse" :
                      req.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {req.status === "PENDING" ? "Chờ xử lý" :
                       req.status === "ASSIGNED" ? "Đã giao việc" :
                       req.status === "IN_PROGRESS" ? "Đang giải cứu" :
                       req.status === "COMPLETED" ? "Hoàn thành" : "Đã hủy"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-ink">
                    <p className="text-sm font-semibold mb-1 text-ink-deep leading-snug">{req.description}</p>
                    <p className="text-[11px] text-slate flex items-start gap-1">
                      <span className="mt-0.5">📍</span>
                      <span className="break-words">{req.location}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-hairline text-[11px]">
                      <div>
                        <span className="text-slate block">Số người kẹt:</span>
                        <strong className="text-red-600 text-xs font-bold">👥 {req.numberOfPeople || 1} người</strong>
                      </div>
                      <div>
                        <span className="text-slate block">Thời gian nhận:</span>
                        <span className="text-slate-700 block flex items-center gap-0.5 font-medium">
                          <Clock size={10} />
                          {req.createdTime ? new Date(req.createdTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : "N/A"}
                        </span>
                      </div>
                    </div>
                    {req.assignedTeamName && (
                      <div className="bg-tint-lavender p-2 rounded text-[11px] mt-2 border border-hairline-soft">
                        <span className="text-slate block text-[10px]">Đội cứu hộ phụ trách:</span>
                        <strong className="text-primary flex items-center gap-1 font-bold">🚑 {req.assignedTeamName}</strong>
                      </div>
                    )}
                    {req.image && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[10px] text-slate block">Hình ảnh hiện trường:</span>
                        <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-md border border-hairline max-h-20">
                          {req.image.split("|||").map((img, i) => (
                            <img key={i} src={img} alt="Hiện trường" className="w-full h-12 object-cover aspect-video hover:scale-105 transition-transform cursor-pointer" onClick={() => window.open(img, '_blank')} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {showTeams && teams.filter(t => t.latitude && t.longitude).map(team => (
            <Marker key={`team-${team.teamId}`} position={[team.latitude, team.longitude]} icon={teamIcon}>
              <Popup>
                <div className="min-w-[240px] max-w-[280px] p-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-blue-700 flex items-center gap-1">
                      <Truck size={14} /> {team.teamName}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      team.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      team.status === "BUSY" ? "bg-amber-100 text-amber-700 animate-pulse" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {team.status === "ACTIVE" ? "Rảnh rỗi" : team.status === "BUSY" ? "Đang tác chiến" : "Ngoại tuyến"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-ink">
                    {team.contactPhone && (
                      <p className="flex items-center gap-1">
                        <Phone size={12} className="text-slate" />
                        <a href={`tel:${team.contactPhone}`} className="text-link hover:underline font-bold">{team.contactPhone}</a>
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-slate">
                      <Users size={12} />
                      <span>Lực lượng: <strong>{team.memberCount} thành viên</strong></span>
                    </p>
                    {team.vehicleNames && team.vehicleNames.length > 0 && (
                      <div className="bg-blue-50/50 p-2 rounded border border-blue-100 mt-2">
                        <span className="text-[10px] text-slate block font-medium">Phương tiện cấp phát:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {team.vehicleNames.map((v, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-semibold border border-blue-200">
                              🚢 {v}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {team.currentLocation && (
                      <p className="text-[11px] text-slate mt-1.5 pt-1.5 border-t border-hairline flex items-start gap-1">
                        <span>📍</span>
                        <span className="break-words"><strong>Vị trí:</strong> {team.currentLocation}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {showShelters && shelters.filter(s => s.latitude && s.longitude).map(shelter => (
            <Marker key={`shelter-${shelter.id}`} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon}>
              <Popup>
                <div className="min-w-[240px] max-w-[280px] p-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-brand-green flex items-center gap-1">
                      <Shield size={14} /> {shelter.name}
                    </h3>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      shelter.status === "OPEN" ? "bg-green-100 text-green-700" :
                      shelter.status === "FULL" ? "bg-red-100 text-red-700 animate-pulse" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {shelter.status === "OPEN" ? "Còn chỗ" : shelter.status === "FULL" ? "Quá tải" : "Đóng cửa"}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs text-ink">
                    <p className="text-[11px] text-slate flex items-start gap-1">
                      <span>📍</span>
                      <span className="break-words">{shelter.location}</span>
                    </p>
                    <div className="flex gap-4 text-xs font-medium mt-1">
                      <span>Sức chứa: <strong>{shelter.capacity}</strong></span>
                      <span>Đang ở: <strong>{shelter.currentOccupancy}</strong></span>
                    </div>

                    {(() => {
                      const percent = Math.min(100, Math.round((shelter.currentOccupancy / shelter.capacity) * 100));
                      const barColor = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-amber-500" : "bg-emerald-500";
                      const textColor = percent >= 90 ? "text-red-600" : percent >= 70 ? "text-amber-600" : "text-emerald-600";
                      return (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[11px] font-medium">
                            <span className="text-slate">Hiệu suất sử dụng:</span>
                            <span className={`${textColor} font-bold`}>{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      );
                    })()}

                    {shelter.contactInfo && (
                      <p className="text-[11px] text-slate mt-2 pt-2 border-t border-hairline flex items-center gap-1">
                        <Phone size={11} /> <strong>Liên hệ:</strong> {shelter.contactInfo}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Lộ trình đội → ca SOS (theo đường lái xe OSRM) */}
          {showRequests && showTeams && requests
            .filter(r => r.latitude && r.longitude && r.assignedTeamId && (r.status === "IN_PROGRESS" || r.status === "ASSIGNED"))
            .filter(r => r.requestId !== Number(focusRequestId))
            .map(req => {
              const team = teams.find(t => t.teamId === req.assignedTeamId);
              if (team?.latitude && team?.longitude) {
                return (
                  <RoadRoutePolyline
                    key={`route-${req.requestId}-${team.teamId}`}
                    from={[team.latitude, team.longitude]}
                    to={[req.latitude, req.longitude]}
                    pathOptions={{
                      color: "#2563eb",
                      weight: 4,
                      dashArray: "10, 10",
                      className: "animate-dash",
                      opacity: 0.75,
                    }}
                    popupContent={
                      <div className="text-xs p-1 font-sans">
                        Đội <strong>{team.teamName}</strong> → ca SOS <strong>#{req.requestId}</strong> (theo đường)
                      </div>
                    }
                  />
                );
              }
              return null;
            })}

          {/* Lộ trình chỉ đường tác chiến (OSRM — uốn theo đường thực tế) */}
          {focusRoute.positions.length >= 2 && (
            <>
              <Polyline
                positions={focusRoute.positions}
                pathOptions={{
                  color: "#f43f5e",
                  weight: 7,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />
              <Polyline
                positions={focusRoute.positions}
                pathOptions={{
                  color: "#ffffff",
                  weight: 5,
                  dashArray: "12, 12",
                  className: "animate-dash",
                  opacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-sans">
                    {focusRoute.isRoadRoute ? "Lộ trình lái xe" : "Lộ trình ước lượng"} từ{" "}
                    <strong>{focusRouteEndpoints.originName}</strong> đến ca SOS{" "}
                    <strong>#{focusRequestId}</strong>
                    {focusRoute.distanceKm != null && (
                      <>
                        <br />
                        ~{focusRoute.distanceKm} km · ~{focusRoute.durationMin} phút
                      </>
                    )}
                  </div>
                </Popup>
              </Polyline>
              <Polyline
                positions={focusRoute.positions}
                pathOptions={{ color: "#ffe4e6", weight: 2, opacity: 1 }}
              />
            </>
          )}

          {/* Vùng nguy hiểm (Geo-fencing) */}
          {dangerZones.map((zone, idx) => (
             <Polygon key={`danger-${idx}`} positions={zone} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.25, weight: 2 }} />
          ))}
          {isDrawing && drawingZone.length > 0 && (
             <Polygon positions={drawingZone} pathOptions={{ color: '#f97316', dashArray: '5, 5' }} />
          )}
          <MapDrawHandler isDrawing={isDrawing} 
            onAddPoint={(pt: [number, number]) => setDrawingZone([...drawingZone, pt])} 
            onFinish={() => { 
              if (drawingZone.length > 2) {
                setDangerZones([...dangerZones, drawingZone]); 
              }
              setDrawingZone([]); 
              setIsDrawing(false); 
            }} 
          />
        </MapContainer>

        {/* Floating Navigation Card (Tactical Command Overlay) */}
        {(() => {
          if (!focusRequestId) return null;
          const targetReq = requests.find(r => r.requestId === Number(focusRequestId));
          if (!targetReq) return null;
          return (
            <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-brand-orange-deep shadow-mockup rounded-lg p-4 max-w-sm animate-fade-in space-y-2">
              <div className="flex justify-between items-center border-b border-hairline pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-orange-deep flex items-center gap-1.5 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                  Chỉ đường tác chiến SOS #{targetReq.requestId}
                </h3>
                <button 
                  onClick={() => {
                    setSearchParams({});
                    setFocusPosition(null);
                  }}
                  className="text-slate hover:text-ink text-xs font-medium border border-hairline rounded px-1.5 py-0.5 hover:bg-surface transition-colors"
                >
                  Đóng
                </button>
              </div>
              <div className="text-xs space-y-1.5">
                <p className="font-semibold text-ink-deep text-sm leading-snug">{targetReq.description}</p>
                <p className="text-slate flex items-start gap-0.5">
                  <span>📍</span>
                  <span>{targetReq.location}</span>
                </p>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-red-600 font-bold">👥 Cần cứu: {targetReq.numberOfPeople} người</span>
                  <span className="text-[10px] text-slate">Thời điểm: {targetReq.createdTime ? new Date(targetReq.createdTime).toLocaleTimeString("vi-VN", {hour: '2-digit', minute:'2-digit'}) : "N/A"}</span>
                </div>
                {focusRoute.loading && (
                  <p className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <Clock size={12} className="animate-spin" /> Đang tính lộ trình theo đường...
                  </p>
                )}
                {!focusRoute.loading && focusRoute.isRoadRoute && focusRoute.distanceKm != null && (
                  <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                    🛣️ ~{focusRoute.distanceKm} km · ~{focusRoute.durationMin} phút (đường lái xe)
                  </p>
                )}
                {!focusRoute.loading && !focusRoute.isRoadRoute && focusRouteEndpoints.from && (
                  <p className="text-[11px] text-amber-700">Đường thẳng (OSRM tạm không phản hồi)</p>
                )}
                {(() => {
                  const team = teams.find(t => t.teamId === targetReq.assignedTeamId);
                  if (team) {
                    return (
                      <div className="mt-2 bg-blue-50/50 p-2 rounded border border-blue-100 space-y-1">
                        <span className="text-[10px] text-slate block font-medium">Đội cứu hộ phụ trách:</span>
                        <strong className="text-blue-700 flex items-center gap-1 font-bold">🚑 {team.teamName}</strong>
                        <p className="text-[10px] text-slate">📞 Liên hệ: {team.contactPhone}</p>
                      </div>
                    );
                  } else {
                    return (
                      <p className="text-amber-600 font-semibold mt-1">⚠️ Chưa phân công đội phản ứng nhanh.</p>
                    );
                  }
                })()}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap items-center gap-6 justify-center sm:justify-start">
        <div className="flex items-center gap-2 text-xs">
          <Layers size={14} className="text-slate" />
          <span className="font-semibold text-ink">Chú thích chỉ huy:</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white border border-white shadow">
            <span className="absolute w-8 h-8 rounded-full bg-red-500 opacity-30 animate-pulse"></span>
            <span className="text-[10px]">🆘</span>
          </span>
          <span>SOS Cần cứu hộ</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white border border-white shadow">
            <span className="text-[10px]">🚢</span>
          </span>
          <span>Đội phản ứng nhanh</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white border border-white shadow">
            <span className="text-[10px]">🛡️</span>
          </span>
          <span>Trạm trú ẩn an toàn</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white border border-white shadow">
            <span className="absolute w-8 h-8 rounded-full bg-violet-500 opacity-40 animate-ping"></span>
            <span className="text-[10px]">📍</span>
          </span>
          <span>Vị trí của bạn (GPS)</span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="w-6 h-4 bg-red-500/25 border border-red-500 rounded"></div>
          <span>Vùng ngập lụt nguy hại</span>
        </div>
        
        <div className="flex items-center gap-2 text-xs border-l border-hairline pl-4">
          <span className="w-3 h-0.5 bg-blue-500 border-t border-dashed border-blue-500 w-6"></span>
          <span>Lộ trình tiếp cận</span>
        </div>
      </div>
    </div>
  );
}
