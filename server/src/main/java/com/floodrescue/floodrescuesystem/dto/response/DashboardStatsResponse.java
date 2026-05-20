package com.floodrescue.floodrescuesystem.dto.response;

import java.io.Serializable;
import java.util.Map;

public class DashboardStatsResponse implements Serializable {

    private long totalRequests;
    private long pendingRequests;
    private long inProgressRequests;
    private long completedRequests;
    private long totalTeams;
    private long activeTeams;
    private long totalVehicles;
    private long availableVehicles;
    private long totalReliefItems;
    private long lowStockItems;
    private Map<String, Long> requestsByUrgency;

    public DashboardStatsResponse() {}

    public long getTotalRequests() { return totalRequests; }
    public void setTotalRequests(long totalRequests) { this.totalRequests = totalRequests; }
    public long getPendingRequests() { return pendingRequests; }
    public void setPendingRequests(long pendingRequests) { this.pendingRequests = pendingRequests; }
    public long getInProgressRequests() { return inProgressRequests; }
    public void setInProgressRequests(long inProgressRequests) { this.inProgressRequests = inProgressRequests; }
    public long getCompletedRequests() { return completedRequests; }
    public void setCompletedRequests(long completedRequests) { this.completedRequests = completedRequests; }
    public long getTotalTeams() { return totalTeams; }
    public void setTotalTeams(long totalTeams) { this.totalTeams = totalTeams; }
    public long getActiveTeams() { return activeTeams; }
    public void setActiveTeams(long activeTeams) { this.activeTeams = activeTeams; }
    public long getTotalVehicles() { return totalVehicles; }
    public void setTotalVehicles(long totalVehicles) { this.totalVehicles = totalVehicles; }
    public long getAvailableVehicles() { return availableVehicles; }
    public void setAvailableVehicles(long availableVehicles) { this.availableVehicles = availableVehicles; }
    public long getTotalReliefItems() { return totalReliefItems; }
    public void setTotalReliefItems(long totalReliefItems) { this.totalReliefItems = totalReliefItems; }
    public long getLowStockItems() { return lowStockItems; }
    public void setLowStockItems(long lowStockItems) { this.lowStockItems = lowStockItems; }
    public Map<String, Long> getRequestsByUrgency() { return requestsByUrgency; }
    public void setRequestsByUrgency(Map<String, Long> requestsByUrgency) { this.requestsByUrgency = requestsByUrgency; }
}
