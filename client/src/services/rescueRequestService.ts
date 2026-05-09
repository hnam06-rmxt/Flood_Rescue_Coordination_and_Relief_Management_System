import type { RescueModuleStatus } from "../types/rescue";

const plannedEndpoints = [
  "POST /api/rescue-requests",
  "GET /api/rescue-requests",
  "GET /api/rescue-requests/:id",
  "PATCH /api/rescue-requests/:id/status",
];

export const rescueRequestService = {
  getModuleStatus(): RescueModuleStatus {
    return {
      apiAvailable: false,
      reason:
        "Current backend branch only exposes auth and profile APIs. Rescue request endpoints are not implemented yet.",
      plannedEndpoints,
    };
  },
};
