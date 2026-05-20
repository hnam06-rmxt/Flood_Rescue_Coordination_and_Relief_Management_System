export type ApiResponse<T> = { success: boolean; message: string; data: T; timestamp: string };
export type AsyncStatus = "idle" | "loading" | "success" | "error";
export class ApiClientError extends Error {
  status?: number; details?: unknown;
  constructor(message: string, status?: number, details?: unknown) {
    super(message); this.name = "ApiClientError"; this.status = status; this.details = details;
  }
}
