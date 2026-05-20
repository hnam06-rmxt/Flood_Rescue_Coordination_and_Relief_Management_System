package com.floodrescue.floodrescuesystem.dto.request;

import jakarta.validation.constraints.NotBlank;

public class CreateFloodAlertRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    private String description;

    @NotBlank(message = "Mức độ nghiêm trọng không được để trống")
    private String severity;

    @NotBlank(message = "Khu vực không được để trống")
    private String locationArea;

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getLocationArea() { return locationArea; }
    public void setLocationArea(String locationArea) { this.locationArea = locationArea; }
}
