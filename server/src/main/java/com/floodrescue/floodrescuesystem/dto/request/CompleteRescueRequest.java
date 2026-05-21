package com.floodrescue.floodrescuesystem.dto.request;

public class CompleteRescueRequest {
    private String notes;
    private String proofImageUrl;

    public CompleteRescueRequest() {}

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
