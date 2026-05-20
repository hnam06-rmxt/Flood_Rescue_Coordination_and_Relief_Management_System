package com.floodrescue.floodrescuesystem.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "relief_distributions")
public class ReliefDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private ReliefItem item;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "recipient_location")
    private String recipientLocation;

    @ManyToOne
    @JoinColumn(name = "distributed_by")
    private User distributedBy;

    @ManyToOne
    @JoinColumn(name = "rescue_request_id")
    private RescueRequest rescueRequest;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "distributed_at")
    private LocalDateTime distributedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public ReliefDistribution() {}

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.distributedAt == null) {
            this.distributedAt = LocalDateTime.now();
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ReliefItem getItem() { return item; }
    public void setItem(ReliefItem item) { this.item = item; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getRecipientName() { return recipientName; }
    public void setRecipientName(String recipientName) { this.recipientName = recipientName; }

    public String getRecipientLocation() { return recipientLocation; }
    public void setRecipientLocation(String recipientLocation) { this.recipientLocation = recipientLocation; }

    public User getDistributedBy() { return distributedBy; }
    public void setDistributedBy(User distributedBy) { this.distributedBy = distributedBy; }

    public RescueRequest getRescueRequest() { return rescueRequest; }
    public void setRescueRequest(RescueRequest rescueRequest) { this.rescueRequest = rescueRequest; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getDistributedAt() { return distributedAt; }
    public void setDistributedAt(LocalDateTime distributedAt) { this.distributedAt = distributedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
