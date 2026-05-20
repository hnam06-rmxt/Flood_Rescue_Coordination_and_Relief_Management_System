package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.ReliefDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReliefDistributionRepository extends JpaRepository<ReliefDistribution, Long> {

    List<ReliefDistribution> findByItemId(Long itemId);

    List<ReliefDistribution> findByDistributedById(Long userId);

    List<ReliefDistribution> findByRescueRequestRequestId(Long requestId);

    List<ReliefDistribution> findByDistributedAtBetween(LocalDateTime start, LocalDateTime end);
}
