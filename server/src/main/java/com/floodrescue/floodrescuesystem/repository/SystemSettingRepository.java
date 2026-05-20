package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.SystemSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
