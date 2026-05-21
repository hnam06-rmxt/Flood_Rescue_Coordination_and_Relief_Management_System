import { http } from "../api/http";
import type { ApiResponse } from "../types/api";
import type {
  RescueRequest, CreateRescueRequest, RescueTeam, RescueVehicle,
  ReliefItem, ReliefDistribution, Shelter, FloodAlert,
  Notification, DashboardStats, NearbyTeamSuggestion,
  VehicleUsageLog, SystemSetting,
} from "../types/rescue";
import type { UserProfile } from "../types/user";


export const rescueApi = {
  getAll: () => http.get<ApiResponse<RescueRequest[]>>("/rescue-requests").then(r => r.data.data),
  getById: (id: number) => http.get<ApiResponse<RescueRequest>>(`/rescue-requests/${id}`).then(r => r.data.data),
  getMyRequests: () => http.get<ApiResponse<RescueRequest[]>>("/rescue-requests/my-requests").then(r => r.data.data),
  getByStatus: (s: string) => http.get<ApiResponse<RescueRequest[]>>(`/rescue-requests/status/${s}`).then(r => r.data.data),
  getByTeam: (id: number) => http.get<ApiResponse<RescueRequest[]>>(`/rescue-requests/team/${id}`).then(r => r.data.data),
  create: (d: CreateRescueRequest) => http.post<ApiResponse<RescueRequest>>("/rescue-requests", d).then(r => r.data.data),
  update: (id: number, d: CreateRescueRequest) => http.put<ApiResponse<RescueRequest>>(`/rescue-requests/${id}`, d).then(r => r.data.data),
  updateStatus: (id: number, status: string, notes?: string, proofImageUrl?: string) =>
    http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/status`, { status, notes, proofImageUrl }).then(r => r.data.data),
  startRescue: (id: number) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/start`).then(r => r.data.data),
  rejectRequest: (id: number, reason?: string) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/reject`, { reason }).then(r => r.data.data),
  cancelRequest: (id: number, reason?: string) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/cancel`, { reason }).then(r => r.data.data),
  completeRequest: (id: number, notes?: string, proofImageUrl?: string) =>
    http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/complete`, { notes, proofImageUrl }).then(r => r.data.data),
  updateUrgency: (id: number, urgencyLevel: string) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/urgency`, { urgencyLevel }).then(r => r.data.data),
  getNearbyTeams: (id: number) => http.get<ApiResponse<NearbyTeamSuggestion[]>>(`/rescue-requests/${id}/nearby-teams`).then(r => r.data.data),
  assignTeam: (id: number, teamId: number) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/assign`, { teamId }).then(r => r.data.data),
  confirmRescued: (id: number) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/confirm-rescued`).then(r => r.data.data),
  markReliefReceived: (id: number) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/relief-received`).then(r => r.data.data),
  verifyRequest: (id: number, notes?: string) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/verify`, { notes }).then(r => r.data.data),
  updateLocation: (id: number, location: {latitude: number, longitude: number}) => http.patch<ApiResponse<RescueRequest>>(`/rescue-requests/${id}/location`, location).then(r => r.data.data),
  delete: (id: number) => http.delete<ApiResponse<void>>(`/rescue-requests/${id}`),
};

export const uploadApi = {
  uploadImages: (files: File[], folder = "rescue-requests") => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    formData.append("folder", folder);
    return http.post<ApiResponse<{ urls: string[]; joinedUrls: string }>>("/uploads/images", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then(r => r.data.data);
  },
};

// ─── Teams ───
export const teamApi = {
  getAll: () => http.get<ApiResponse<RescueTeam[]>>("/rescue-teams").then(r => r.data.data),
  getAssignedToMe: () => http.get<ApiResponse<RescueTeam[]>>("/rescue-teams/assigned-to-me").then(r => r.data.data),
  getById: (id: number) => http.get<ApiResponse<RescueTeam>>(`/rescue-teams/${id}`).then(r => r.data.data),
  create: (d: Partial<RescueTeam>) => http.post<ApiResponse<RescueTeam>>("/rescue-teams", d).then(r => r.data.data),
  update: (id: number, d: Partial<RescueTeam>) => http.put<ApiResponse<RescueTeam>>(`/rescue-teams/${id}`, d).then(r => r.data.data),
  updateStatus: (id: number, status: string) => http.patch<ApiResponse<RescueTeam>>(`/rescue-teams/${id}/status`, { status }).then(r => r.data.data),
  updateLocation: (id: number, location: {latitude: number, longitude: number}) => http.patch<ApiResponse<RescueTeam>>(`/rescue-teams/${id}/location`, location).then(r => r.data.data),
  delete: (id: number) => http.delete<ApiResponse<void>>(`/rescue-teams/${id}`),
};

// ─── Vehicles ───
export const vehicleApi = {
  getAll: () => http.get<ApiResponse<RescueVehicle[]>>("/vehicles").then(r => r.data.data),
  getById: (id: number) => http.get<ApiResponse<RescueVehicle>>(`/vehicles/${id}`).then(r => r.data.data),
  create: (d: Partial<RescueVehicle>) => http.post<ApiResponse<RescueVehicle>>("/vehicles", d).then(r => r.data.data),
  update: (id: number, d: Partial<RescueVehicle>) => http.put<ApiResponse<RescueVehicle>>(`/vehicles/${id}`, d).then(r => r.data.data),
  updateStatus: (id: number, status: string) => http.patch<ApiResponse<RescueVehicle>>(`/vehicles/${id}/status`, { status }).then(r => r.data.data),
  assignTeam: (vehicleId: number, teamId: number) => http.patch<ApiResponse<RescueVehicle>>(`/vehicles/${vehicleId}/assign-team`, { teamId }).then(r => r.data.data),
  delete: (id: number) => http.delete<ApiResponse<void>>(`/vehicles/${id}`),
  getLogs: (vehicleId: number) => http.get<ApiResponse<VehicleUsageLog[]>>(`/vehicles/${vehicleId}/logs`).then(r => r.data.data),
  getAllLogs: () => http.get<ApiResponse<VehicleUsageLog[]>>("/vehicles/logs").then(r => r.data.data),
};

// ─── Relief ───
export const reliefApi = {
  getItems: () => http.get<ApiResponse<ReliefItem[]>>("/relief/items").then(r => r.data.data),
  getItemById: (id: number) => http.get<ApiResponse<ReliefItem>>(`/relief/items/${id}`).then(r => r.data.data),
  getItemsByCategory: (category: string) => http.get<ApiResponse<ReliefItem[]>>(`/relief/items/category/${category}`).then(r => r.data.data),
  getLowStockItems: () => http.get<ApiResponse<ReliefItem[]>>("/relief/items/low-stock").then(r => r.data.data),
  createItem: (d: Partial<ReliefItem>) => http.post<ApiResponse<ReliefItem>>("/relief/items", d).then(r => r.data.data),
  updateItem: (id: number, d: Partial<ReliefItem>) => http.put<ApiResponse<ReliefItem>>(`/relief/items/${id}`, d).then(r => r.data.data),
  deleteItem: (id: number) => http.delete<ApiResponse<void>>(`/relief/items/${id}`),
  getDistributions: () => http.get<ApiResponse<ReliefDistribution[]>>("/relief/distributions").then(r => r.data.data),
  getDistributionsByItem: (itemId: number) => http.get<ApiResponse<ReliefDistribution[]>>(`/relief/distributions/item/${itemId}`).then(r => r.data.data),
  distribute: (d: Partial<ReliefDistribution>) => http.post<ApiResponse<ReliefDistribution>>("/relief/distributions", d).then(r => r.data.data),
};

// ─── Shelters ───
export const shelterApi = {
  getAll: () => http.get<ApiResponse<Shelter[]>>("/shelters").then(r => r.data.data),
  getById: (id: number) => http.get<ApiResponse<Shelter>>(`/shelters/${id}`).then(r => r.data.data),
  create: (d: Partial<Shelter>) => http.post<ApiResponse<Shelter>>("/shelters", d).then(r => r.data.data),
  update: (id: number, d: Partial<Shelter>) => http.put<ApiResponse<Shelter>>(`/shelters/${id}`, d).then(r => r.data.data),
  delete: (id: number) => http.delete<ApiResponse<void>>(`/shelters/${id}`),
};

// ─── Flood Alerts ───
export const alertApi = {
  getAll: () => http.get<ApiResponse<FloodAlert[]>>("/flood-alerts").then(r => r.data.data),
  getById: (id: number) => http.get<ApiResponse<FloodAlert>>(`/flood-alerts/${id}`).then(r => r.data.data),
  create: (d: Partial<FloodAlert>) => http.post<ApiResponse<FloodAlert>>("/flood-alerts", d).then(r => r.data.data),
  update: (id: number, d: Partial<FloodAlert>) => http.put<ApiResponse<FloodAlert>>(`/flood-alerts/${id}`, d).then(r => r.data.data),
  delete: (id: number) => http.delete<ApiResponse<void>>(`/flood-alerts/${id}`),
};

// ─── Notifications ───
export const notifApi = {
  getAll: () => http.get<ApiResponse<Notification[]>>("/notifications").then(r => r.data.data),
  getUnread: () => http.get<ApiResponse<Notification[]>>("/notifications/unread").then(r => r.data.data),
  getUnreadCount: () => http.get<ApiResponse<number>>("/notifications/unread/count").then(r => r.data.data),
  markRead: (id: number) => http.patch<ApiResponse<void>>(`/notifications/${id}/read`),
  markAllRead: () => http.patch<ApiResponse<void>>("/notifications/read-all"),
};

export const adminApi = {
  getAllUsers: () => http.get<ApiResponse<UserProfile[]>>("/admin/users").then(r => r.data.data),
  getUsers: () => http.get<ApiResponse<UserProfile[]>>("/admin/users").then(r => r.data.data),
  getUserById: (id: number) => http.get<ApiResponse<UserProfile>>(`/admin/users/${id}`).then(r => r.data.data),
  createUser: (d: Record<string, string>) => http.post<ApiResponse<UserProfile>>("/admin/users", d).then(r => r.data.data),
  updateRole: (id: number, role: string) => http.patch<ApiResponse<UserProfile>>(`/admin/users/${id}/role`, { role }).then(r => r.data.data),
  updateStatus: (id: number, status: string) => http.patch<ApiResponse<UserProfile>>(`/admin/users/${id}/status`, { status }).then(r => r.data.data),
  deleteUser: (id: number) => http.delete<ApiResponse<void>>(`/admin/users/${id}`),
  getStats: () => http.get<ApiResponse<DashboardStats>>("/admin/dashboard").then(r => r.data.data),
  getDashboard: () => http.get<ApiResponse<DashboardStats>>("/admin/dashboard").then(r => r.data.data),
};

// ─── Settings ───
export const settingsApi = {
  getAll: () => http.get<ApiResponse<SystemSetting[]>>("/settings").then(r => r.data.data),
  getPublic: () => http.get<ApiResponse<SystemSetting[]>>("/settings/public").then(r => r.data.data),
  update: (key: string, value: string, description?: string) =>
    http.put<ApiResponse<SystemSetting>>(`/settings/${key}`, { value, description }).then(r => r.data.data),
  bulkSave: (settings: Record<string, string>) =>
    http.post<ApiResponse<void>>("/settings/bulk", settings).then(r => r.data),
};
