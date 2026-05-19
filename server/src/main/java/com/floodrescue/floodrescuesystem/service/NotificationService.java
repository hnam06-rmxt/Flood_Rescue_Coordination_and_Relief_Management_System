package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.response.NotificationResponse;
import com.floodrescue.floodrescuesystem.entity.Notification;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.NotificationRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @org.springframework.transaction.annotation.Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void createNotification(Long userId, String title, String message, String type, Long referenceId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            System.out.println("WARNING: Skip creating notification, User not found with ID: " + userId);
            return;
        }

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setReferenceId(referenceId);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }

    public List<NotificationResponse> getMyNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getMyUnreadNotifications(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId()).stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public long countUnread(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + notificationId));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(user.getId());
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }
}
