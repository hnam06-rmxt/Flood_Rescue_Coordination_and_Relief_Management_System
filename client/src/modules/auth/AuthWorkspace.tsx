import { type FormEvent, useMemo, useState } from "react";
import { useAuthStore } from "../../hooks/useAuthStore";
import { authActions } from "../../store/authStore";
import type { LoginPayload, RegisterPayload } from "../../types/auth";

type AuthWorkspaceProps = {
  onAuthenticated: () => Promise<void> | void;
  onLogout: () => void;
};

const emptyRegisterForm: RegisterPayload = {
  fullName: "",
  username: "",
  password: "",
  email: "",
  phone: "",
};

const emptyLoginForm: LoginPayload = {
  username: "",
  password: "",
};

export function AuthWorkspace({ onAuthenticated, onLogout }: AuthWorkspaceProps) {
  const authState = useAuthStore((state) => state);
  const [registerForm, setRegisterForm] = useState<RegisterPayload>(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState<LoginPayload>(emptyLoginForm);

  const isAuthenticated = Boolean(authState.accessToken);
  const accessTokenPreview = useMemo(() => {
    if (!authState.accessToken) {
      return "No token yet";
    }

    return `${authState.accessToken.slice(0, 28)}...`;
  }, [authState.accessToken]);

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authActions.register(registerForm);
    setRegisterForm(emptyRegisterForm);
    await onAuthenticated();
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authActions.login(loginForm);
    setLoginForm(emptyLoginForm);
    await onAuthenticated();
  }

  async function handleRefresh() {
    await authActions.refresh();
    await onAuthenticated();
  }

  return (
    <section className="workspace-card">
      <div className="card-heading">
        <div>
          <p className="eyebrow">Auth module</p>
          <h2>Backend-aligned authentication</h2>
        </div>
        <span className={`status-badge ${isAuthenticated ? "status-live" : "status-muted"}`}>
          {isAuthenticated ? "Session active" : "No session"}
        </span>
      </div>

      <p className="card-copy">
        Synced with Spring Boot endpoints: <code>POST /api/auth/register</code>,{" "}
        <code>POST /api/auth/login</code>, and <code>POST /api/auth/refresh</code>.
      </p>

      {authState.error ? <p className="feedback error">{authState.error}</p> : null}

      <div className="grid-two">
        <form className="panel form-panel" onSubmit={(event) => void handleRegister(event)}>
          <div className="panel-heading">
            <h3>Register</h3>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setRegisterForm(emptyRegisterForm);
                authActions.clearError();
              }}
            >
              Clear
            </button>
          </div>

          <label className="field">
            <span>Full name</span>
            <input
              value={registerForm.fullName}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, fullName: event.target.value }))
              }
              placeholder="Demo Citizen"
              required
            />
          </label>

          <label className="field">
            <span>Username</span>
            <input
              value={registerForm.username}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="demo_citizen"
              minLength={4}
              required
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              value={registerForm.email}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="demo@example.com"
              type="email"
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={registerForm.password}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="At least 6 characters"
              minLength={6}
              type="password"
              required
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              value={registerForm.phone}
              onChange={(event) =>
                setRegisterForm((current) => ({ ...current, phone: event.target.value }))
              }
              placeholder="0123456789"
              required
            />
          </label>

          <button className="primary-button" disabled={authState.status === "loading"} type="submit">
            {authState.status === "loading" ? "Submitting..." : "Register and keep session"}
          </button>
        </form>

        <form className="panel form-panel" onSubmit={(event) => void handleLogin(event)}>
          <div className="panel-heading">
            <h3>Login</h3>
            <button
              className="ghost-button"
              type="button"
              onClick={() => {
                setLoginForm(emptyLoginForm);
                authActions.clearError();
              }}
            >
              Clear
            </button>
          </div>

          <label className="field">
            <span>Username</span>
            <input
              value={loginForm.username}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, username: event.target.value }))
              }
              placeholder="demo"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={loginForm.password}
              onChange={(event) =>
                setLoginForm((current) => ({ ...current, password: event.target.value }))
              }
              placeholder="demo123"
              type="password"
              required
            />
          </label>

          <button className="primary-button" disabled={authState.status === "loading"} type="submit">
            {authState.status === "loading" ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>

      <div className="panel session-panel">
        <div className="panel-heading">
          <h3>Store snapshot</h3>
          <div className="inline-actions">
            <button
              className="ghost-button"
              disabled={!authState.refreshToken || authState.status === "loading"}
              onClick={() => void handleRefresh()}
              type="button"
            >
              Refresh token
            </button>
            <button
              className="ghost-button"
              disabled={!isAuthenticated}
              onClick={onLogout}
              type="button"
            >
              Logout
            </button>
          </div>
        </div>

        <dl className="info-grid">
          <div>
            <dt>Status</dt>
            <dd>{authState.status}</dd>
          </div>
          <div>
            <dt>Token type</dt>
            <dd>{authState.tokenType || "Bearer"}</dd>
          </div>
          <div className="span-two">
            <dt>Access token</dt>
            <dd>{accessTokenPreview}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
