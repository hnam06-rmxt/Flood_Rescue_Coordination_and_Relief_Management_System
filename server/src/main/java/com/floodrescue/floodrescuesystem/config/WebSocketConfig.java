package com.floodrescue.floodrescuesystem.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Cấu hình WebSocket STOMP broker cho thông báo real-time.
 * - Endpoint: /ws (với SockJS fallback)
 * - App prefix: /app (client gửi message lên server)
 * - Topic prefix: /topic (broadcast), /queue (personal)
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable in-memory broker với 2 prefix: /topic (broadcast) và /queue (personal)
        config.enableSimpleBroker("/topic", "/queue");
        // Prefix cho message gửi từ client lên server
        config.setApplicationDestinationPrefixes("/app");
        // Prefix cho message cá nhân (user-specific)
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:3000", "*")
                .withSockJS();
    }
}
