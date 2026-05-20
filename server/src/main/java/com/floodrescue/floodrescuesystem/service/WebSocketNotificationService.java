package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.response.RescueRequestResponse;
import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Service push thông báo real-time qua WebSocket STOMP.
 * - /topic/sos-updates: broadcast cho tất cả staff (Coordinator, Admin, Manager)
 * - /topic/map-refresh: broadcast cập nhật map
 * - /queue/notifications/{userId}: gửi riêng cho từng user
 */
@Service
public class WebSocketNotificationService {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Broadcast SOS mới đến tất cả staff đang xem dashboard/map.
     */
    public void broadcastSosAlert(RescueRequestResponse request) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "SOS_NEW");
            payload.put("requestId", request.getRequestId());
            payload.put("userName", request.getUserName());
            payload.put("location", request.getLocation());
            payload.put("urgencyLevel", request.getUrgencyLevel() != null ? request.getUrgencyLevel().name() : "MEDIUM");
            payload.put("latitude", request.getLatitude());
            payload.put("longitude", request.getLongitude());
            payload.put("numberOfPeople", request.getNumberOfPeople());
            payload.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/sos-updates", payload);
        } catch (Exception e) {
            // Không để lỗi WebSocket ảnh hưởng nghiệp vụ chính
        }
    }

    /**
     * Broadcast cập nhật trạng thái SOS (dùng cho map refresh và list refresh).
     */
    public void broadcastStatusUpdate(Long requestId, String newStatus, Long assignedTeamId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "STATUS_UPDATE");
            payload.put("requestId", requestId);
            payload.put("newStatus", newStatus);
            payload.put("assignedTeamId", assignedTeamId);
            payload.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/sos-updates", payload);
            messagingTemplate.convertAndSend("/topic/map-refresh", payload);
        } catch (Exception e) {
            // Safe fallback
        }
    }

    /**
     * Broadcast vị trí đội cứu hộ (cho citizen theo dõi real-time).
     */
    public void broadcastTeamLocation(Long teamId, String teamName, Double latitude, Double longitude) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "TEAM_LOCATION");
            payload.put("teamId", teamId);
            payload.put("teamName", teamName);
            payload.put("latitude", latitude);
            payload.put("longitude", longitude);
            payload.put("timestamp", LocalDateTime.now().toString());

            messagingTemplate.convertAndSend("/topic/map-refresh", payload);
        } catch (Exception e) {
            // Safe fallback
        }
    }

    /**
     * Gửi thông báo riêng đến một user cụ thể.
     */
    public void pushToUser(Long userId, String type, String title, String message, Long referenceId) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", type);
            payload.put("title", title);
            payload.put("message", message);
            payload.put("referenceId", referenceId);
            payload.put("timestamp", LocalDateTime.now().toString());

            // Gửi đến /user/{userId}/queue/notifications
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/notifications",
                payload
            );
        } catch (Exception e) {
            // Safe fallback
        }
    }
    /**
     * Thông báo cập nhật trạng thái và push đến user liên quan.
     * Convenience method kết hợp broadcastStatusUpdate + pushToUser.
     */
    public void notifyStatusUpdate(Long requestId, String newStatus, Long citizenUserId, String location) {
        try {
            // Broadcast cho staff
            broadcastStatusUpdate(requestId, newStatus, null);
            // Push riêng cho citizen
            if (citizenUserId != null) {
                String title = "Cập nhật SOS #" + requestId;
                String message = "Yêu cầu của bạn tại " + location + " đã được cập nhật: " + newStatus;
                pushToUser(citizenUserId, "STATUS_UPDATE", title, message, requestId);
            }
        } catch (Exception e) {
            // Safe fallback
        }
    }
}
