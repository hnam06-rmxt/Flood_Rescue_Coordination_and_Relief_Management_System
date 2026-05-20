package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.RescueRequest;
import com.floodrescue.floodrescuesystem.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RescueRequestRepository extends JpaRepository<RescueRequest, Long> {
    
    List<RescueRequest> findByUserId(Long userId);
    
    List<RescueRequest> findByStatus(RequestStatus status);
    
    List<RescueRequest> findByAssignedTeamTeamId(Long teamId);
    
    List<RescueRequest> findByCreatedTimeBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<RescueRequest> findByStatusAndAssignedTeamTeamId(RequestStatus status, Long teamId);
}
