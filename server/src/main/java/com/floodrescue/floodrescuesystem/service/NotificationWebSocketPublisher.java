package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.response.NotificationResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationWebSocketPublisher {

    private static final Logger log = LoggerFactory.getLogger(NotificationWebSocketPublisher.class);

    private final SimpMessagingTemplate messagingTemplate;

    public NotificationWebSocketPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void pushToUser(Long userId, NotificationResponse notification) {
        if (userId == null || notification == null) {
            return;
        }
        try {
            messagingTemplate.convertAndSend("/topic/notifications/" + userId, notification);
        } catch (Exception e) {
            log.warn("WebSocket push failed for user {}: {}", userId, e.getMessage());
        }
    }
}
