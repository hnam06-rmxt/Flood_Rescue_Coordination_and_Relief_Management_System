package com.floodrescue.floodrescuesystem.dto.request;

public class CancelRescueRequest {
    private String reason;

    public CancelRescueRequest() {}

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
