package com.floodrescue.floodrescuesystem.dto.request;

public class UpdateStatusRequest {

    private String status;
    private String notes;

    public UpdateStatusRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
