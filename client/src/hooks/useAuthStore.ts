import { authStore } from "../store/authStore";
import type { AuthState } from "../store/authStore";
import { useStore } from "./useStore";

export function useAuthStore<Selected>(selector: (state: AuthState) => Selected): Selected {
  return useStore(authStore, selector);
}
