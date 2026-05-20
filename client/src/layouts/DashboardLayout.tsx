import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, LifeBuoy, Users, Truck, Package, Shield, AlertTriangle,
  Bell, MapPin, LogOut, Menu, X, ChevronDown, User, FileBarChart, Settings
} from "lucide-react";
import { authActions } from "../store/authStore";
import { userActions } from "../store/userStore";
import { useUserStore } from "../hooks/useUserStore";
import { notifApi } from "../services/apiService";

type NavItem = { label: string; path: string; icon: React.ReactNode; roles?: string[] };

const navItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={18} />, roles: ["ADMIN", "MANAGER", "COORDINATOR"] },
  { label: "Bản đồ", path: "/map", icon: <MapPin size={18} /> },
  { label: "Yêu cầu cứu hộ", path: "/rescue-requests", icon: <LifeBuoy size={18} />, roles: ["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"] },
  { label: "Đội cứu hộ", path: "/teams", icon: <Users size={18} />, roles: ["ADMIN", "COORDINATOR"] },
  { label: "Phương tiện", path: "/vehicles", icon: <Truck size={18} />, roles: ["ADMIN", "MANAGER", "COORDINATOR"] },
  { label: "Hàng cứu trợ", path: "/relief", icon: <Package size={18} />, roles: ["ADMIN", "MANAGER"] },
  { label: "Điểm an toàn", path: "/shelters", icon: <Shield size={18} />, roles: ["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"] },
  { label: "Cảnh báo lũ", path: "/alerts", icon: <AlertTriangle size={18} />, roles: ["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"] },
  { label: "Thông báo", path: "/notifications", icon: <Bell size={18} /> },
  { label: "Báo cáo", path: "/reports", icon: <FileBarChart size={18} />, roles: ["ADMIN", "COORDINATOR", "MANAGER"] },
  { label: "Quản lý Users", path: "/admin/users", icon: <Users size={18} />, roles: ["ADMIN"] },
  { label: "Cấu hình", path: "/settings", icon: <Settings size={18} />, roles: ["ADMIN"] },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const profile = useUserStore(s => s.profile);
  const userRole = profile?.role || "";

  const filteredNav = navItems.filter(item => !item.roles || item.roles.includes(userRole));

  useEffect(() => {
    loadUnreadCount();
    // Pull every 5 seconds for real-time notification badge updates
    const interval = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadUnreadCount() {
    try {
      const count = await notifApi.getUnreadCount();
      setUnreadCount(count || 0);
    } catch {
      setUnreadCount(0);
    }
  }

  function handleLogout() {
    authActions.logout();
    userActions.clear();
    navigate("/login");
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-navy text-on-dark transform transition-transform duration-200 ease-in-out
        lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center gap-3 px-5 py-6 border-b border-hairline-soft">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-white">
            <LifeBuoy size={18} />
          </div>
          <div>
            <h1 className="text-sm font-semibold leading-tight tracking-tight">Flood Rescue</h1>
            <p className="text-[11px] text-on-dark/50 font-medium">Management System</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-0.5">
          {filteredNav.map(item => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link key={item.path} to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150
                  ${active ? "bg-primary text-white font-medium" : "text-on-dark/70 hover:bg-white/5 hover:text-on-dark"}`}>
                <span className={`${active ? "text-white" : "text-on-dark/40"}`}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-hairline-soft">
          <button onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-on-dark/60 hover:bg-white/5 hover:text-on-dark transition-colors">
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Nav */}
        <header className="flex items-center justify-between h-14 px-4 bg-canvas border-b border-hairline shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 rounded-md hover:bg-surface transition-colors">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h2 className="text-sm font-semibold text-ink hidden sm:block">
              {filteredNav.find(n => location.pathname.startsWith(n.path))?.label || "Dashboard"}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/notifications" className="relative p-1.5 rounded-md hover:bg-surface transition-colors" title="Thông báo">
              <Bell size={18} className="text-slate" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-canvas animate-pulse">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-surface transition-colors">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <User size={14} className="text-primary" />
                </div>
                <span className="text-sm font-medium text-ink hidden sm:block">{profile?.fullName || "User"}</span>
                <ChevronDown size={14} className="text-slate" />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-canvas rounded-lg border border-hairline shadow-modal z-50 py-1 animate-fade-in">
                    <div className="px-3 py-2 border-b border-hairline">
                      <p className="text-sm font-medium text-ink">{profile?.fullName}</p>
                      <p className="text-xs text-slate">@{profile?.username} · {userRole}</p>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-surface transition-colors">
                      <User size={14} /> Hồ sơ cá nhân
                    </Link>
                    <button onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm text-semantic-error hover:bg-surface transition-colors">
                      <LogOut size={14} /> Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
