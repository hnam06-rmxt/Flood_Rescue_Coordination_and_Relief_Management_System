package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.entity.SystemSetting;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import com.floodrescue.floodrescuesystem.service.SystemSettingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@Tag(name = "Settings", description = "Cấu hình hệ thống (lưu DB)")
public class SettingsController {

    @Autowired
    private SystemSettingService settingService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Lấy tất cả cấu hình", description = "Admin xem toàn bộ cấu hình hệ thống")
    public ApiResponse<List<SystemSetting>> getAllSettings() {
        return ApiResponse.success("Settings retrieved", settingService.getAllSettings());
    }

    @GetMapping("/public")
    @Operation(summary = "Lấy cấu hình public", description = "Tất cả role có thể xem cấu hình không nhạy cảm")
    public ApiResponse<List<SystemSetting>> getPublicSettings() {
        // Chỉ trả về các key không nhạy cảm
        List<SystemSetting> all = settingService.getAllSettings();
        List<SystemSetting> pub = all.stream()
            .filter(s -> !s.getKey().toLowerCase().contains("secret")
                      && !s.getKey().toLowerCase().contains("password")
                      && !s.getKey().toLowerCase().contains("token"))
            .toList();
        return ApiResponse.success("Public settings retrieved", pub);
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật một cấu hình", description = "Admin cập nhật giá trị cấu hình theo key")
    public ApiResponse<SystemSetting> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).map(u -> u.getId()).orElse(null);
        String value = body.get("value");
        String description = body.get("description");
        SystemSetting updated = settingService.upsertSetting(key, value, description, userId);
        return ApiResponse.success("Setting updated", updated);
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật nhiều cấu hình cùng lúc", description = "Admin lưu nhiều settings từ trang cấu hình")
    public ApiResponse<Void> bulkUpdate(
            @RequestBody Map<String, String> settings,
            Authentication auth) {
        Long userId = userRepository.findByUsername(auth.getName()).map(u -> u.getId()).orElse(null);
        settingService.bulkUpsert(settings, userId);
        return ApiResponse.success("Settings saved", null);
    }

    @DeleteMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa cấu hình", description = "Admin xóa một setting theo key")
    public ApiResponse<Void> deleteSetting(@PathVariable String key) {
        settingService.deleteSetting(key);
        return ApiResponse.success("Setting deleted", null);
    }
}
