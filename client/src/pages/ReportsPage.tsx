import { useEffect, useState } from "react";
import { FileBarChart, Download, Users, Truck, Package, TrendingUp, Clock, CheckCircle, AlertTriangle, BarChart3, Activity } from "lucide-react";
import { rescueApi, teamApi, vehicleApi, reliefApi } from "../services/apiService";
import type { RescueRequest, RescueTeam, RescueVehicle, ReliefItem, ReliefDistribution } from "../types/rescue";

type DateRange = "all" | "7d" | "30d" | "90d";

function filterByDate<T>(items: T[], dateField: keyof T, range: DateRange): T[] {
  if (range === "all") return items;
  const now = new Date();
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return items.filter(item => {
    const val = item[dateField];
    if (!val) return false;
    return new Date(val as string) >= cutoff;
  });
}

function BarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate w-28 shrink-0 truncate" title={d.label}>{d.label}</span>
          <div className="flex-1 h-7 bg-surface rounded-full overflow-hidden relative">
            <div className={`h-full rounded-full transition-all duration-700 ${d.color}`}
              style={{ width: `${maxVal > 0 ? (d.value / maxVal) * 100 : 0}%` }} />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-ink">{d.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ segments, total, centerLabel }: { segments: { label: string; value: number; color: string }[]; total: number; centerLabel: string }) {
  let cumulativePercent = 0;
  const size = 140;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="transform -rotate-90 shrink-0">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const offset = circumference * (1 - pct);
          const rotation = cumulativePercent * 360;
          cumulativePercent += pct;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={radius} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth} strokeDasharray={`${circumference}`}
              strokeDashoffset={offset} strokeLinecap="round"
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${size/2}px ${size/2}px`, transition: "stroke-dashoffset 0.8s ease" }} />
          );
        })}
        <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central" className="text-lg font-bold fill-ink"
          style={{ transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` }}>
          {total}
        </text>
      </svg>
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-slate uppercase tracking-wider mb-2">{centerLabel}</p>
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-slate">{seg.label}</span>
            <span className="text-xs font-semibold text-ink ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [range, setRange] = useState<DateRange>("all");
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [vehicles, setVehicles] = useState<RescueVehicle[]>([]);
  const [reliefItems, setReliefItems] = useState<ReliefItem[]>([]);
  const [distributions, setDistributions] = useState<ReliefDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [reqData, teamData, vehData, itemData, distData] = await Promise.all([
        rescueApi.getAll().catch(() => []),
        teamApi.getAll().catch(() => []),
        vehicleApi.getAll().catch(() => []),
        reliefApi.getItems().catch(() => []),
        reliefApi.getDistributions().catch(() => []),
      ]);
      setRequests(reqData || []);
      setTeams(teamData || []);
      setVehicles(vehData || []);
      setReliefItems(itemData || []);
      setDistributions(distData || []);
    } catch { }
    setLoading(false);
  }

  // Filtered data
  const filteredReqs = filterByDate(requests, "createdTime", range);
  const filteredDists = filterByDate(distributions, "distributedAt", range);

  // === RESCUE STATISTICS ===
  const totalReqs = filteredReqs.length;
  const completedReqs = filteredReqs.filter(r => r.status === "COMPLETED");
  const pendingReqs = filteredReqs.filter(r => r.status === "PENDING");
  const inProgressReqs = filteredReqs.filter(r => r.status === "IN_PROGRESS" || r.status === "ASSIGNED");
  const cancelledReqs = filteredReqs.filter(r => r.status === "CANCELLED");
  const totalSaved = completedReqs.reduce((s, r) => s + (r.numberOfPeople || 1), 0);

  // Average response time
  let avgHours = 0;
  let validCount = 0;
  completedReqs.forEach(r => {
    if (r.createdTime && r.updatedTime) {
      const h = (new Date(r.updatedTime).getTime() - new Date(r.createdTime).getTime()) / (1000 * 60 * 60);
      if (h > 0 && h < 720) { avgHours += h; validCount++; }
    }
  });
  const avgResponseTime = validCount > 0 ? (avgHours / validCount).toFixed(1) : "—";

  // Status donut
  const statusSegments = [
    { label: "Chờ xử lý", value: pendingReqs.length, color: "#f59e0b" },
    { label: "Đang xử lý", value: inProgressReqs.length, color: "#8b5cf6" },
    { label: "Hoàn thành", value: completedReqs.length, color: "#10b981" },
    { label: "Đã hủy", value: cancelledReqs.length, color: "#ef4444" },
  ];

  // Urgency donut
  const urgencyCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  filteredReqs.forEach(r => { if (r.urgencyLevel in urgencyCounts) (urgencyCounts as Record<string, number>)[r.urgencyLevel]++; });
  const urgencySegments = [
    { label: "Nguy cấp", value: urgencyCounts.CRITICAL, color: "#ef4444" },
    { label: "Cao", value: urgencyCounts.HIGH, color: "#f59e0b" },
    { label: "Trung bình", value: urgencyCounts.MEDIUM, color: "#3b82f6" },
    { label: "Thấp", value: urgencyCounts.LOW, color: "#10b981" },
  ];

  // === TEAM PERFORMANCE ===
  const teamPerformance = teams.map(t => {
    const teamReqs = filteredReqs.filter(r => r.assignedTeamId === t.teamId);
    const teamCompleted = teamReqs.filter(r => r.status === "COMPLETED");
    const peopleSaved = teamCompleted.reduce((s, r) => s + (r.numberOfPeople || 1), 0);
    return { name: t.teamName, total: teamReqs.length, completed: teamCompleted.length, peopleSaved };
  }).sort((a, b) => b.completed - a.completed);

  const maxTeamCompleted = Math.max(...teamPerformance.map(t => t.completed), 1);

  // === VEHICLE STATISTICS ===
  const vehicleStatusCounts = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, DECOMMISSIONED: 0 };
  vehicles.forEach(v => { if (v.status in vehicleStatusCounts) (vehicleStatusCounts as Record<string, number>)[v.status]++; });
  const vehicleSegments = [
    { label: "Sẵn sàng", value: vehicleStatusCounts.AVAILABLE, color: "#10b981" },
    { label: "Đang sử dụng", value: vehicleStatusCounts.IN_USE, color: "#8b5cf6" },
    { label: "Bảo trì", value: vehicleStatusCounts.MAINTENANCE, color: "#f59e0b" },
    { label: "Loại bỏ", value: vehicleStatusCounts.DECOMMISSIONED, color: "#ef4444" },
  ];

  // === RELIEF STATISTICS ===
  const totalDistQuantity = filteredDists.reduce((s, d) => s + (d.quantity || 0), 0);
  const totalStockValue = reliefItems.reduce((s, i) => s + i.quantityInStock, 0);
  const lowStockItems = reliefItems.filter(i => i.minimumStockLevel && i.quantityInStock <= i.minimumStockLevel);

  const categoryStock: Record<string, number> = {};
  reliefItems.forEach(i => { categoryStock[i.category] = (categoryStock[i.category] || 0) + i.quantityInStock; });
  const maxCatStock = Math.max(...Object.values(categoryStock), 1);
  const categoryColors = ["bg-blue-500", "bg-emerald-500", "bg-orange-500", "bg-purple-500", "bg-rose-500", "bg-teal-500"];

  // === CSV EXPORT ===
  function exportCSV() {
    const header = "ID,Mô tả,Vị trí,Mức khẩn cấp,Trạng thái,Số người,Đội được gán,Ngày tạo,Ngày cập nhật\n";
    const rows = filteredReqs.map(r =>
      `${r.requestId},"${r.description.replace(/"/g, '""')}","${r.location}",${r.urgencyLevel},${r.status},${r.numberOfPeople || 1},${r.assignedTeamName || ""},${r.createdTime || ""},${r.updatedTime || ""}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `bao-cao-cuu-ho-${range}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink flex items-center gap-2">
            <FileBarChart size={22} className="text-primary" /> Báo cáo tổng hợp
          </h1>
          <p className="text-sm text-slate">Thống kê toàn diện hoạt động cứu hộ – cứu trợ</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-surface rounded-lg p-0.5 border border-hairline">
            {([["all", "Tất cả"], ["7d", "7 ngày"], ["30d", "30 ngày"], ["90d", "90 ngày"]] as [DateRange, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setRange(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${range === key ? "bg-primary text-white shadow-sm" : "text-slate hover:text-ink"}`}>
                {label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="btn-secondary flex items-center gap-1.5 text-xs">
            <Download size={14} /> Xuất CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-2"><BarChart3 size={16} className="text-primary" /><span className="text-[11px] font-semibold text-primary uppercase tracking-wider">Tổng yêu cầu</span></div>
          <p className="text-3xl font-bold text-ink">{totalReqs}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-600" /><span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">Người đã cứu</span></div>
          <p className="text-3xl font-bold text-ink">{totalSaved}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Clock size={16} className="text-violet-600" /><span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wider">Phản ứng TB</span></div>
          <p className="text-3xl font-bold text-ink">{avgResponseTime}<span className="text-base font-medium text-slate ml-1">giờ</span></p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-2"><Package size={16} className="text-orange-600" /><span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Cứu trợ đã phát</span></div>
          <p className="text-3xl font-bold text-ink">{totalDistQuantity}<span className="text-base font-medium text-slate ml-1">đơn vị</span></p>
        </div>
      </div>

      {/* Donut Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2"><Activity size={16} className="text-primary" /> Phân bố trạng thái</h3>
          <DonutChart segments={statusSegments} total={totalReqs} centerLabel="Yêu cầu" />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Mức độ khẩn cấp</h3>
          <DonutChart segments={urgencySegments} total={totalReqs} centerLabel="Phân loại" />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2"><Truck size={16} className="text-violet-500" /> Tình trạng phương tiện</h3>
          <DonutChart segments={vehicleSegments} total={vehicles.length} centerLabel="Phương tiện" />
        </div>
      </div>

      {/* Team Performance */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Users size={16} className="text-blue-500" /> Hiệu suất đội cứu hộ
        </h3>
        {teamPerformance.length === 0 ? (
          <p className="text-sm text-slate text-center py-4">Chưa có dữ liệu đội cứu hộ</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface">
                <tr className="text-left text-xs font-medium text-slate uppercase tracking-wider">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Đội</th>
                  <th className="px-4 py-3">Nhiệm vụ</th>
                  <th className="px-4 py-3">Hoàn thành</th>
                  <th className="px-4 py-3">Người đã cứu</th>
                  <th className="px-4 py-3">Tiến độ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-soft">
                {teamPerformance.map((t, i) => (
                  <tr key={i} className="hover:bg-surface-soft transition-colors">
                    <td className="px-4 py-3 font-semibold text-primary">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                    <td className="px-4 py-3">{t.total}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{t.completed}</td>
                    <td className="px-4 py-3 font-semibold text-violet-600">{t.peopleSaved}</td>
                    <td className="px-4 py-3 w-48">
                      <div className="h-2 bg-surface rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${maxTeamCompleted > 0 ? (t.completed / maxTeamCompleted) * 100 : 0}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resource Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock by Category */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Package size={16} className="text-orange-500" /> Tồn kho theo danh mục
          </h3>
          <BarChart
            data={Object.entries(categoryStock).map(([cat, val], i) => ({
              label: cat, value: val, color: categoryColors[i % categoryColors.length]
            }))}
            maxVal={maxCatStock}
          />
          <div className="mt-4 pt-4 border-t border-hairline flex items-center justify-between text-xs">
            <span className="text-slate">Tổng tồn kho: <span className="font-semibold text-ink">{totalStockValue}</span></span>
            {lowStockItems.length > 0 && (
              <span className="badge-red flex items-center gap-1"><AlertTriangle size={10} /> {lowStockItems.length} mặt hàng sắp hết</span>
            )}
          </div>
        </div>

        {/* Distribution History */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Thống kê cấp phát
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-sm text-slate">Tổng lượt cấp phát</span>
              <span className="text-lg font-bold text-ink">{filteredDists.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-sm text-slate">Tổng đơn vị đã xuất</span>
              <span className="text-lg font-bold text-orange-600">{totalDistQuantity}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-sm text-slate">Số mặt hàng trong kho</span>
              <span className="text-lg font-bold text-ink">{reliefItems.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
              <span className="text-sm text-slate">Mặt hàng sắp hết</span>
              <span className={`text-lg font-bold ${lowStockItems.length > 0 ? "text-red-500" : "text-emerald-600"}`}>{lowStockItems.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
