export type RescueRequest = {
  requestId: number; description: string; location: string;
  latitude: number; longitude: number; urgencyLevel: string;
  status: "PENDING" | "VERIFIED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "RELIEF_RECEIVED" | "CANCELLED" | "REJECTED" | string;
  image?: string; notes?: string; numberOfPeople: number;
  userId: number; userName?: string;
  assignedTeamId?: number; assignedTeamName?: string;
  createdTime: string; updatedTime?: string;
};
export type CreateRescueRequest = {
  description: string; location: string;
  latitude: number; longitude: number; urgencyLevel: string; image?: string; numberOfPeople: number;
};
export type RescueTeam = {
  teamId: number; teamName: string; memberCount: number;
  contactPhone: string; status: string; currentLocation: string;
  latitude: number; longitude: number;
  teamLeaderId: number; teamLeaderName?: string;
  description?: string; createdAt: string; vehicleNames?: string[];
};
export type RescueVehicle = {
  vehicleId: number; name: string; type: string; licensePlate: string;
  capacity: number; currentLocation: string; status: string;
  assignedTeamId?: number; assignedTeamName?: string;
  notes?: string; createdAt: string;
};
export type ReliefItem = {
  id: number; name: string; category: string; unit: string;
  quantityInStock: number; minimumStockLevel: number;
  description?: string; createdAt: string;
};
export type ReliefDistribution = {
  id: number; itemId: number; itemName?: string;
  quantity: number; recipientName?: string; recipientLocation?: string;
  distributedById?: number; distributedByName?: string;
  rescueRequestId?: number; notes?: string; distributedAt?: string;
  reliefItemId?: number; recipientType?: string; recipientId?: number;
  quantityDistributed?: number; distributionDate?: string;
};
export type Shelter = {
  id: number; name: string; location: string;
  latitude: number; longitude: number;
  capacity: number; currentOccupancy: number;
  status: string; contactInfo?: string; createdAt: string;
};
export type FloodAlert = {
  id: number; title: string; description: string;
  severity: string; locationArea: string;
  startTime: string; endTime?: string;
  createdBy: number; createdAt: string;
};
export type Notification = {
  id: number; title: string; message: string;
  type: string; isRead: boolean; createdAt: string;
  referenceId?: number;
};
export type DashboardStats = {
  totalUsers: number; totalRescueRequests: number;
  totalTeams: number; totalVehicles: number;
  totalReliefItems: number; totalShelters: number;
  totalAlerts: number; requestsByStatus: Record<string, number>;
  requestsByUrgency: Record<string, number>;
};

export type NearbyTeamSuggestion = {
  teamId: number;
  teamName: string;
  teamLeaderName: string;
  memberCount: number;
  status: string;
  contactPhone: string;
  currentLocation: string;
  teamLatitude: number;
  teamLongitude: number;
  distanceKm: number;
  distanceDisplay: string;
  vehicleNames: string[];
};

export type VehicleUsageLog = {
  id: number;
  vehicleId: number;
  vehicleName: string;
  teamId?: number;
  teamName?: string;
  requestId?: number;
  action: string;
  oldStatus?: string;
  newStatus?: string;
  notes?: string;
  loggedBy?: number;
  loggedAt: string;
};

export type SystemSetting = {
  key: string;
  value: string;
  description?: string;
  updatedBy?: number;
  updatedAt?: string;
};
