package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.RescueTeam;
import java.time.LocalDateTime;

public class RescueTeamResponse {

    private Long teamId;
    private String teamName;
    private String description;
    private Long teamLeaderId;
    private String teamLeaderName;
    private Integer memberCount;
    private String status;
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
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
