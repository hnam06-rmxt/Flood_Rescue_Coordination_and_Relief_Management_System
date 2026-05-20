package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.FloodAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FloodAlertRepository extends JpaRepository<FloodAlert, Long> {
}
