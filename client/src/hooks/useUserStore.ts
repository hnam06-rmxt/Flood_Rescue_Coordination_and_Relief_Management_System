import { userStore } from "../store/userStore";
import type { UserState } from "../store/userStore";
import { useStore } from "./useStore";

export function useUserStore<Selected>(selector: (state: UserState) => Selected): Selected {
  return useStore(userStore, selector);
}
