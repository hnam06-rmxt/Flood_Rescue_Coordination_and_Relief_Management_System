import { useState } from "react";
import { Settings, Save, RotateCcw, MapPin, Package, Bell, Database, Zap, CheckCircle } from "lucide-react";

type SystemConfig = {
  // Rescue Settings
  defaultSearchRadiusKm: number;
  maxNearbyTeamSuggestions: number;
  sosPingIntervalSeconds: number;
  autoAssignNearestTeam: boolean;

  // Inventory Settings
  lowStockWarningThreshold: number;
  defaultMinimumStockLevel: number;
  autoAlertOnLowStock: boolean;

  // Notification Settings
  notificationPollingIntervalMs: number;
  enableEmailNotifications: boolean;
  enableSmsNotifications: boolean;

  // Map Settings
  defaultMapLatitude: number;
  defaultMapLongitude: number;
  defaultMapZoom: number;

  // System Settings
  sessionTimeoutMinutes: number;
  maxUploadSizeMb: number;
  maintenanceMode: boolean;
};

const defaultConfig: SystemConfig = {
  defaultSearchRadiusKm: 50,
  maxNearbyTeamSuggestions: 5,
  sosPingIntervalSeconds: 30,
  autoAssignNearestTeam: false,
  lowStockWarningThreshold: 10,
  defaultMinimumStockLevel: 20,
  autoAlertOnLowStock: true,
  notificationPollingIntervalMs: 5000,
  enableEmailNotifications: false,
  enableSmsNotifications: false,
  defaultMapLatitude: 16.047079,
  defaultMapLongitude: 108.206230,
  defaultMapZoom: 12,
  sessionTimeoutMinutes: 15,
  maxUploadSizeMb: 10,
  maintenanceMode: false,
};

function SettingGroup({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <div><h3 className="text-sm font-semibold text-ink">{title}</h3><p className="text-xs text-slate">{description}</p></div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function NumberInput({ label, value, onChange, unit, min, max }: { label: string; value: number; onChange: (v: number) => void; unit?: string; min?: number; max?: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-sm text-ink font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input type="number" value={value} onChange={e => onChange(+e.target.value)} min={min} max={max}
          className="input-field w-24 text-center text-sm" />
        {unit && <span className="text-xs text-slate font-medium w-12">{unit}</span>}
      </div>
    </div>
  );
}

function ToggleSwitch({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-ink font-medium">{label}</p>
        {description && <p className="text-xs text-slate mt-0.5">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-gray-300"}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${checked ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

export function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>(() => {
    try {
      const saved = localStorage.getItem("flood_rescue_system_config");
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch { return defaultConfig; }
  });
  const [saved, setSaved] = useState(false);

  function updateConfig<K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) {
    setConfig(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem("flood_rescue_system_config", JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function handleReset() {
    if (!confirm("Bạn có chắc muốn khôi phục tất cả về cấu hình mặc định?")) return;
    setConfig(defaultConfig);
    localStorage.removeItem("flood_rescue_system_config");
    setSaved(false);
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink flex items-center gap-2">
            <Settings size={22} className="text-primary" /> Cấu hình hệ thống
          </h1>
          <p className="text-sm text-slate">Tùy chỉnh tham số và danh mục hệ thống</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="btn-secondary flex items-center gap-1.5 text-xs">
            <RotateCcw size={14} /> Khôi phục mặc định
          </button>
          <button onClick={handleSave} className={`btn-primary flex items-center gap-1.5 text-xs ${saved ? "!bg-emerald-600" : ""}`}>
            {saved ? <><CheckCircle size={14} /> Đã lưu!</> : <><Save size={14} /> Lưu cấu hình</>}
          </button>
        </div>
      </div>

      {/* Rescue Settings */}
      <SettingGroup icon={<Zap size={18} />} title="Cứu hộ & Điều phối" description="Cấu hình tham số liên quan đến điều phối cứu hộ">
        <NumberInput label="Bán kính tìm kiếm mặc định" value={config.defaultSearchRadiusKm} onChange={v => updateConfig("defaultSearchRadiusKm", v)} unit="km" min={1} max={500} />
        <NumberInput label="Số đội gợi ý tối đa" value={config.maxNearbyTeamSuggestions} onChange={v => updateConfig("maxNearbyTeamSuggestions", v)} unit="đội" min={1} max={20} />
        <NumberInput label="Chu kỳ ping SOS" value={config.sosPingIntervalSeconds} onChange={v => updateConfig("sosPingIntervalSeconds", v)} unit="giây" min={5} max={300} />
        <ToggleSwitch label="Tự động gán đội gần nhất" description="Hệ thống tự động gán đội cứu hộ ACTIVE gần nhất cho yêu cầu mới" checked={config.autoAssignNearestTeam} onChange={v => updateConfig("autoAssignNearestTeam", v)} />
      </SettingGroup>

      {/* Inventory Settings */}
      <SettingGroup icon={<Package size={18} />} title="Kho hàng cứu trợ" description="Ngưỡng cảnh báo và tham số quản lý tồn kho">
        <NumberInput label="Ngưỡng cảnh báo tồn kho thấp" value={config.lowStockWarningThreshold} onChange={v => updateConfig("lowStockWarningThreshold", v)} unit="đv" min={1} max={1000} />
        <NumberInput label="Tồn kho tối thiểu mặc định" value={config.defaultMinimumStockLevel} onChange={v => updateConfig("defaultMinimumStockLevel", v)} unit="đv" min={1} max={1000} />
        <ToggleSwitch label="Tự động cảnh báo hết hàng" description="Gửi thông báo cho Manager khi hàng cứu trợ dưới ngưỡng tối thiểu" checked={config.autoAlertOnLowStock} onChange={v => updateConfig("autoAlertOnLowStock", v)} />
      </SettingGroup>

      {/* Notification Settings */}
      <SettingGroup icon={<Bell size={18} />} title="Thông báo" description="Cấu hình kênh và tần suất thông báo">
        <NumberInput label="Chu kỳ kiểm tra thông báo" value={config.notificationPollingIntervalMs} onChange={v => updateConfig("notificationPollingIntervalMs", v)} unit="ms" min={1000} max={60000} />
        <ToggleSwitch label="Thông báo qua Email" description="Gửi email khi có yêu cầu cứu hộ mới hoặc thay đổi trạng thái" checked={config.enableEmailNotifications} onChange={v => updateConfig("enableEmailNotifications", v)} />
        <ToggleSwitch label="Thông báo qua SMS" description="Gửi tin nhắn SMS cho đội cứu hộ khi được phân công nhiệm vụ" checked={config.enableSmsNotifications} onChange={v => updateConfig("enableSmsNotifications", v)} />
      </SettingGroup>

      {/* Map Settings */}
      <SettingGroup icon={<MapPin size={18} />} title="Bản đồ" description="Vị trí mặc định và zoom khi mở bản đồ">
        <NumberInput label="Vĩ độ mặc định (Latitude)" value={config.defaultMapLatitude} onChange={v => updateConfig("defaultMapLatitude", v)} unit="°" />
        <NumberInput label="Kinh độ mặc định (Longitude)" value={config.defaultMapLongitude} onChange={v => updateConfig("defaultMapLongitude", v)} unit="°" />
        <NumberInput label="Mức zoom mặc định" value={config.defaultMapZoom} onChange={v => updateConfig("defaultMapZoom", v)} unit="level" min={1} max={18} />
      </SettingGroup>

      {/* System Settings */}
      <SettingGroup icon={<Database size={18} />} title="Hệ thống" description="Tham số bảo mật và vận hành hệ thống">
        <NumberInput label="Thời gian timeout phiên" value={config.sessionTimeoutMinutes} onChange={v => updateConfig("sessionTimeoutMinutes", v)} unit="phút" min={5} max={480} />
        <NumberInput label="Dung lượng upload tối đa" value={config.maxUploadSizeMb} onChange={v => updateConfig("maxUploadSizeMb", v)} unit="MB" min={1} max={100} />
        <ToggleSwitch label="Chế độ bảo trì" description="Bật chế độ bảo trì — chỉ Admin mới truy cập được hệ thống" checked={config.maintenanceMode} onChange={v => updateConfig("maintenanceMode", v)} />
      </SettingGroup>
    </div>
  );
}
