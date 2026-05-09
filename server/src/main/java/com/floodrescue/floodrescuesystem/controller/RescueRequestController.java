package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.AssignTeamRequest;
import com.floodrescue.floodrescuesystem.dto.request.CreateRescueRequestDTO;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.RescueRequestResponse;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import com.floodrescue.floodrescuesystem.service.NotificationService;
import com.floodrescue.floodrescuesystem.service.RescueRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rescue-requests")
@Tag(name = "Rescue Requests", description = "Quản lý yêu cầu cứu hộ")
public class RescueRequestController {

    private final RescueRequestService rescueRequestService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public RescueRequestController(RescueRequestService rescueRequestService,
                                   UserRepository userRepository,
                                   NotificationService notificationService) {
        this.rescueRequestService = rescueRequestService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ========== CITIZEN APIs ==========

    @PostMapping
    @Operation(summary = "Tạo yêu cầu cứu hộ", description = "Citizen gửi yêu cầu cứu hộ kèm vị trí, mô tả, hình ảnh")
    public ApiResponse<RescueRequestResponse> createRequest(
            Authentication auth,
            @Valid @RequestBody CreateRescueRequestDTO request) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        RescueRequestResponse response = rescueRequestService.createRescueRequest(user.getId(), request);
        return ApiResponse.success("Rescue request created successfully", response);
    }

    @GetMapping("/my-requests")
    @Operation(summary = "Xem yêu cầu của tôi", description = "Citizen xem danh sách yêu cầu cứu hộ đã gửi")
    public ApiResponse<List<RescueRequestResponse>> getMyRequests(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ApiResponse.success("User requests retrieved", rescueRequestService.getUserRescueRequests(user.getId()));
    }

    @PatchMapping("/{id}/confirm-rescued")
    @Operation(summary = "Xác nhận đã được cứu hộ", description = "Citizen xác nhận đã được cứu hộ / nhận cứu trợ")
    public ApiResponse<RescueRequestResponse> confirmRescued(@PathVariable Long id) {
        RescueRequestResponse response = rescueRequestService.updateRescueRequestStatus(id, "COMPLETED");
        return ApiResponse.success("Confirmed rescued successfully", response);
    }

    // ========== COORDINATOR APIs ==========

    @GetMapping
    @Operation(summary = "Lấy tất cả yêu cầu cứu hộ", description = "Coordinator/Admin xem tất cả yêu cầu")
    public ApiResponse<List<RescueRequestResponse>> getAllRequests() {
        return ApiResponse.success("All rescue requests retrieved", rescueRequestService.getAllRescueRequests());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết yêu cầu", description = "Xem thông tin chi tiết 1 yêu cầu cứu hộ")
    public ApiResponse<RescueRequestResponse> getRequestById(@PathVariable Long id) {
        return ApiResponse.success("Rescue request retrieved", rescueRequestService.getRescueRequestById(id));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Lọc yêu cầu theo trạng thái", description = "Lọc yêu cầu theo: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED")
    public ApiResponse<List<RescueRequestResponse>> getByStatus(@PathVariable String status) {
        return ApiResponse.success("Requests by status", rescueRequestService.getRescueRequestsByStatus(status));
    }

    @PatchMapping("/{id}/assign")
    @Operation(summary = "Giao yêu cầu cho đội cứu hộ", description = "Coordinator phân công đội cứu hộ xử lý yêu cầu")
    public ApiResponse<RescueRequestResponse> assignTeam(
            @PathVariable Long id,
            @RequestBody AssignTeamRequest request) {
        RescueRequestResponse response = rescueRequestService.assignRescueRequestToTeam(id, request.getTeamId());
        return ApiResponse.success("Team assigned successfully", response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái yêu cầu", description = "Coordinator cập nhật trạng thái xử lý yêu cầu")
    public ApiResponse<RescueRequestResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        RescueRequestResponse response = rescueRequestService.updateRescueRequestStatus(id, request.getStatus());
        return ApiResponse.success("Status updated successfully", response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật yêu cầu cứu hộ", description = "Cập nhật thông tin yêu cầu cứu hộ")
    public ApiResponse<RescueRequestResponse> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody CreateRescueRequestDTO request) {
        return ApiResponse.success("Request updated", rescueRequestService.updateRescueRequest(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa yêu cầu cứu hộ", description = "Xóa yêu cầu cứu hộ")
    public ApiResponse<Void> deleteRequest(@PathVariable Long id) {
        rescueRequestService.deleteRescueRequest(id);
        return ApiResponse.success("Rescue request deleted", null);
    }

    // ========== RESCUE TEAM APIs ==========

    @GetMapping("/team/{teamId}")
    @Operation(summary = "Xem nhiệm vụ của đội", description = "Rescue Team xem danh sách yêu cầu được phân công")
    public ApiResponse<List<RescueRequestResponse>> getTeamRequests(@PathVariable Long teamId) {
        return ApiResponse.success("Team requests retrieved", rescueRequestService.getRescueRequestsByTeam(teamId));
    }
}