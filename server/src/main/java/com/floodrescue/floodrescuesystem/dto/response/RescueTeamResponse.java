package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import java.io.Serializable;
import java.time.LocalDateTime;

public class RescueTeamResponse implements Serializable {

    private Long teamId;
    private String teamName;
    private String description;
    private Long teamLeaderId;
    private String teamLeaderName;
    private Integer memberCount;
    private String status;
    private String contactPhone;
    private String currentLocation;
    private Double latitude;
    private Double longitude;
    private java.util.List<String> vehicleNames;
    private LocalDateTime createdAt;

    public RescueTeamResponse() {}

    public static RescueTeamResponse fromEntity(RescueTeam team, String leaderName) {
        RescueTeamResponse r = new RescueTeamResponse();
        r.teamId = team.getTeamId();
        r.teamName = team.getTeamName();
        r.description = team.getDescription();
        r.teamLeaderId = team.getTeamLeaderId();
        r.teamLeaderName = leaderName;
        r.memberCount = team.getMemberCount();
        r.status = team.getStatus() != null ? team.getStatus().name() : null;
        r.contactPhone = team.getContactPhone();
        r.currentLocation = team.getCurrentLocation();
        r.latitude = team.getLatitude();
        r.longitude = team.getLongitude();
        r.vehicleNames = team.getVehicles() != null ? 
            team.getVehicles().stream().map(v -> v.getName() + " (" + v.getType() + ")").collect(java.util.stream.Collectors.toList()) : 
            new java.util.ArrayList<>();
        r.createdAt = team.getCreatedAt();
        return r;
    }

    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getTeamLeaderId() { return teamLeaderId; }
    public void setTeamLeaderId(Long teamLeaderId) { this.teamLeaderId = teamLeaderId; }
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public java.util.List<String> getVehicleNames() { return vehicleNames; }
    public void setVehicleNames(java.util.List<String> vehicleNames) { this.vehicleNames = vehicleNames; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
