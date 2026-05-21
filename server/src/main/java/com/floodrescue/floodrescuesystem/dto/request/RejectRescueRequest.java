package com.floodrescue.floodrescuesystem.dto.request;

public class RejectRescueRequest {
    private String reason;

    public RejectRescueRequest() {}

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
