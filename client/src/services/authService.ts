import { http } from "../api/http";
import type { ApiResponse } from "../types/api";
import type {
  AuthResponsePayload,
  LoginPayload,
  RefreshTokenPayload,
  RegisterPayload,
} from "../types/auth";

export const authService = {
  async register(payload: RegisterPayload) {
    const response = await http.post<ApiResponse<AuthResponsePayload>>("/auth/register", payload);
    return response.data.data;
  },

  async login(payload: LoginPayload) {
    const response = await http.post<ApiResponse<AuthResponsePayload>>("/auth/login", payload);
    return response.data.data;
  },

  async refresh(payload: RefreshTokenPayload) {
    const response = await http.post<ApiResponse<AuthResponsePayload>>("/auth/refresh", payload);
    return response.data.data;
  },
};
