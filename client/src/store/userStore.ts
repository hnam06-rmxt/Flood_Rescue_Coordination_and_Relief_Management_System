import { normalizeApiError } from "../api/http";
import { userService } from "../services/userService";
import type { AsyncStatus } from "../types/api";
import type { UserProfile } from "../types/user";
import { createStore } from "../utils/createStore";

export type UserState = {
  profile: UserProfile | null;
  status: AsyncStatus;
  error: string | null;
};

const initialState: UserState = {
  profile: null,
  status: "idle",
  error: null,
};

export const userStore = createStore<UserState>(initialState);

export const userActions = {
  async loadMyProfile() {
    userStore.setState((current) => ({
      ...current,
      status: "loading",
      error: null,
    }));

    try {
      const profile = await userService.getMyProfile();
      userStore.setState({
        profile,
        status: "success",
        error: null,
      });
      return profile;
    } catch (error) {
      const normalizedError = normalizeApiError(error);
      userStore.setState((current) => ({
        ...current,
        status: "error",
        error: normalizedError.message,
      }));
      throw normalizedError;
    }
  },

  clear() {
    userStore.setState(initialState);
  },
};
