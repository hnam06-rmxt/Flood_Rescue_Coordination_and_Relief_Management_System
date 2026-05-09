import { type ReactElement, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuthStore } from "./hooks/useAuthStore";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { rescueRequestActions } from "./store/rescueRequestStore";
import { userActions } from "./store/userStore";

function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/workspace" />;
  }

  return children;
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return children;
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.accessToken.length > 0);

  useEffect(() => {
    rescueRequestActions.hydrateModuleStatus();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      userActions.clear();
      return;
    }

    void userActions.loadMyProfile().catch(() => undefined);
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route element={<Navigate replace to="/login" />} path="/" />
      <Route
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
        path="/login"
      />
      <Route
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
        path="/register"
      />
      <Route
        element={
          <ProtectedRoute>
            <WorkspacePage />
          </ProtectedRoute>
        }
        path="/workspace"
      />
      <Route element={<Navigate replace to={isAuthenticated ? "/workspace" : "/login"} />} path="*" />
    </Routes>
  );
}
