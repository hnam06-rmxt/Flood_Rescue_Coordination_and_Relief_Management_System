import { type ReactElement, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./hooks/useAuthStore";
import { authActions } from "./store/authStore";
import { userActions } from "./store/userStore";
import { useUserStore } from "./hooks/useUserStore";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { MapPage } from "./pages/MapPage";
import { RescueRequestsPage } from "./pages/RescueRequestsPage";
import { TeamsPage } from "./pages/TeamsPage";
import { VehiclesPage } from "./pages/VehiclesPage";
import { ReliefPage } from "./pages/ReliefPage";
import { SheltersPage } from "./pages/SheltersPage";
import { AlertsPage } from "./pages/AlertsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { DashboardLayout } from "./layouts/DashboardLayout";

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);
  const location = useLocation();
  if (isAuthenticated) return <Navigate replace state={{ from: location }} to="/dashboard" />;
  return children;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);
  const location = useLocation();
  if (!isAuthenticated) return <Navigate replace state={{ from: location }} to="/login" />;
  return children;
}

function RoleRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles?: string[] }) {
  const { profile, status } = useUserStore((state) => ({ profile: state.profile, status: state.status }));
  
  if (status === "loading" || status === "idle") {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }
  
  if (!profile) {
    return <div className="flex flex-col items-center justify-center h-screen"><p className="text-error mb-4">Lỗi tải thông tin tài khoản hoặc mất kết nối máy chủ.</p><button onClick={() => window.location.reload()} className="btn-primary">Tải lại trang</button></div>;
  }

  if (allowedRoles && (!profile.role || !allowedRoles.includes(profile.role))) {
    return <Navigate replace to="/map" />; // Default fallback for unauthorized
  }
  return children;
}

function DashboardRoute({ children, allowedRoles }: { children: ReactElement; allowedRoles?: string[] }) {
  return (
    <ProtectedRoute>
      <RoleRoute allowedRoles={allowedRoles}>
        <DashboardLayout>{children}</DashboardLayout>
      </RoleRoute>
    </ProtectedRoute>
  );
}

function HomeRedirect() {
  const profile = useUserStore((s) => s.profile);
  const status = useUserStore((s) => s.status);
  if (status === "loading" || status === "idle") {
    return <Navigate replace to="/map" />;
  }
  if (profile?.role === "CITIZEN" || profile?.role === "RESCUER") {
    return <Navigate replace to="/map" />;
  }
  if (profile?.role === "ADMIN" || profile?.role === "MANAGER" || profile?.role === "COORDINATOR") {
    return <Navigate replace to="/dashboard" />;
  }
  return <Navigate replace to="/map" />;
}

function AuthFallbackRedirect() {
  const isAuthenticated = useAuthStore((s) => s.accessToken.length > 0);
  if (!isAuthenticated) return <Navigate replace to="/login" />;
  return <HomeRedirect />;
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);

  useEffect(() => {
    if (!isAuthenticated) {
      userActions.clear();
      return;
    }
    userActions.loadMyProfile().catch((error) => {
      if (error && error.status === 401) {
        authActions.logout();
      }
    });
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>} />

      <Route path="/dashboard" element={<DashboardRoute allowedRoles={["ADMIN", "MANAGER", "COORDINATOR"]}><DashboardPage /></DashboardRoute>} />
      <Route path="/map" element={<DashboardRoute><MapPage /></DashboardRoute>} />
      <Route path="/rescue-requests" element={<DashboardRoute allowedRoles={["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"]}><RescueRequestsPage /></DashboardRoute>} />
      <Route path="/teams" element={<DashboardRoute allowedRoles={["ADMIN", "COORDINATOR"]}><TeamsPage /></DashboardRoute>} />
      <Route path="/vehicles" element={<DashboardRoute allowedRoles={["ADMIN", "MANAGER", "COORDINATOR"]}><VehiclesPage /></DashboardRoute>} />
      <Route path="/relief" element={<DashboardRoute allowedRoles={["ADMIN", "MANAGER"]}><ReliefPage /></DashboardRoute>} />
      <Route path="/shelters" element={<DashboardRoute allowedRoles={["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"]}><SheltersPage /></DashboardRoute>} />
      <Route path="/alerts" element={<DashboardRoute allowedRoles={["CITIZEN", "COORDINATOR", "RESCUER", "MANAGER", "ADMIN"]}><AlertsPage /></DashboardRoute>} />
      <Route path="/notifications" element={<DashboardRoute><NotificationsPage /></DashboardRoute>} />
      <Route path="/admin/users" element={<DashboardRoute allowedRoles={["ADMIN"]}><AdminUsersPage /></DashboardRoute>} />
      <Route path="/reports" element={<DashboardRoute allowedRoles={["ADMIN", "COORDINATOR", "MANAGER"]}><ReportsPage /></DashboardRoute>} />
      <Route path="/settings" element={<DashboardRoute allowedRoles={["ADMIN"]}><SettingsPage /></DashboardRoute>} />
      <Route path="/profile" element={<DashboardRoute><ProfilePage /></DashboardRoute>} />

      <Route path="*" element={<AuthFallbackRedirect />} />
    </Routes>
  );
}
