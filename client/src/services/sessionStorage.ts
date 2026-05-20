import { STORAGE_KEYS } from "../constants/storage";
import type { SessionTokens } from "../types/auth";

const emptySession: SessionTokens = {
  accessToken: "",
  refreshToken: "",
  tokenType: "Bearer",
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSession(): SessionTokens {
  if (!canUseStorage()) {
    return emptySession;
  }

  return {
    accessToken: window.localStorage.getItem(STORAGE_KEYS.accessToken) ?? "",
    refreshToken: window.localStorage.getItem(STORAGE_KEYS.refreshToken) ?? "",
    tokenType: window.localStorage.getItem(STORAGE_KEYS.tokenType) ?? "Bearer",
  };
}

export function saveSession(tokens: SessionTokens) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.accessToken, tokens.accessToken);
  window.localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refreshToken);
  window.localStorage.setItem(STORAGE_KEYS.tokenType, tokens.tokenType);
}

export function clearSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEYS.accessToken);
  window.localStorage.removeItem(STORAGE_KEYS.refreshToken);
  window.localStorage.removeItem(STORAGE_KEYS.tokenType);
}

export function getStoredAccessToken() {
  return loadSession().accessToken;
}
