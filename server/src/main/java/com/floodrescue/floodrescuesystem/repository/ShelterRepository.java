package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShelterRepository extends JpaRepository<Shelter, Long> {
}
