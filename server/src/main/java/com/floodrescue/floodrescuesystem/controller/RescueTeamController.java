package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.CreateRescueTeamRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.RescueTeamResponse;
import com.floodrescue.floodrescuesystem.service.RescueTeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rescue-teams")
@Tag(name = "Rescue Teams", description = "Quản lý đội cứu hộ")
public class RescueTeamController {

    private final RescueTeamService rescueTeamService;

    public RescueTeamController(RescueTeamService rescueTeamService) {
        this.rescueTeamService = rescueTeamService;
    }

    @PostMapping
    @Operation(summary = "Tạo đội cứu hộ", description = "Tạo đội cứu hộ mới với đội trưởng")
    public ApiResponse<RescueTeamResponse> createTeam(@Valid @RequestBody CreateRescueTeamRequest request) {
        return ApiResponse.success("Team created successfully", rescueTeamService.createTeam(request));
    }

    @GetMapping
    @Operation(summary = "Danh sách đội cứu hộ", description = "Xem tất cả đội cứu hộ")
    public ApiResponse<List<RescueTeamResponse>> getAllTeams() {
        return ApiResponse.success("All teams retrieved", rescueTeamService.getAllTeams());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết đội cứu hộ", description = "Xem chi tiết 1 đội cứu hộ")
    public ApiResponse<RescueTeamResponse> getTeamById(@PathVariable Long id) {
        return ApiResponse.success("Team retrieved", rescueTeamService.getTeamById(id));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái đội", description = "Cập nhật trạng thái: ACTIVE, INACTIVE, ON_DUTY")
    public ApiResponse<RescueTeamResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ApiResponse.success("Team status updated", rescueTeamService.updateTeamStatus(id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa đội cứu hộ", description = "Xóa đội cứu hộ")
    public ApiResponse<Void> deleteTeam(@PathVariable Long id) {
        rescueTeamService.deleteTeam(id);
        return ApiResponse.success("Team deleted", null);
    }
}
