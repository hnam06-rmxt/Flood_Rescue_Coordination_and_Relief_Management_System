package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.entity.SystemSetting;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.SystemSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class SystemSettingService {

    @Autowired
    private SystemSettingRepository settingRepository;

    public List<SystemSetting> getAllSettings() {
        return settingRepository.findAll();
    }

    public SystemSetting getSetting(String key) {
        return settingRepository.findById(key)
                .orElseThrow(() -> new ResourceNotFoundException("Setting not found: " + key));
    }

    public String getSettingValue(String key, String defaultValue) {
        return settingRepository.findById(key)
                .map(SystemSetting::getValue)
                .orElse(defaultValue);
    }

    @Transactional
    public SystemSetting upsertSetting(String key, String value, String description, Long updatedBy) {
        SystemSetting setting = settingRepository.findById(key)
                .orElse(new SystemSetting(key, value, description));
        setting.setValue(value);
        setting.setUpdatedBy(updatedBy);
        if (description != null) setting.setDescription(description);
        return settingRepository.save(setting);
    }

    @Transactional
    public void bulkUpsert(Map<String, String> settings, Long updatedBy) {
        settings.forEach((key, value) -> upsertSetting(key, value, null, updatedBy));
    }

    @Transactional
    public void deleteSetting(String key) {
        settingRepository.deleteById(key);
    }
}
