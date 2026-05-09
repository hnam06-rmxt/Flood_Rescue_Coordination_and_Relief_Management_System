import { rescueRequestService } from "../services/rescueRequestService";
import type { AsyncStatus } from "../types/api";
import type { RescueRequestDraft, RescueModuleStatus } from "../types/rescue";
import { createStore } from "../utils/createStore";

const defaultDraft: RescueRequestDraft = {
  description: "",
  location: "",
  latitude: "",
  longitude: "",
  image: "",
  urgencyLevel: "HIGH",
};

export type RescueRequestState = RescueModuleStatus & {
  status: AsyncStatus;
  error: string | null;
  draft: RescueRequestDraft;
};

const moduleStatus = rescueRequestService.getModuleStatus();

const initialState: RescueRequestState = {
  ...moduleStatus,
  status: "idle",
  error: null,
  draft: defaultDraft,
};

export const rescueRequestStore = createStore<RescueRequestState>(initialState);

export const rescueRequestActions = {
  hydrateModuleStatus() {
    const nextStatus = rescueRequestService.getModuleStatus();
    rescueRequestStore.setState((current) => ({
      ...current,
      ...nextStatus,
    }));
  },

  updateDraft<Key extends keyof RescueRequestDraft>(field: Key, value: RescueRequestDraft[Key]) {
    rescueRequestStore.setState((current) => ({
      ...current,
      draft: {
        ...current.draft,
        [field]: value,
      },
    }));
  },

  resetDraft() {
    rescueRequestStore.setState((current) => ({
      ...current,
      draft: defaultDraft,
    }));
  },
};
