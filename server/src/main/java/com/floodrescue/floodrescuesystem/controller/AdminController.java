package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.AdminCreateUserRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.DashboardStatsResponse;
import com.floodrescue.floodrescuesystem.dto.response.UserProfileResponse;
import com.floodrescue.floodrescuesystem.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@Tag(name = "Admin", description = "Quản trị hệ thống - Quản lý người dùng, phân quyền, thống kê")
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    // ========== User Management ==========

    @GetMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Danh sách người dùng", description = "Admin và Điều phối viên xem tất cả người dùng trong hệ thống")
    public ApiResponse<List<UserProfileResponse>> getAllUsers() {
        return ApiResponse.success("All users retrieved", adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Chi tiết người dùng", description = "Admin xem chi tiết 1 người dùng")
    public ApiResponse<UserProfileResponse> getUserById(@PathVariable Long id) {
        return ApiResponse.success("User retrieved", adminService.getUserById(id));
    }

    @PostMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo người dùng", description = "Admin tạo người dùng mới với phân quyền chỉ định")
    public ApiResponse<UserProfileResponse> createUser(@Valid @RequestBody AdminCreateUserRequest request) {
        return ApiResponse.success("User created successfully", adminService.createUser(request));
    }

    @PatchMapping("/users/{id}/role")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Phân quyền người dùng", description = "Admin thay đổi vai trò (role) cho người dùng")
    public ApiResponse<UserProfileResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return ApiResponse.success("User role updated", adminService.updateUserRole(id, body.get("role")));
    }

    @PatchMapping("/users/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật trạng thái người dùng", description = "Admin kích hoạt/vô hiệu hóa tài khoản")
    public ApiResponse<UserProfileResponse> updateUserStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ApiResponse.success("User status updated", adminService.updateUserStatus(id, request.getStatus()));
    }

    @DeleteMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa người dùng", description = "Admin xóa tài khoản người dùng")
    public ApiResponse<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ApiResponse.success("User deleted", null);
    }

    // ========== Dashboard & Reports ==========

    @GetMapping("/dashboard")
    @Operation(summary = "Thống kê tổng hợp", description = "Báo cáo tổng hợp hoạt động cứu hộ - cứu trợ")
    public ApiResponse<DashboardStatsResponse> getDashboardStats() {
        return ApiResponse.success("Dashboard stats retrieved", adminService.getDashboardStats());
    }
}
