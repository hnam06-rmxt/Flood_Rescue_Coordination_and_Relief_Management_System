package com.floodrescue.floodrescuesystem.service;

import com.floodrescue.floodrescuesystem.dto.response.NearbyTeamSuggestion;
import com.floodrescue.floodrescuesystem.entity.RescueRequest;
import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import com.floodrescue.floodrescuesystem.entity.User;
import com.floodrescue.floodrescuesystem.exception.BadRequestException;
import com.floodrescue.floodrescuesystem.exception.ResourceNotFoundException;
import com.floodrescue.floodrescuesystem.repository.RescueRequestRepository;
import com.floodrescue.floodrescuesystem.repository.RescueTeamRepository;
import com.floodrescue.floodrescuesystem.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.geo.*;
import org.springframework.data.redis.connection.RedisGeoCommands;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service tìm kiếm đội cứu hộ gần nhất với yêu cầu cứu hộ.
 * <p>
 * Chiến lược 2 tầng:
 * <ol>
 *   <li><b>Redis Geo (nhanh)</b>: Lưu vị trí các đội ACTIVE trong Redis GeoSet.
 *       Dùng GEORADIUS để lọc nhanh trong bán kính → O(log(N) + M).</li>
 *   <li><b>PostgreSQL Haversine (chính xác, fallback)</b>: Nếu Redis không khả dụng
 *       hoặc không có kết quả → dùng native query Haversine trên DB.</li>
 * </ol>
 */
@Service
public class NearbyTeamService {

    private static final Logger log = LoggerFactory.getLogger(NearbyTeamService.class);

    /** Redis key lưu trữ Geo positions của các đội cứu hộ */
    private static final String GEO_KEY = "geo:rescue_teams";

    /** Bán kính tìm kiếm mặc định (km) */
    private static final double DEFAULT_SEARCH_RADIUS_KM = 100.0;

    /** Số đội tối đa gợi ý */
    private static final int DEFAULT_MAX_SUGGESTIONS = 5;

    private final RescueRequestRepository rescueRequestRepository;
    private final RescueTeamRepository rescueTeamRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final PostgisSpatialService postgisSpatialService;

    public NearbyTeamService(RescueRequestRepository rescueRequestRepository,
                             RescueTeamRepository rescueTeamRepository,
                             UserRepository userRepository,
                             RedisTemplate<String, Object> redisTemplate,
                             PostgisSpatialService postgisSpatialService) {
        this.rescueRequestRepository = rescueRequestRepository;
        this.rescueTeamRepository = rescueTeamRepository;
        this.userRepository = userRepository;
        this.redisTemplate = redisTemplate;
        this.postgisSpatialService = postgisSpatialService;
    }

    /**
     * Tìm 3-5 đội cứu hộ ACTIVE gần nhất với yêu cầu cứu hộ.
     *
     * @param requestId ID yêu cầu cứu hộ
     * @param maxResults Số đội tối đa (3-5, mặc định 5)
     * @return Danh sách đội gợi ý kèm khoảng cách
     */
    public List<NearbyTeamSuggestion> findNearestTeams(Long requestId, Integer maxResults) {
        RescueRequest request = rescueRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Yêu cầu cứu hộ không tồn tại với ID: " + requestId));

        if (request.getLatitude() == null || request.getLongitude() == null) {
            throw new BadRequestException(
                    "Yêu cầu cứu hộ chưa có tọa độ GPS. Vui lòng cập nhật vị trí.");
        }

        int limit = (maxResults != null && maxResults >= 3 && maxResults <= 10)
                ? maxResults : DEFAULT_MAX_SUGGESTIONS;

        double victimLat = request.getLatitude();
        double victimLng = request.getLongitude();

        // Đồng bộ vị trí đội cứu hộ vào Redis Geo
        syncTeamPositionsToRedis();

        // Bước 1: Thử tìm bằng Redis Geo (nhanh)
        List<NearbyTeamSuggestion> suggestions = findByRedisGeo(victimLat, victimLng, limit);

        // Bước 2: PostGIS (chính xác không gian) nếu Redis không có kết quả
        if (suggestions.isEmpty() && postgisSpatialService.isAvailable()) {
            log.info("Redis Geo không có kết quả, thử PostGIS ST_Distance");
            suggestions = findByPostgis(victimLat, victimLng, limit);
        }

        // Bước 3: Fallback Haversine trên PostgreSQL
        if (suggestions.isEmpty()) {
            log.info("Fallback sang PostgreSQL Haversine");
            suggestions = findByPostgresHaversine(victimLat, victimLng, limit);
        }

        return suggestions;
    }

    private List<NearbyTeamSuggestion> findByPostgis(double lat, double lng, int limit) {
        List<RescueTeam> teams = postgisSpatialService.findNearestActiveTeams(lat, lng, limit);
        return teams.stream()
                .map(team -> {
                    double distance = haversineDistance(lat, lng, team.getLatitude(), team.getLongitude());
                    return buildSuggestion(team, distance);
                })
                .sorted(Comparator.comparingDouble(NearbyTeamSuggestion::getDistanceKm))
                .collect(Collectors.toList());
    }

    /**
     * Đồng bộ vị trí tất cả đội cứu hộ ACTIVE vào Redis GeoSet.
     * Được gọi trước mỗi lần tìm kiếm để đảm bảo dữ liệu mới nhất.
     */
    public void syncTeamPositionsToRedis() {
        try {
            List<RescueTeam> activeTeams = rescueTeamRepository.findByStatus(RescueTeam.TeamStatus.ACTIVE);

            // Xóa geo set cũ và cập nhật mới
            redisTemplate.delete(GEO_KEY);

            for (RescueTeam team : activeTeams) {
                if (team.getLatitude() != null && team.getLongitude() != null) {
                    redisTemplate.opsForGeo().add(
                            GEO_KEY,
                            new Point(team.getLongitude(), team.getLatitude()),
                            "team:" + team.getTeamId()
                    );
                }
            }
            log.debug("Đã đồng bộ {} đội cứu hộ vào Redis Geo", activeTeams.size());
        } catch (Exception e) {
            log.warn("Không thể đồng bộ Redis Geo: {}", e.getMessage());
        }
    }

    /**
     * Tìm đội gần nhất bằng Redis GEORADIUS.
     */
    private List<NearbyTeamSuggestion> findByRedisGeo(double lat, double lng, int limit) {
        try {
            Circle circle = new Circle(
                    new Point(lng, lat),
                    new Distance(DEFAULT_SEARCH_RADIUS_KM, Metrics.KILOMETERS)
            );

            RedisGeoCommands.GeoRadiusCommandArgs args = RedisGeoCommands.GeoRadiusCommandArgs
                    .newGeoRadiusArgs()
                    .includeDistance()
                    .includeCoordinates()
                    .sortAscending()
                    .limit(limit);

            GeoResults<RedisGeoCommands.GeoLocation<Object>> results =
                    redisTemplate.opsForGeo().radius(GEO_KEY, circle, args);

            if (results == null || results.getContent().isEmpty()) {
                return new ArrayList<>();
            }

            List<NearbyTeamSuggestion> suggestions = new ArrayList<>();

            for (GeoResult<RedisGeoCommands.GeoLocation<Object>> result : results) {
                String member = result.getContent().getName().toString();
                Long teamId = Long.parseLong(member.replace("team:", ""));
                double distanceKm = result.getDistance().getValue();

                RescueTeam team = rescueTeamRepository.findById(teamId).orElse(null);
                if (team == null || team.getStatus() != RescueTeam.TeamStatus.ACTIVE) {
                    continue;
                }

                suggestions.add(buildSuggestion(team, distanceKm));
            }

            log.info("Redis Geo: tìm thấy {} đội gần nhất", suggestions.size());
            return suggestions;

        } catch (Exception e) {
            log.warn("Redis Geo lookup thất bại, sẽ fallback: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Tìm đội gần nhất bằng PostgreSQL Haversine (fallback).
     */
    private List<NearbyTeamSuggestion> findByPostgresHaversine(double lat, double lng, int limit) {
        List<RescueTeam> nearestTeams = rescueTeamRepository.findNearestActiveTeams(lat, lng, limit);

        return nearestTeams.stream()
                .map(team -> {
                    double distance = haversineDistance(lat, lng,
                            team.getLatitude(), team.getLongitude());
                    return buildSuggestion(team, distance);
                })
                .collect(Collectors.toList());
    }

    /**
     * Xây dựng NearbyTeamSuggestion từ entity RescueTeam.
     */
    private NearbyTeamSuggestion buildSuggestion(RescueTeam team, double distanceKm) {
        NearbyTeamSuggestion suggestion = new NearbyTeamSuggestion();
        suggestion.setTeamId(team.getTeamId());
        suggestion.setTeamName(team.getTeamName());
        suggestion.setMemberCount(team.getMemberCount());
        suggestion.setStatus(team.getStatus() != null ? team.getStatus().name() : null);
        suggestion.setContactPhone(team.getContactPhone());
        suggestion.setCurrentLocation(team.getCurrentLocation());
        suggestion.setTeamLatitude(team.getLatitude());
        suggestion.setTeamLongitude(team.getLongitude());
        suggestion.setDistanceKm(Math.round(distanceKm * 100.0) / 100.0); // Làm tròn 2 chữ số

        // Hiển thị khoảng cách
        if (distanceKm < 1.0) {
            suggestion.setDistanceDisplay(String.format("%.0f m", distanceKm * 1000));
        } else {
            suggestion.setDistanceDisplay(String.format("%.1f km", distanceKm));
        }

        // Tên đội trưởng
        if (team.getTeamLeaderId() != null) {
            String leaderName = userRepository.findById(team.getTeamLeaderId())
                    .map(User::getFullName).orElse("Chưa xác định");
            suggestion.setTeamLeaderName(leaderName);
        }

        // Danh sách phương tiện
        if (team.getVehicles() != null) {
            suggestion.setVehicleNames(
                    team.getVehicles().stream()
                            .map(v -> v.getName() + " (" + v.getType() + ")")
                            .collect(Collectors.toList())
            );
        } else {
            suggestion.setVehicleNames(new ArrayList<>());
        }

        return suggestion;
    }

    /**
     * Tính khoảng cách Haversine giữa 2 điểm (Java-side, dùng cho fallback).
     *
     * @return khoảng cách tính bằng km
     */
    private double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        final double R = 6371.0; // Bán kính Trái Đất (km)
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
