import axios from "axios";
import { getStoredAccessToken } from "../services/sessionStorage";
import { ApiClientError } from "../types/api";

// Đọc đúng biến môi trường đã cấu hình trên Vercel:
// VITE_API_URL=https://flood-rescue-coordination-and-relief-i6xh.onrender.com
const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();

export const apiBaseUrl =
  configuredBaseUrl && configuredBaseUrl.length > 0
    ? `${configuredBaseUrl}/api`
    : "/api";

export const http = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const accessToken = getStoredAccessToken();

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export function normalizeApiError(error: unknown): ApiClientError {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) {
      return new ApiClientError(error.message);
    }

    return new ApiClientError("Unexpected client error");
  }

  const status = error.response?.status;
  const details = error.response?.data;

  if (details && typeof details === "object" && "message" in details) {
    return new ApiClientError(String((details as { message: unknown }).message), status, details);
  }

  if (typeof error.message === "string" && error.message.length > 0) {
    return new ApiClientError(error.message, status, details);
  }

  return new ApiClientError("Request failed", status, details);
}