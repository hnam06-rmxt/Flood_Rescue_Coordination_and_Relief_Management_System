import type { AsyncStatus } from "../types/api";
import { createStore } from "../utils/createStore";

export type RescueRequestState = {
  status: AsyncStatus;
  error: string | null;
};

const initialState: RescueRequestState = {
  status: "idle",
  error: null,
};

export const rescueRequestStore = createStore<RescueRequestState>(initialState);

export const rescueRequestActions = {
  hydrateModuleStatus() {
    // No-op for now
  },
};
