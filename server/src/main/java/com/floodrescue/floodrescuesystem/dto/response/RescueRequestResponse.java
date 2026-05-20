package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.RequestStatus;
import com.floodrescue.floodrescuesystem.entity.UrgencyLevel;
import java.time.LocalDateTime;

public class RescueRequestResponse {

    private Long requestId;
    private Long userId;
    private String userName;
    private String description;
    private String location;
    private Double latitude;
    private Double longitude;
    private String image;
    private Integer numberOfPeople;
    private UrgencyLevel urgencyLevel;
    private RequestStatus status;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
    private Long assignedTeamId;
    private String assignedTeamName;
    private String notes;
    private String proofImageUrl;

    public RescueRequestResponse() {}

    public RescueRequestResponse(Long requestId, Long userId, String userName,
                                String description, String location,
                                Double latitude, Double longitude,
                                String image, UrgencyLevel urgencyLevel,
                                RequestStatus status, LocalDateTime createdTime) {
        this.requestId = requestId;
        this.userId = userId;
        this.userName = userName;
        this.description = description;
        this.location = location;
        this.latitude = latitude;
        this.longitude = longitude;
        this.image = image;
        this.urgencyLevel = urgencyLevel;
        this.status = status;
        this.createdTime = createdTime;
    }

    // Getters and Setters
    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Integer getNumberOfPeople() {
        return numberOfPeople;
    }

    public void setNumberOfPeople(Integer numberOfPeople) {
        this.numberOfPeople = numberOfPeople;
    }

    public UrgencyLevel getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(UrgencyLevel urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public void setStatus(RequestStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedTime() {
        return createdTime;
    }

    public void setCreatedTime(LocalDateTime createdTime) {
        this.createdTime = createdTime;
    }

    public LocalDateTime getUpdatedTime() {
        return updatedTime;
    }

    public void setUpdatedTime(LocalDateTime updatedTime) {
        this.updatedTime = updatedTime;
    }

    public Long getAssignedTeamId() {
        return assignedTeamId;
    }

    public void setAssignedTeamId(Long assignedTeamId) {
        this.assignedTeamId = assignedTeamId;
    }

    public String getAssignedTeamName() {
        return assignedTeamName;
    }

    public void setAssignedTeamName(String assignedTeamName) {
        this.assignedTeamName = assignedTeamName;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getProofImageUrl() {
        return proofImageUrl;
    }

    public void setProofImageUrl(String proofImageUrl) {
        this.proofImageUrl = proofImageUrl;
    }
}
