package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.CreateFloodAlertRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.FloodAlertResponse;
import com.floodrescue.floodrescuesystem.service.FloodAlertService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/flood-alerts")
public class FloodAlertController {

    private final FloodAlertService floodAlertService;

    public FloodAlertController(FloodAlertService floodAlertService) {
        this.floodAlertService = floodAlertService;
    }

    @GetMapping
    public ApiResponse<List<FloodAlertResponse>> getAllAlerts() {
        return ApiResponse.success("Fetched all alerts", floodAlertService.getAllAlerts());
    }

    @GetMapping("/{id}")
    public ApiResponse<FloodAlertResponse> getAlertById(@PathVariable Long id) {
        return ApiResponse.success("Fetched alert", floodAlertService.getAlertById(id));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER')")
    public ApiResponse<FloodAlertResponse> createAlert(Authentication auth, @Valid @RequestBody CreateFloodAlertRequest request) {
        return ApiResponse.success("Created alert", floodAlertService.createAlert(auth.getName(), request));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER')")
    public ApiResponse<FloodAlertResponse> updateAlert(@PathVariable Long id, @Valid @RequestBody CreateFloodAlertRequest request) {
        return ApiResponse.success("Updated alert", floodAlertService.updateAlert(id, request));
    }

    @DeleteMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'COORDINATOR', 'MANAGER')")
    public ApiResponse<Void> deleteAlert(@PathVariable Long id) {
        floodAlertService.deleteAlert(id);
        return ApiResponse.success("Deleted alert", null);
    }
}
