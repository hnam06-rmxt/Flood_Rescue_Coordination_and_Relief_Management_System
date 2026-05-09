package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.RescueVehicle;
import java.time.LocalDateTime;

public class VehicleResponse {

    private Long id;
    private String name;
    private String type;
    private String licensePlate;
    private Integer capacity;
    private String currentLocation;
    private String status;
    private Long assignedTeamId;
    private String assignedTeamName;
    private String notes;
    private LocalDateTime createdAt;

    public VehicleResponse() {}

    public static VehicleResponse fromEntity(RescueVehicle v) {
        VehicleResponse r = new VehicleResponse();
        r.id = v.getId();
        r.name = v.getName();
        r.type = v.getType();
        r.licensePlate = v.getLicensePlate();
        r.capacity = v.getCapacity();
        r.currentLocation = v.getCurrentLocation();
        r.status = v.getStatus() != null ? v.getStatus().name() : null;
        r.notes = v.getNotes();
        r.createdAt = v.getCreatedAt();
        if (v.getAssignedTeam() != null) {
            r.assignedTeamId = v.getAssignedTeam().getTeamId();
            r.assignedTeamName = v.getAssignedTeam().getTeamName();
        }
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getCurrentLocation() { return currentLocation; }
    public void setCurrentLocation(String currentLocation) { this.currentLocation = currentLocation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getAssignedTeamId() { return assignedTeamId; }
    public void setAssignedTeamId(Long assignedTeamId) { this.assignedTeamId = assignedTeamId; }
    public String getAssignedTeamName() { return assignedTeamName; }
    public void setAssignedTeamName(String assignedTeamName) { this.assignedTeamName = assignedTeamName; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
