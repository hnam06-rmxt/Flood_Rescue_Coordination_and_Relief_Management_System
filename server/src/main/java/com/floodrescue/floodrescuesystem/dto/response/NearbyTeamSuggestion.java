package com.floodrescue.floodrescuesystem.dto.response;

import java.io.Serializable;

/**
 * DTO chứa thông tin gợi ý đội cứu hộ gần nhất.
 * Bao gồm thông tin đội + khoảng cách tới nạn nhân.
 */
public class NearbyTeamSuggestion implements Serializable {

    private Long teamId;
    private String teamName;
    private String teamLeaderName;
    private Integer memberCount;
    private String status;
    private String contactPhone;
    private String currentLocation;
    private Double teamLatitude;
    private Double teamLongitude;
    private Double distanceKm;         // Khoảng cách tới nạn nhân (km)
    private String distanceDisplay;    // Hiển thị (ví dụ: "2.5 km")
    private java.util.List<String> vehicleNames;

    public NearbyTeamSuggestion() {}

    // Getters and Setters
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public String getTeamLeaderName() { return teamLeaderName; }
    public void setTeamLeaderName(String teamLeaderName) { this.teamLeaderName = teamLeaderName; }

    public Integer getMemberCount() { return memberCount; }
    public void setMemberCount(Integer memberCount) { this.memberCount = memberCount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }

    public Double getTeamLatitude() { return teamLatitude; }
    public void setTeamLatitude(Double teamLatitude) { this.teamLatitude = teamLatitude; }

    public Double getTeamLongitude() { return teamLongitude; }
    public void setTeamLongitude(Double teamLongitude) { this.teamLongitude = teamLongitude; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getDistanceDisplay() { return distanceDisplay; }
    public void setDistanceDisplay(String distanceDisplay) { this.distanceDisplay = distanceDisplay; }

    public java.util.List<String> getVehicleNames() { return vehicleNames; }
    public void setVehicleNames(java.util.List<String> vehicleNames) { this.vehicleNames = vehicleNames; }
}
