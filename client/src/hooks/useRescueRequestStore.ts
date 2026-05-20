import { rescueRequestStore } from "../store/rescueRequestStore";
import type { RescueRequestState } from "../store/rescueRequestStore";
import { useStore } from "./useStore";

export function useRescueRequestStore<Selected>(selector: (state: RescueRequestState) => Selected): Selected {
  return useStore(rescueRequestStore, selector);
}
