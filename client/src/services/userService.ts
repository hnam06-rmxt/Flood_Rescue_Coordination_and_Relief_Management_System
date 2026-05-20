import { http } from "../api/http";
import type { ApiResponse } from "../types/api";
import type { UserProfile } from "../types/user";

export const userService = {
  async getMyProfile() {
    const response = await http.get<ApiResponse<UserProfile>>("/users/me");
    return response.data.data;
  },

  async updateMyProfile(data: Partial<UserProfile>) {
    const response = await http.patch<ApiResponse<UserProfile>>("/users/me", data);
    return response.data.data;
  },
};
