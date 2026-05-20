package com.floodrescue.floodrescuesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Nhật ký sử dụng phương tiện cứu hộ.
 * Ghi lại mỗi lần xe được giao/trả/bảo trì để phục vụ thống kê nguồn lực.
 */
@Entity
@Table(name = "vehicle_usage_logs")
public class VehicleUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_id", nullable = false)
    private Long vehicleId;

    @Column(name = "vehicle_name")
    private String vehicleName;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "team_name")
    private String teamName;

    @Column(name = "request_id")
    private Long requestId;

    /**
     * Loại hành động: ASSIGNED, RETURNED, STATUS_CHANGED, MAINTENANCE
     */
    @Column(nullable = false, length = 30)
    private String action;

    @Column(name = "old_status", length = 30)
    private String oldStatus;

    @Column(name = "new_status", length = 30)
    private String newStatus;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "logged_by")
    private Long loggedBy;

    @Column(name = "logged_at")
    private LocalDateTime loggedAt;

    public VehicleUsageLog() {}

    public VehicleUsageLog(Long vehicleId, String vehicleName, Long teamId, String teamName,
                            Long requestId, String action, String oldStatus, String newStatus,
                            String notes, Long loggedBy) {
        this.vehicleId = vehicleId;
        this.vehicleName = vehicleName;
        this.teamId = teamId;
        this.teamName = teamName;
        this.requestId = requestId;
        this.action = action;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.notes = notes;
        this.loggedBy = loggedBy;
        this.loggedAt = LocalDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.loggedAt == null) this.loggedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getVehicleId() { return vehicleId; }
    public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getVehicleName() { return vehicleName; }
    public void setVehicleName(String vehicleName) { this.vehicleName = vehicleName; }
    public Long getTeamId() { return teamId; }
    public void setTeamId(Long teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }
    public Long getRequestId() { return requestId; }
    public void setRequestId(Long requestId) { this.requestId = requestId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getOldStatus() { return oldStatus; }
    public void setOldStatus(String oldStatus) { this.oldStatus = oldStatus; }
    public String getNewStatus() { return newStatus; }
    public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Long getLoggedBy() { return loggedBy; }
    public void setLoggedBy(Long loggedBy) { this.loggedBy = loggedBy; }
    public LocalDateTime getLoggedAt() { return loggedAt; }
    public void setLoggedAt(LocalDateTime loggedAt) { this.loggedAt = loggedAt; }
}
