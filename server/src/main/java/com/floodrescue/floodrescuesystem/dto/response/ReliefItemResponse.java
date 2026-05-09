package com.floodrescue.floodrescuesystem.dto.response;

import com.floodrescue.floodrescuesystem.entity.ReliefItem;
import java.time.LocalDateTime;

public class ReliefItemResponse {

    private Long id;
    private String name;
    private String category;
    private String unit;
    private Integer quantityInStock;
    private Integer minimumStockLevel;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public ReliefItemResponse() {}

    public static ReliefItemResponse fromEntity(ReliefItem item) {
        ReliefItemResponse r = new ReliefItemResponse();
        r.id = item.getId();
        r.name = item.getName();
        r.category = item.getCategory();
        r.unit = item.getUnit();
        r.quantityInStock = item.getQuantityInStock();
        r.minimumStockLevel = item.getMinimumStockLevel();
        r.description = item.getDescription();
        r.createdAt = item.getCreatedAt();
        r.updatedAt = item.getUpdatedAt();
        return r;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getQuantityInStock() { return quantityInStock; }
    public void setQuantityInStock(Integer quantityInStock) { this.quantityInStock = quantityInStock; }
    public Integer getMinimumStockLevel() { return minimumStockLevel; }
    public void setMinimumStockLevel(Integer minimumStockLevel) { this.minimumStockLevel = minimumStockLevel; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
