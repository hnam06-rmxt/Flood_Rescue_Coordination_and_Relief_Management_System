package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.request.UpdateUserProfileRequest;
import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.UserProfileResponse;
import com.floodrescue.floodrescuesystem.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Profile", description = "Quản lý thông tin cá nhân")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Xem thông tin cá nhân", description = "Xem profile người dùng đang đăng nhập")
    public ApiResponse<UserProfileResponse> getMyProfile(Authentication authentication) {
        return ApiResponse.success(
                "User profile retrieved successfully",
                userService.getCurrentUserProfile(authentication.getName())
        );
    }

    @PatchMapping("/me")
    @Operation(summary = "Cập nhật thông tin cá nhân", description = "Cập nhật tên, email, số điện thoại, địa chỉ, avatar")
    public ApiResponse<UserProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        return ApiResponse.success(
                "User profile updated successfully",
                userService.updateCurrentUserProfile(authentication.getName(), request)
        );
    }
}
