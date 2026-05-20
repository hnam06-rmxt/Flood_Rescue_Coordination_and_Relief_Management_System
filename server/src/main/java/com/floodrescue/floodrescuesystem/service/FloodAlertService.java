package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.request.CreateFloodAlertRequest;
import com.floodrescue.floodrescuesystem.dto.response.FloodAlertResponse;
import com.floodrescue.floodrescuesystem.entity.FloodAlert;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.repository.FloodAlertRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class FloodAlertService {

    private final FloodAlertRepository floodAlertRepository;
    private final UserRepository userRepository;

    public FloodAlertService(FloodAlertRepository floodAlertRepository, UserRepository userRepository) {
        this.floodAlertRepository = floodAlertRepository;
        this.userRepository = userRepository;
    }

    @Cacheable(value = "floodAlerts", key = "'all'")
    public List<FloodAlertResponse> getAllAlerts() {
        return floodAlertRepository.findAll().stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Cacheable(value = "floodAlerts", key = "#id")
    public FloodAlertResponse getAlertById(Long id) {
        FloodAlert alert = floodAlertRepository.findById(id).orElseThrow(() -> new RuntimeException("Alert not found"));
        return mapToResponse(alert);
    }

    @org.springframework.beans.factory.annotation.Autowired
    private NotificationService notificationService;

    @CacheEvict(value = "floodAlerts", allEntries = true)
    public FloodAlertResponse createAlert(String username, CreateFloodAlertRequest request) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));
        FloodAlert alert = new FloodAlert();
        alert.setTitle(request.getTitle());
        alert.setDescription(request.getDescription());
        alert.setSeverity(request.getSeverity());
        alert.setLocationArea(request.getLocationArea());
        alert.setCreatedBy(user);
        FloodAlert saved = floodAlertRepository.save(alert);

        try {
            List<User> allUsers = userRepository.findAll();
            String severityLevel = "Cảnh báo";
            if ("EMERGENCY".equals(saved.getSeverity())) severityLevel = "🚨 KHẨN CẤP";
            else if ("WARNING".equals(saved.getSeverity())) severityLevel = "⚠️ CẢNH BÁO";
            else if ("WATCH".equals(saved.getSeverity())) severityLevel = "👀 THEO DÕI";
            else if ("ADVISORY".equals(saved.getSeverity())) severityLevel = "ℹ️ TƯ VẤN";

            for (User u : allUsers) {
                notificationService.createNotification(
                    u.getId(),
                    severityLevel + ": " + saved.getTitle(),
                    "Khu vực ảnh hưởng: " + saved.getLocationArea() + ". Chi tiết: " + saved.getDescription(),
                    "FLOOD_ALERT",
                    saved.getId()
                );
            }
        } catch (Exception e) {
            // Safe fallback
        }

        return mapToResponse(saved);
    }

    @CacheEvict(value = "floodAlerts", allEntries = true)
    public FloodAlertResponse updateAlert(Long id, CreateFloodAlertRequest request) {
        FloodAlert alert = floodAlertRepository.findById(id).orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setTitle(request.getTitle());
        alert.setDescription(request.getDescription());
        alert.setSeverity(request.getSeverity());
        alert.setLocationArea(request.getLocationArea());
        FloodAlert saved = floodAlertRepository.save(alert);
        return mapToResponse(saved);
    }

    @CacheEvict(value = "floodAlerts", allEntries = true)
    public void deleteAlert(Long id) {
        floodAlertRepository.deleteById(id);
    }

    private FloodAlertResponse mapToResponse(FloodAlert alert) {
        FloodAlertResponse res = new FloodAlertResponse();
        res.setId(alert.getId());
        res.setTitle(alert.getTitle());
        res.setDescription(alert.getDescription());
        res.setSeverity(alert.getSeverity());
        res.setLocationArea(alert.getLocationArea());
        res.setStartTime(alert.getStartTime());
        res.setEndTime(alert.getEndTime());
        if (alert.getCreatedBy() != null) {
            res.setCreatedBy(alert.getCreatedBy().getId());
        }
        res.setCreatedAt(alert.getCreatedAt());
        return res;
    }
}
