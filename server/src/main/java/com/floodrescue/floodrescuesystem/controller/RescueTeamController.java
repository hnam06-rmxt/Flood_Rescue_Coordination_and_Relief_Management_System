package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.CreateRescueTeamRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.RescueTeamResponse;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import com.floodrescue.floodrescuesystem.service.RescueTeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rescue-teams")
@Tag(name = "Rescue Teams", description = "Quản lý đội cứu hộ")
public class RescueTeamController {

    private final RescueTeamService rescueTeamService;
    private final UserRepository userRepository;

    public RescueTeamController(RescueTeamService rescueTeamService, UserRepository userRepository) {
        this.rescueTeamService = rescueTeamService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Tạo đội cứu hộ", description = "Tạo đội cứu hộ mới với đội trưởng")
    public ApiResponse<RescueTeamResponse> createTeam(@Valid @RequestBody CreateRescueTeamRequest request) {
        return ApiResponse.success("Team created successfully", rescueTeamService.createTeam(request));
    }

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER', 'RESCUER')")
    @Operation(summary = "Danh sách đội cứu hộ", description = "Xem tất cả đội cứu hộ")
    public ApiResponse<List<RescueTeamResponse>> getAllTeams() {
        return ApiResponse.success("All teams retrieved", rescueTeamService.getAllTeams());
    }

    @GetMapping("/assigned-to-me")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('CITIZEN')")
    @Operation(summary = "Đội cứu hộ đang phụ trách ca của tôi", description = "Citizen xem vị trí đội được gán cho yêu cầu cứu hộ của mình")
    public ApiResponse<List<RescueTeamResponse>> getTeamsAssignedToMe(Authentication auth) {
        User user = userRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ApiResponse.success("Assigned teams retrieved", rescueTeamService.getTeamsAssignedToCitizen(user.getId()));
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER', 'RESCUER', 'CITIZEN')")
    @Operation(summary = "Chi tiết đội cứu hộ", description = "Xem chi tiết 1 đội cứu hộ")
    public ApiResponse<RescueTeamResponse> getTeamById(@PathVariable Long id) {
        return ApiResponse.success("Team retrieved", rescueTeamService.getTeamById(id));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Cập nhật đội cứu hộ", description = "Cập nhật thông tin đội cứu hộ")
    public ApiResponse<RescueTeamResponse> updateTeam(
            @PathVariable Long id,
            @Valid @RequestBody CreateRescueTeamRequest request) {
        return ApiResponse.success("Team updated successfully", rescueTeamService.updateTeam(id, request));
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'RESCUER')")
    @Operation(summary = "Cập nhật trạng thái đội", description = "Cập nhật trạng thái: ACTIVE, INACTIVE, ON_DUTY")
    public ApiResponse<RescueTeamResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ApiResponse.success("Team status updated", rescueTeamService.updateTeamStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR')")
    @Operation(summary = "Xóa đội cứu hộ", description = "Xóa đội cứu hộ")
    public ApiResponse<Void> deleteTeam(@PathVariable Long id) {
        rescueTeamService.deleteTeam(id);
        return ApiResponse.success("Team deleted", null);
    }

    @PatchMapping("/{id}/location")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'RESCUER')")
    @Operation(summary = "Cập nhật vị trí đội cứu hộ", description = "Cập nhật vị trí GPS thực tế")
    public ApiResponse<RescueTeamResponse> updateLocation(
            @PathVariable Long id,
            @RequestBody com.floodrescue.floodrescuesystem.dto.request.UpdateLocationRequest request) {
        return ApiResponse.success("Team location updated", rescueTeamService.updateTeamLocation(id, request.getLatitude(), request.getLongitude()));
    }
}
