import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { rescueApi, shelterApi, teamApi } from "../services/apiService";
import type { RescueRequest, Shelter, RescueTeam } from "../types/rescue";
import { LifeBuoy, Shield, Layers, Truck, TriangleAlert, MapPin, Navigation } from "lucide-react";
import { useUserStore } from "../hooks/useUserStore";

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const rescueIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const teamIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const shelterIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const myLocationIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const urgencyColors: Record<string, string> = {
  CRITICAL: "bg-semantic-error", HIGH: "bg-brand-orange-deep", MEDIUM: "bg-link", LOW: "bg-semantic-success",
};

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

  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  
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

  const allPositions: [number, number][] = [
    ...(showRequests ? requests.filter(r => r.latitude && r.longitude).map(r => [r.latitude, r.longitude] as [number, number]) : []),
    ...(showShelters ? shelters.filter(s => s.latitude && s.longitude).map(s => [s.latitude, s.longitude] as [number, number]) : []),
    ...(showTeams ? teams.filter(t => t.latitude && t.longitude).map(t => [t.latitude, t.longitude] as [number, number]) : []),
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink flex items-center gap-2">Bản đồ Giám sát Trực quan <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span></span></h1>
          <p className="text-sm text-slate">Cập nhật thời gian thực vị trí cứu hộ, điểm an toàn và đội hình</p>
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
              ${showRequests ? "bg-semantic-error/10 text-semantic-error" : "bg-surface text-slate border border-hairline"}`}>
            <LifeBuoy size={14} /> Cứu hộ
          </button>
          <button onClick={() => setShowTeams(!showTeams)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${showTeams ? "bg-link/10 text-link" : "bg-surface text-slate border border-hairline"}`}>
            <Truck size={14} /> Đội cứu hộ
          </button>
          <button onClick={() => setShowShelters(!showShelters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${showShelters ? "bg-semantic-success/10 text-semantic-success" : "bg-surface text-slate border border-hairline"}`}>
            <Shield size={14} /> Điểm an toàn
          </button>
          <button onClick={locateMe}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors border border-brand-purple text-brand-purple hover:bg-tint-lavender`}>
            <Navigation size={14} /> Vị trí của tôi
          </button>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <MapContainer center={[16.047079, 108.206230]} zoom={6} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds positions={allPositions} disabled={myLocation !== null} />
          <FlyToLocation position={myLocation} />

          {myLocation && (
            <Marker position={myLocation} icon={myLocationIcon}>
              <Popup>
                <div className="font-semibold text-brand-purple flex items-center gap-1">
                  <MapPin size={14} /> Bạn đang ở đây
                </div>
              </Popup>
            </Marker>
          )}

          {showRequests && requests.filter(r => r.latitude && r.longitude).map(req => (
            <Marker key={`req-${req.requestId}`} position={[req.latitude, req.longitude]} icon={rescueIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${urgencyColors[req.urgencyLevel] || "bg-slate"} ${req.status === 'PENDING' ? 'animate-ping' : ''}`} />
                    <span className="text-xs font-semibold">{req.urgencyLevel}</span>
                    <span className="text-xs text-slate">·</span>
                    <span className="text-xs font-medium">{req.status}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{req.description}</p>
                  <p className="text-xs text-slate">📍 {req.location}</p>
                  <p className="text-xs font-bold text-semantic-error mt-2">Cần cứu: {req.numberOfPeople || 1} người</p>
                </div>
              </Popup>
            </Marker>
          ))}

          {showTeams && teams.filter(t => t.latitude && t.longitude).map(team => (
            <Marker key={`team-${team.teamId}`} position={[team.latitude, team.longitude]} icon={teamIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <p className="text-sm font-semibold mb-1 text-link">{team.teamName}</p>
                  <p className="text-xs text-slate mb-1">📞 {team.contactPhone}</p>
                  <div className="flex gap-3 text-xs mt-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${team.status === 'ACTIVE' ? 'bg-semantic-success/20 text-semantic-success' : 'bg-brand-orange-deep/20 text-brand-orange-deep'}`}>{team.status}</span>
                    <span>👤 {team.memberCount} thành viên</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {showShelters && shelters.filter(s => s.latitude && s.longitude).map(shelter => (
            <Marker key={`shelter-${shelter.id}`} position={[shelter.latitude, shelter.longitude]} icon={shelterIcon}>
              <Popup>
                <div className="min-w-[200px]">
                  <p className="text-sm font-semibold mb-1">{shelter.name}</p>
                  <p className="text-xs text-slate mb-1">📍 {shelter.location}</p>
                  <div className="flex gap-3 text-xs">
                    <span>Sức chứa: <strong>{shelter.capacity}</strong></span>
                    <span>Đang ở: <strong>{shelter.currentOccupancy}</strong></span>
                  </div>
                  <div className="mt-1">
                    <span className={`text-xs font-medium ${shelter.status === "OPEN" ? "text-brand-green" : "text-semantic-error"}`}>
                      {shelter.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Vùng nguy hiểm (Geo-fencing) */}
          {dangerZones.map((zone, idx) => (
             <Polygon key={`danger-${idx}`} positions={zone} pathOptions={{ color: '#ef4444', fillColor: '#fca5a5', fillOpacity: 0.4 }} />
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
      </div>

      {/* Legend */}
      <div className="card p-4 flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2 text-xs">
          <Layers size={14} className="text-slate" />
          <span className="font-medium text-ink">Chú thích:</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png" className="h-5" />
          <span>Yêu cầu cứu hộ</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png" className="h-5" />
          <span>Đội cứu hộ</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png" className="h-5" />
          <span>Điểm an toàn</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <img src="https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png" className="h-5" />
          <span>Vị trí của bạn</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <div className="w-4 h-4 bg-error/40 border border-error"></div>
          <span>Vùng rủi ro cao</span>
        </div>
        {Object.entries(urgencyColors).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5 text-xs">
            <span className={`w-2.5 h-2.5 rounded-full ${v}`} />
            <span>{k}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
