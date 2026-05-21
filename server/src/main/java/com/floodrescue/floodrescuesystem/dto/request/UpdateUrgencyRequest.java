package com.floodrescue.floodrescuesystem.dto.request;

public class UpdateUrgencyRequest {
    private String urgencyLevel;

    public UpdateUrgencyRequest() {}

    public String getUrgencyLevel() {
        return urgencyLevel;
    }

    public void setUrgencyLevel(String urgencyLevel) {
        this.urgencyLevel = urgencyLevel;
    }
}
