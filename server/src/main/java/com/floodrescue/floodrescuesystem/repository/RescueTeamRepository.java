package com.floodrescue.floodrescuesystem.repository;

import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RescueTeamRepository extends JpaRepository<RescueTeam, Long> {
    
    List<RescueTeam> findByStatus(RescueTeam.TeamStatus status);
    
    List<RescueTeam> findByTeamLeaderId(Long teamLeaderId);

    /**
     * Tìm các đội cứu hộ ACTIVE gần nhất dựa trên công thức Haversine.
     * Khoảng cách được tính bằng km.
     * Chỉ trả về các đội có tọa độ (latitude, longitude NOT NULL).
     *
     * @param lat  Vĩ độ nạn nhân
     * @param lng  Kinh độ nạn nhân
     * @param limit Số đội tối đa trả về
     * @return Danh sách đội cứu hộ sắp xếp theo khoảng cách tăng dần
     */
    @Query(value = """
        SELECT t.* FROM rescue_teams t
        WHERE t.status = 'ACTIVE'
          AND t.latitude IS NOT NULL
          AND t.longitude IS NOT NULL
        ORDER BY (
            6371 * acos(
                cos(radians(:lat)) * cos(radians(t.latitude))
                * cos(radians(t.longitude) - radians(:lng))
                + sin(radians(:lat)) * sin(radians(t.latitude))
            )
        ) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<RescueTeam> findNearestActiveTeams(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("limit") int limit
    );

    /**
     * Kiểm tra extension PostGIS (throws nếu chưa cài).
     */
    @Query(value = "SELECT PostGIS_Version()", nativeQuery = true)
    String isPostgisAvailable();

    /**
     * Tìm đội ACTIVE gần nhất bằng PostGIS ST_Distance (geography, mét → km).
     */
    @Query(value = """
        SELECT t.* FROM rescue_teams t
        WHERE t.status = 'ACTIVE'
          AND t.latitude IS NOT NULL
          AND t.longitude IS NOT NULL
        ORDER BY ST_Distance(
            ST_SetSRID(ST_MakePoint(t.longitude, t.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        ) ASC
        LIMIT :limit
        """, nativeQuery = true)
    List<RescueTeam> findNearestActiveTeamsPostgis(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("limit") int limit
    );
}

