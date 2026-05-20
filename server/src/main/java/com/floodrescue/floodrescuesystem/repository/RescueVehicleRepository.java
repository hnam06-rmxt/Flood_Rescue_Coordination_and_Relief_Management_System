package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.RescueVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RescueVehicleRepository extends JpaRepository<RescueVehicle, Long> {

    List<RescueVehicle> findByStatus(RescueVehicle.VehicleStatus status);

    List<RescueVehicle> findByAssignedTeamTeamId(Long teamId);

    List<RescueVehicle> findByType(String type);
}
