package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.VehicleUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface VehicleUsageLogRepository extends JpaRepository<VehicleUsageLog, Long> {
    List<VehicleUsageLog> findByVehicleIdOrderByLoggedAtDesc(Long vehicleId);
    List<VehicleUsageLog> findByTeamIdOrderByLoggedAtDesc(Long teamId);
    List<VehicleUsageLog> findByLoggedAtBetweenOrderByLoggedAtDesc(LocalDateTime from, LocalDateTime to);
    List<VehicleUsageLog> findAllByOrderByLoggedAtDesc();
}
