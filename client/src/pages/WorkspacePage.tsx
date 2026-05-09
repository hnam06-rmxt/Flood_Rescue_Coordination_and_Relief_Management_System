import { Link, useNavigate } from "react-router-dom";
import { apiBaseUrl } from "../api/http";
import { useAuthStore } from "../hooks/useAuthStore";
import { ProfileWorkspace } from "../modules/citizen/ProfileWorkspace";
import { RescueRequestWorkspace } from "../modules/citizen/RescueRequestWorkspace";
import { authActions } from "../store/authStore";
import { userActions } from "../store/userStore";

const backendModules = [
  { label: "Auth", state: "ready", detail: "register, login, refresh" },
  { label: "Profile", state: "ready", detail: "GET /api/users/me" },
  { label: "Rescue request", state: "pending", detail: "FE scaffold only in this branch" },
] as const;

export function WorkspacePage() {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = accessToken.length > 0;

  function handleLogout() {
    authActions.logout();
    userActions.clear();
    navigate("/login");
  }

  return (
    <main className="app-shell">
      <div className="page-backdrop page-backdrop-left" aria-hidden="true" />
      <div className="page-backdrop page-backdrop-right" aria-hidden="true" />

      <section className="hero-card">
        <div>
          <p className="eyebrow">Flood Rescue Coordination and Relief Management System</p>
          <h1>Workspace synced to the current backend contract</h1>
          <p className="hero-copy">
            Auth and profile are live against the backend. Rescue request state is prepared on the
            frontend and waiting for the backend endpoints to be restored on this branch.
          </p>
        </div>

        <div className="hero-meta">
          <div className="meta-block">
            <span className="meta-label">API base</span>
            <strong>{apiBaseUrl}</strong>
          </div>
          <div className="meta-block">
            <span className="meta-label">Session</span>
            <strong>{isAuthenticated ? "Authenticated" : "Anonymous"}</strong>
          </div>
          <div className="meta-block">
            <span className="meta-label">Navigation</span>
            <div className="hero-links">
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <button className="inline-link-button" onClick={handleLogout} type="button">
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="summary-grid">
        {backendModules.map((module) => (
          <article className="summary-card" key={module.label}>
            <div className="card-heading">
              <h2>{module.label}</h2>
              <span className={`status-badge ${module.state === "ready" ? "status-live" : "status-warn"}`}>
                {module.state}
              </span>
            </div>
            <p>{module.detail}</p>
          </article>
        ))}
      </section>

      <ProfileWorkspace isAuthenticated={isAuthenticated} />
      <RescueRequestWorkspace />
    </main>
  );
}
