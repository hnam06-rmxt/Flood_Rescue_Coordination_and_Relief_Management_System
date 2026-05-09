export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RescueRequestDraft = {
  description: string;
  location: string;
  latitude: string;
  longitude: string;
  image: string;
  urgencyLevel: UrgencyLevel;
};

export type RescueModuleStatus = {
  apiAvailable: boolean;
  reason: string;
  plannedEndpoints: string[];
};
