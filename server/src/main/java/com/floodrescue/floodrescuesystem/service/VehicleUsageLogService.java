package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.entity.VehicleUsageLog;
import com.floodrescue.floodrescuesystem.repository.VehicleUsageLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class VehicleUsageLogService {

    @Autowired
    private VehicleUsageLogRepository logRepository;

    public void log(Long vehicleId, String vehicleName, Long teamId, String teamName,
                    Long requestId, String action, String oldStatus, String newStatus,
                    String notes, Long loggedBy) {
        try {
            VehicleUsageLog log = new VehicleUsageLog(
                vehicleId, vehicleName, teamId, teamName,
                requestId, action, oldStatus, newStatus, notes, loggedBy
            );
            logRepository.save(log);
        } catch (Exception e) {
            // Non-critical — don't fail main operation
        }
    }

    public List<VehicleUsageLog> getLogsByVehicle(Long vehicleId) {
        return logRepository.findByVehicleIdOrderByLoggedAtDesc(vehicleId);
    }

    public List<VehicleUsageLog> getLogsByTeam(Long teamId) {
        return logRepository.findByTeamIdOrderByLoggedAtDesc(teamId);
    }

    public List<VehicleUsageLog> getAllLogs() {
        return logRepository.findAllByOrderByLoggedAtDesc();
    }

    public List<VehicleUsageLog> getLogsByDateRange(LocalDateTime from, LocalDateTime to) {
        return logRepository.findByLoggedAtBetweenOrderByLoggedAtDesc(from, to);
    }
}
