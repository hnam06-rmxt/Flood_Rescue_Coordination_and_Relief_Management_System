import { useUserStore } from "../../hooks/useUserStore";
import { userActions } from "../../store/userStore";

type ProfileWorkspaceProps = {
  isAuthenticated: boolean;
};

export function ProfileWorkspace({ isAuthenticated }: ProfileWorkspaceProps) {
  const profile = useUserStore((state) => state.profile);
  const status = useUserStore((state) => state.status);
  const error = useUserStore((state) => state.error);

  return (
    <section className="workspace-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">User module</p>
          <h2>Profile service + store</h2>
        </div>
        <span className={`status-badge ${isAuthenticated ? "status-live" : "status-muted"}`}>
          {isAuthenticated ? "Ready to fetch" : "Auth required"}
        </span>
      </div>

      <p className="card-copy">
        Synced with the current backend branch: <code>GET /api/users/me</code>.
      </p>

      <div className="panel">
        <div className="panel-heading">
          <h3>Profile actions</h3>
          <button
            className="primary-button"
            disabled={!isAuthenticated || status === "loading"}
            onClick={() => void userActions.loadMyProfile()}
            type="button"
          >
            {status === "loading" ? "Loading..." : "Fetch my profile"}
          </button>
        </div>

        {!isAuthenticated ? (
          <p className="feedback muted">Login first so the store can attach the JWT token.</p>
        ) : null}
        {error ? <p className="feedback error">{error}</p> : null}

        {profile ? (
          <dl className="info-grid">
            <div>
              <dt>Full name</dt>
              <dd>{profile.fullName}</dd>
            </div>
            <div>
              <dt>Username</dt>
              <dd>{profile.username}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{profile.email || "Not set"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{profile.phone || "Not set"}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{profile.status || "Unknown"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{profile.role || "Unknown"}</dd>
            </div>
            <div className="span-two">
              <dt>Address</dt>
              <dd>{profile.address || "Not set"}</dd>
            </div>
            <div className="span-two">
              <dt>Last login</dt>
              <dd>{profile.lastLoginAt || "No login timestamp yet"}</dd>
            </div>
          </dl>
        ) : (
          <p className="feedback muted">
            The profile store stays empty until <code>userActions.loadMyProfile()</code> succeeds.
          </p>
        )}
      </div>
    </section>
  );
}
