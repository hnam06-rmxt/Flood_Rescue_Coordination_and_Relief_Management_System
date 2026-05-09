package com.floodrescue.floodrescuesystem.controller;

import com.floodrescue.floodrescuesystem.dto.response.ApiResponse;
import com.floodrescue.floodrescuesystem.dto.response.NotificationResponse;
import com.floodrescue.floodrescuesystem.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@Tag(name = "Notifications", description = "Quản lý thông báo người dùng")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @Operation(summary = "Danh sách thông báo", description = "Xem tất cả thông báo của người dùng hiện tại")
    public ApiResponse<List<NotificationResponse>> getMyNotifications(Authentication auth) {
        return ApiResponse.success("Notifications retrieved", notificationService.getMyNotifications(auth.getName()));
    }

    @GetMapping("/unread")
    @Operation(summary = "Thông báo chưa đọc", description = "Xem danh sách thông báo chưa đọc")
    public ApiResponse<List<NotificationResponse>> getUnreadNotifications(Authentication auth) {
        return ApiResponse.success("Unread notifications", notificationService.getMyUnreadNotifications(auth.getName()));
    }

    @GetMapping("/unread/count")
    @Operation(summary = "Đếm thông báo chưa đọc", description = "Đếm số thông báo chưa đọc")
    public ApiResponse<Long> countUnread(Authentication auth) {
        return ApiResponse.success("Unread count", notificationService.countUnread(auth.getName()));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Đánh dấu đã đọc", description = "Đánh dấu 1 thông báo là đã đọc")
    public ApiResponse<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ApiResponse.success("Notification marked as read", null);
    }

    @PatchMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả đã đọc", description = "Đánh dấu tất cả thông báo là đã đọc")
    public ApiResponse<Void> markAllAsRead(Authentication auth) {
        notificationService.markAllAsRead(auth.getName());
        return ApiResponse.success("All notifications marked as read", null);
    }
}
