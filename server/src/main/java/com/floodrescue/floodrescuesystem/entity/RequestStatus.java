package com.floodrescue.floodrescuesystem.entity;

public enum RequestStatus {
    PENDING("Đang chờ"),
    VERIFIED("Đã xác minh"),
    ASSIGNED("Được giao"),
    IN_PROGRESS("Đang xử lý"),
    COMPLETED("Hoàn thành"),
    RELIEF_RECEIVED("Đã nhận cứu trợ"),
    CANCELLED("Bị hủy"),
    REJECTED("Bị từ chối");

    private final String displayName;

    RequestStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
