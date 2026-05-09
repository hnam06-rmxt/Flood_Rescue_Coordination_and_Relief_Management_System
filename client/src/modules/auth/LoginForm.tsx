import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../hooks/useAuthStore";
import { authActions } from "../../store/authStore";
import { userActions } from "../../store/userStore";
import type { LoginPayload } from "../../types/auth";

const emptyLoginForm: LoginPayload = {
  username: "",
  password: "",
};

export function LoginForm() {
  const navigate = useNavigate();
  const authState = useAuthStore((state) => state);
  const [form, setForm] = useState<LoginPayload>(emptyLoginForm);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authActions.login(form);
    await userActions.loadMyProfile();
    setForm(emptyLoginForm);
    navigate("/workspace");
  }

  return (
    <form className="panel form-panel auth-form-card" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-heading">
        <h2>Login</h2>
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            setForm(emptyLoginForm);
            authActions.clearError();
          }}
        >
          Clear
        </button>
      </div>

      {authState.error ? <p className="feedback error">{authState.error}</p> : null}

      <label className="field">
        <span>Username</span>
        <input
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          placeholder="demo"
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="demo123"
          type="password"
          required
        />
      </label>

      <button className="primary-button" disabled={authState.status === "loading"} type="submit">
        {authState.status === "loading" ? "Signing in..." : "Login"}
      </button>
    </form>
  );
}
