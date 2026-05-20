package com.floodrescue.floodrescuesystem.entity;

public enum UrgencyLevel {
    LOW("Thấp"),
    MEDIUM("Trung bình"),
    HIGH("Cao"),
    CRITICAL("Rất cao");

    private final String displayName;

    UrgencyLevel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
