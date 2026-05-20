package com.floodrescue.floodrescuesystem.dto.request;

public class UpdateStatusRequest {

    private String status;
    private String notes;
    private String proofImageUrl;

    public UpdateStatusRequest() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getProofImageUrl() { return proofImageUrl; }
    public void setProofImageUrl(String proofImageUrl) { this.proofImageUrl = proofImageUrl; }
}
