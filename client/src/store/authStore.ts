import { normalizeApiError } from "../api/http";
import { authService } from "../services/authService";
import { clearSession, loadSession, saveSession } from "../services/sessionStorage";
import type { AsyncStatus } from "../types/api";
import type {
  AuthResponsePayload,
  LoginPayload,
  RefreshTokenPayload,
  RegisterPayload,
  SessionTokens,
} from "../types/auth";
import { createStore } from "../utils/createStore";

export type AuthState = SessionTokens & {
  status: AsyncStatus;
  error: string | null;
};

const persistedSession = loadSession();

const initialState: AuthState = {
  accessToken: persistedSession.accessToken,
  refreshToken: persistedSession.refreshToken,
  tokenType: persistedSession.tokenType,
  status: "idle",
  error: null,
};

export const authStore = createStore<AuthState>(initialState);

function commitSession(payload: AuthResponsePayload) {
  const nextState: AuthState = {
    accessToken: payload.accessToken,
    refreshToken: payload.refreshToken,
    tokenType: payload.tokenType || "Bearer",
    status: "success",
    error: null,
  };

  saveSession(nextState);
  authStore.setState(nextState);
}

function setLoading() {
  authStore.setState((current) => ({
    ...current,
    status: "loading",
    error: null,
  }));
}

function setError(message: string) {
  authStore.setState((current) => ({
    ...current,
    status: "error",
    error: message,
  }));
}

export const authActions = {
  async register(payload: RegisterPayload) {
    setLoading();

    try {
      const response = await authService.register(payload);
      commitSession(response);
      return response;
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      setError(normalizedError.message);
      throw normalizedError;
    }
  },

  async login(payload: LoginPayload) {
    setLoading();

    try {
      const response = await authService.login(payload);
      commitSession(response);
      return response;
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      setError(normalizedError.message);
      throw normalizedError;
    }
  },

  async refresh() {
    const { refreshToken } = authStore.getState();

    if (!refreshToken) {
      const error = "No refresh token available";
      setError(error);
      throw new Error(error);
    }

    setLoading();

    try {
      const payload: RefreshTokenPayload = { refreshToken };
      const response = await authService.refresh(payload);
      commitSession(response);
      return response;
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      setError(normalizedError.message);
      throw normalizedError;
    }
  },

  clearError() {
    authStore.setState((current) => ({
      ...current,
      error: null,
      status: current.accessToken ? "success" : "idle",
    }));
  },

  logout() {
    clearSession();
    authStore.setState({
      accessToken: "",
      refreshToken: "",
      tokenType: "Bearer",
      status: "idle",
      error: null,
    });
  },
};
