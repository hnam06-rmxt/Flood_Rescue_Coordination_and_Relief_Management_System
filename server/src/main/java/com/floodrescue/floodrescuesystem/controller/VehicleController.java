package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.CreateVehicleRequest;
import com.floodrescue.floodrescuesystem.dto.request.AssignTeamRequest;
import com.floodrescue.floodrescuesystem.dto.request.UpdateStatusRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.VehicleResponse;
import com.floodrescue.floodrescuesystem.service.VehicleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@Tag(name = "Vehicles", description = "Quản lý phương tiện cứu hộ")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    @Operation(summary = "Thêm phương tiện", description = "Thêm phương tiện cứu hộ mới")
    public ApiResponse<VehicleResponse> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        return ApiResponse.success("Vehicle created", vehicleService.createVehicle(request));
    }

    @GetMapping
    @Operation(summary = "Danh sách phương tiện", description = "Xem tất cả phương tiện cứu hộ")
    public ApiResponse<List<VehicleResponse>> getAllVehicles() {
        return ApiResponse.success("All vehicles retrieved", vehicleService.getAllVehicles());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết phương tiện", description = "Xem chi tiết 1 phương tiện")
    public ApiResponse<VehicleResponse> getVehicleById(@PathVariable Long id) {
        return ApiResponse.success("Vehicle retrieved", vehicleService.getVehicleById(id));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Lọc theo trạng thái", description = "Lọc phương tiện theo: AVAILABLE, IN_USE, MAINTENANCE, DECOMMISSIONED")
    public ApiResponse<List<VehicleResponse>> getByStatus(@PathVariable String status) {
        return ApiResponse.success("Vehicles by status", vehicleService.getVehiclesByStatus(status));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái", description = "Cập nhật trạng thái phương tiện")
    public ApiResponse<VehicleResponse> updateStatus(
            @PathVariable Long id,
            @RequestBody UpdateStatusRequest request) {
        return ApiResponse.success("Vehicle status updated", vehicleService.updateVehicleStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/assign-team")
    @Operation(summary = "Giao phương tiện cho đội", description = "Giao phương tiện cho một đội cứu hộ")
    public ApiResponse<VehicleResponse> assignToTeam(
            @PathVariable Long id,
            @RequestBody AssignTeamRequest request) {
        return ApiResponse.success("Vehicle assigned to team", vehicleService.assignVehicleToTeam(id, request.getTeamId()));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa phương tiện", description = "Xóa phương tiện cứu hộ")
    public ApiResponse<Void> deleteVehicle(@PathVariable Long id) {
        vehicleService.deleteVehicle(id);
        return ApiResponse.success("Vehicle deleted", null);
    }
}
