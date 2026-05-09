import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../hooks/useAuthStore";
import { authActions } from "../../store/authStore";
import { userActions } from "../../store/userStore";
import type { RegisterPayload } from "../../types/auth";

const emptyRegisterForm: RegisterPayload = {
  fullName: "",
  username: "",
  password: "",
  email: "",
  phone: "",
};

export function RegisterForm() {
  const navigate = useNavigate();
  const authState = useAuthStore((state) => state);
  const [form, setForm] = useState<RegisterPayload>(emptyRegisterForm);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await authActions.register(form);
    await userActions.loadMyProfile();
    setForm(emptyRegisterForm);
    navigate("/workspace");
  }

  return (
    <form className="panel form-panel auth-form-card" onSubmit={(event) => void handleSubmit(event)}>
      <div className="panel-heading">
        <h2>Register</h2>
        <button
          className="ghost-button"
          type="button"
          onClick={() => {
            setForm(emptyRegisterForm);
            authActions.clearError();
          }}
        >
          Clear
        </button>
      </div>

      {authState.error ? <p className="feedback error">{authState.error}</p> : null}

      <label className="field">
        <span>Full name</span>
        <input
          value={form.fullName}
          onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          placeholder="Demo Citizen"
          required
        />
      </label>

      <label className="field">
        <span>Username</span>
        <input
          value={form.username}
          onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
          placeholder="demo_citizen"
          minLength={4}
          required
        />
      </label>

      <label className="field">
        <span>Email</span>
        <input
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          placeholder="demo@example.com"
          type="email"
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          placeholder="At least 6 characters"
          minLength={6}
          type="password"
          required
        />
      </label>

      <label className="field">
        <span>Phone</span>
        <input
          value={form.phone}
          onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
          placeholder="0123456789"
          required
        />
      </label>

      <button className="primary-button" disabled={authState.status === "loading"} type="submit">
        {authState.status === "loading" ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
