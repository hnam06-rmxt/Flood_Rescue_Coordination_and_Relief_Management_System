package com.floodrescue.floodrescuesystem.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class CreateDistributionRequest {

    @NotNull(message = "Item ID is required")
    private Long itemId;

    @NotNull(message = "Quantity is required")
    @Min(value = 1, message = "Quantity must be >= 1")
    private Integer quantity;

    private String recipientName;
    private String recipientLocation;
    private Long rescueRequestId;
    private String notes;

    public CreateDistributionRequest() {}

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientLocation() { return recipientLocation; }
    public void setRecipientLocation(String recipientLocation) { this.recipientLocation = recipientLocation; }

    public Long getRescueRequestId() { return rescueRequestId; }
    public void setRescueRequestId(Long rescueRequestId) { this.rescueRequestId = rescueRequestId; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
