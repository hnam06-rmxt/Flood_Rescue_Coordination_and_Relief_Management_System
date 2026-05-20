package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.ReliefDistribution;
import java.time.LocalDateTime;

public class DistributionResponse {

    private Long id;
    private Long itemId;
    private String itemName;
    private Integer quantity;
    private String recipientName;
    private String recipientLocation;
    private Long distributedById;
    private String distributedByName;
    private Long rescueRequestId;
    private String notes;
    private LocalDateTime distributedAt;

    public DistributionResponse() {}

    public static DistributionResponse fromEntity(ReliefDistribution d) {
        DistributionResponse r = new DistributionResponse();
        r.id = d.getId();
        r.quantity = d.getQuantity();
        r.recipientName = d.getRecipientName();
        r.recipientLocation = d.getRecipientLocation();
        r.notes = d.getNotes();
        r.distributedAt = d.getDistributedAt();
        if (d.getItem() != null) {
            r.itemId = d.getItem().getId();
            r.itemName = d.getItem().getName();
        }
        if (d.getDistributedBy() != null) {
            r.distributedById = d.getDistributedBy().getId();
            r.distributedByName = d.getDistributedBy().getFullName();
        }
        if (d.getRescueRequest() != null) {
            r.rescueRequestId = d.getRescueRequest().getRequestId();
        }
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getItemName() { return itemName; }
    public void setItemName(String itemName) { this.itemName = itemName; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }
    public String getRecipientLocation() { return recipientLocation; }
    public void setRecipientLocation(String recipientLocation) { this.recipientLocation = recipientLocation; }
    public Long getDistributedById() { return distributedById; }
    public void setDistributedById(Long distributedById) { this.distributedById = distributedById; }
    public String getDistributedByName() { return distributedByName; }
    public void setDistributedByName(String distributedByName) { this.distributedByName = distributedByName; }
    public Long getRescueRequestId() { return rescueRequestId; }
    public void setRescueRequestId(Long rescueRequestId) { this.rescueRequestId = rescueRequestId; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public LocalDateTime getDistributedAt() { return distributedAt; }
    public void setDistributedAt(LocalDateTime distributedAt) { this.distributedAt = distributedAt; }
}
