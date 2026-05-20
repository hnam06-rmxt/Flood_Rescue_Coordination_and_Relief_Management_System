package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.entity.VehicleUsageLog;
import com.floodrescue.floodrescuesystem.service.VehicleUsageLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@Tag(name = "Vehicle Usage Logs", description = "Nhật ký sử dụng phương tiện cứu hộ")
public class VehicleUsageLogController {

    @Autowired
    private VehicleUsageLogService usageLogService;

    @GetMapping("/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COORDINATOR')")
    @Operation(summary = "Toàn bộ nhật ký sử dụng xe", description = "Manager/Admin xem toàn bộ lịch sử sử dụng xe")
    public ApiResponse<List<VehicleUsageLog>> getAllLogs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        List<VehicleUsageLog> logs = (from != null && to != null)
                ? usageLogService.getLogsByDateRange(from, to)
                : usageLogService.getAllLogs();
        return ApiResponse.success("Vehicle usage logs retrieved", logs);
    }

    @GetMapping("/{id}/logs")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COORDINATOR')")
    @Operation(summary = "Nhật ký sử dụng theo xe", description = "Xem lịch sử sử dụng của một phương tiện cụ thể")
    public ApiResponse<List<VehicleUsageLog>> getLogsByVehicle(@PathVariable Long id) {
        return ApiResponse.success("Vehicle logs retrieved", usageLogService.getLogsByVehicle(id));
    }

    @GetMapping("/logs/team/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'COORDINATOR')")
    @Operation(summary = "Nhật ký sử dụng theo đội", description = "Xem tất cả xe đã được sử dụng bởi một đội cứu hộ")
    public ApiResponse<List<VehicleUsageLog>> getLogsByTeam(@PathVariable Long teamId) {
        return ApiResponse.success("Team vehicle logs retrieved", usageLogService.getLogsByTeam(teamId));
    }
}
