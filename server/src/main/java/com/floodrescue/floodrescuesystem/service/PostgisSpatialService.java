package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

/**
 * Truy vấn không gian PostGIS (ST_Distance trên geography).
 * Tự tắt nếu PostgreSQL chưa cài extension postgis.
 */
@Service
public class PostgisSpatialService {

    private static final Logger log = LoggerFactory.getLogger(PostgisSpatialService.class);

    private final RescueTeamRepository rescueTeamRepository;

    @Value("${app.spatial.postgis-enabled:true}")
    private boolean postgisEnabled;

    private volatile Boolean postgisAvailable;

    public PostgisSpatialService(RescueTeamRepository rescueTeamRepository) {
        this.rescueTeamRepository = rescueTeamRepository;
    }

    public boolean isEnabled() {
        return postgisEnabled;
    }

    public boolean isAvailable() {
        if (!postgisEnabled) {
            return false;
        }
        if (postgisAvailable != null) {
            return postgisAvailable;
        }
        synchronized (this) {
            if (postgisAvailable != null) {
                return postgisAvailable;
            }
            try {
                rescueTeamRepository.isPostgisAvailable();
                postgisAvailable = true;
                log.info("PostGIS extension detected — spatial queries enabled");
            } catch (Exception e) {
                postgisAvailable = false;
                log.warn("PostGIS not available, using Haversine fallback: {}", e.getMessage());
            }
            return postgisAvailable;
        }
    }

    public List<RescueTeam> findNearestActiveTeams(double lat, double lng, int limit) {
        if (!isAvailable()) {
            return Collections.emptyList();
        }
        try {
            return rescueTeamRepository.findNearestActiveTeamsPostgis(lat, lng, limit);
        } catch (Exception e) {
            postgisAvailable = false;
            log.warn("PostGIS query failed: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
