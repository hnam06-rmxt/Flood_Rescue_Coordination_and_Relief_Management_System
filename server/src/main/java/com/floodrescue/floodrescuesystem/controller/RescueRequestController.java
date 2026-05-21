package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.AssignTeamRequest;
import com.floodrescue.floodrescuesystem.dto.request.CancelRescueRequest;
import com.floodrescue.floodrescuesystem.dto.request.CompleteRescueRequest;
import com.floodrescue.floodrescuesystem.dto.request.CreateRescueRequestDTO;
import com.floodrescue.floodrescuesystem.dto.request.RejectRescueRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateUrgencyRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.NearbyTeamSuggestion;
import com.floodrescue.floodrescuesystem.dto.response.RescueRequestResponse;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import com.floodrescue.floodrescuesystem.service.NearbyTeamService;
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
    private final NearbyTeamService nearbyTeamService;

    public RescueRequestController(RescueRequestService rescueRequestService,
                                   UserRepository userRepository,
                                   NearbyTeamService nearbyTeamService) {
        this.rescueRequestService = rescueRequestService;
        this.userRepository = userRepository;
        this.nearbyTeamService = nearbyTeamService;
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
    public ApiResponse<RescueRequestResponse> confirmRescued(@PathVariable Long id, Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        RescueRequestResponse response = rescueRequestService.confirmRescued(id, user.getId());
        return ApiResponse.success("Confirmed rescued successfully", response);
    }

    @PatchMapping("/{id}/relief-received")
    @Operation(summary = "Xác nhận đã nhận cứu trợ", description = "Citizen xác nhận đã nhận được hàng cứu trợ")
    public ApiResponse<RescueRequestResponse> markReliefReceived(
            @PathVariable Long id, Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ApiResponse.success("Relief received confirmed", rescueRequestService.markReliefReceived(id, user.getId()));
    }

    @PatchMapping("/{id}/location")
    @Operation(summary = "Cập nhật vị trí SOS", description = "Citizen gửi ping vị trí liên tục khi nguy cấp")
    public ApiResponse<RescueRequestResponse> updateLocation(@PathVariable Long id, @RequestBody java.util.Map<String, Double> location) {
        RescueRequestResponse response = rescueRequestService.updateLocation(id, location.get("latitude"), location.get("longitude"));
        return ApiResponse.success("Location updated successfully", response);
    }

    // ========== COORDINATOR APIs ==========

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER', 'RESCUER')")
    @Operation(summary = "Lấy tất cả yêu cầu cứu hộ", description = "Coordinator/Admin xem tất cả yêu cầu")
    public ApiResponse<List<RescueRequestResponse>> getAllRequests() {
        return ApiResponse.success("All rescue requests retrieved", rescueRequestService.getAllRescueRequests());
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER', 'RESCUER', 'CITIZEN')")
    @Operation(summary = "Xem chi tiết yêu cầu", description = "Xem thông tin chi tiết 1 yêu cầu cứu hộ")
    public ApiResponse<RescueRequestResponse> getRequestById(@PathVariable Long id) {
        return ApiResponse.success("Rescue request retrieved", rescueRequestService.getRescueRequestById(id));
    }

    @GetMapping("/status/{status}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER', 'RESCUER')")
    @Operation(summary = "Lọc yêu cầu theo trạng thái", description = "Lọc yêu cầu theo: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED")
    public ApiResponse<List<RescueRequestResponse>> getByStatus(@PathVariable String status) {
        return ApiResponse.success("Requests by status", rescueRequestService.getRescueRequestsByStatus(status));
    }

    /**
     * API gợi ý đội cứu hộ gần nhất.
     * Coordinator chọn 1 yêu cầu cứu hộ → hệ thống tính toán và đưa ra 3-5 đội ACTIVE gần nhất.
     * Sử dụng Redis Geo (nhanh) + PostgreSQL Haversine (fallback).
     */
    @GetMapping("/{id}/nearby-teams")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(
            summary = "Gợi ý đội cứu hộ gần nhất",
            description = "Hệ thống tự động tính toán bằng Redis Geo + Haversine và đưa ra " +
                    "danh sách 3-5 đội cứu hộ ACTIVE gần nạn nhân nhất, sắp xếp theo khoảng cách tăng dần."
    )
    public ApiResponse<List<NearbyTeamSuggestion>> getNearbyTeams(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "5") Integer limit) {
        List<NearbyTeamSuggestion> suggestions = nearbyTeamService.findNearestTeams(id, limit);
        return ApiResponse.success(
                "Tìm thấy " + suggestions.size() + " đội cứu hộ gần nhất",
                suggestions
        );
    }

    @PatchMapping("/{id}/assign")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Giao yêu cầu cho đội cứu hộ", description = "Coordinator phân công đội cứu hộ xử lý yêu cầu")
    public ApiResponse<RescueRequestResponse> assignTeam(
            @PathVariable Long id,
            @RequestBody AssignTeamRequest request) {
        RescueRequestResponse response = rescueRequestService.assignRescueRequestToTeam(id, request.getTeamId());
        return ApiResponse.success("Team assigned successfully", response);
    }

    @PatchMapping("/{id}/verify")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Xác minh SOS hợp lệ", description = "Coordinator xác minh yêu cầu SOS là hợp lệ trước khi phân công")
    public ApiResponse<RescueRequestResponse> verifyRequest(
            @PathVariable Long id,
            @RequestBody(required = false) UpdateStatusRequest request) {
        String notes = request != null ? request.getNotes() : null;
        return ApiResponse.success("Request verified", rescueRequestService.verifyRequest(id, notes));
    }

    @PatchMapping("/{id}/start")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'RESCUER')")
    @Operation(summary = "Bắt đầu cứu hộ", description = "Đội cứu hộ chuyển ca được phân công sang đang xử lý")
    public ApiResponse<RescueRequestResponse> startRescue(@PathVariable Long id) {
        return ApiResponse.success("Rescue request started", rescueRequestService.startRescue(id));
    }

    @PatchMapping("/{id}/reject")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Từ chối SOS", description = "Coordinator từ chối yêu cầu SOS không hợp lệ")
    public ApiResponse<RescueRequestResponse> rejectRequest(
            @PathVariable Long id,
            @RequestBody(required = false) RejectRescueRequest request) {
        String reason = request != null ? request.getReason() : null;
        return ApiResponse.success("Request rejected", rescueRequestService.rejectRequest(id, reason));
    }

    @PatchMapping("/{id}/cancel")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'CITIZEN')")
    @Operation(summary = "Hủy yêu cầu SOS", description = "Citizen hủy yêu cầu của mình hoặc staff hủy ca không thể tiếp tục")
    public ApiResponse<RescueRequestResponse> cancelRequest(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody(required = false) CancelRescueRequest request) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        boolean isCitizen = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CITIZEN") || a.getAuthority().equals("CITIZEN"));
        String reason = request != null ? request.getReason() : null;
        RescueRequestResponse response = rescueRequestService.cancelRequest(id, user.getId(), isCitizen, reason);
        return ApiResponse.success("Request cancelled", response);
    }

    @PatchMapping("/{id}/complete")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'RESCUER')")
    @Operation(summary = "Hoàn thành cứu hộ", description = "Rescuer/Coordinator hoàn thành ca cứu hộ kèm ghi chú và ảnh minh chứng")
    public ApiResponse<RescueRequestResponse> completeRequest(
            @PathVariable Long id,
            @RequestBody(required = false) CompleteRescueRequest request) {
        String notes = request != null ? request.getNotes() : null;
        String proofImageUrl = request != null ? request.getProofImageUrl() : null;
        RescueRequestResponse response = rescueRequestService.completeRequest(id, notes, proofImageUrl);
        return ApiResponse.success("Request completed", response);
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'RESCUER', 'CITIZEN')")
    @Operation(summary = "Cập nhật trạng thái yêu cầu", description = "Cập nhật trạng thái xử lý yêu cầu")
    public ApiResponse<RescueRequestResponse> updateStatus(
            Authentication auth,
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        
        RescueRequestResponse currentRequest = rescueRequestService.getRescueRequestById(id);
        
        boolean isCitizen = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_CITIZEN") || a.getAuthority().equals("CITIZEN"));
        
        if (isCitizen) {
            if (!currentRequest.getUserId().equals(user.getId())) {
                throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền sửa đổi yêu cầu của người khác!");
            }
            if (!"CANCELLED".equalsIgnoreCase(request.getStatus())) {
                throw new com.floodrescue.floodrescuesystem.exception.BadRequestException("Người dân chỉ có quyền Hủy yêu cầu của chính mình!");
            }
        }

        RescueRequestResponse response = rescueRequestService.updateRescueRequestStatus(
                id, request.getStatus(), request.getNotes(), request.getProofImageUrl());
        return ApiResponse.success("Status updated successfully", response);

    }

    @PatchMapping("/{id}/urgency")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Cập nhật mức độ khẩn cấp", description = "Coordinator thay đổi mức độ khẩn cấp của yêu cầu")
    public ApiResponse<RescueRequestResponse> updateUrgency(
            @PathVariable Long id,
            @RequestBody UpdateUrgencyRequest request) {
        RescueRequestResponse response = rescueRequestService.updateRescueRequestUrgency(id, request.getUrgencyLevel());
        return ApiResponse.success("Urgency updated successfully", response);
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'CITIZEN')")
    @Operation(summary = "Cập nhật yêu cầu cứu hộ", description = "Cập nhật thông tin yêu cầu cứu hộ")
    public ApiResponse<RescueRequestResponse> updateRequest(
            @PathVariable Long id,
            @Valid @RequestBody CreateRescueRequestDTO request) {
        return ApiResponse.success("Request updated", rescueRequestService.updateRescueRequest(id, request));
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
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
