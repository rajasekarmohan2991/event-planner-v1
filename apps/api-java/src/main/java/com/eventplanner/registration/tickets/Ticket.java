package com.eventplanner.registration.tickets;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "tickets")
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "group_id", length = 64)
    private String groupId;

    @Column(name = "is_free", nullable = false)
    private boolean free;

    @Column(name = "price_in_minor", nullable = false)
    private Integer priceInMinor = 0; // e.g., paise if INR

    @Column(name = "currency", length = 10)
    private String currency = "INR";

    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    @Column(name = "sold", nullable = false)
    private Integer sold = 0;

    @Column(name = "requires_approval", nullable = false)
    private boolean requiresApproval = false;

    @Column(name = "status", length = 24, nullable = false)
    private String status = "Open"; // Open | Closed | YetToStart

    @Column(name = "sales_start_at")
    private OffsetDateTime salesStartAt;

    @Column(name = "sales_end_at")
    private OffsetDateTime salesEndAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }
    public boolean isFree() { return free; }
    public void setFree(boolean free) { this.free = free; }
    public Integer getPriceInMinor() { return priceInMinor; }
    public void setPriceInMinor(Integer priceInMinor) { this.priceInMinor = priceInMinor; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getSold() { return sold; }
    public void setSold(Integer sold) { this.sold = sold; }
    public boolean isRequiresApproval() { return requiresApproval; }
    public void setRequiresApproval(boolean requiresApproval) { this.requiresApproval = requiresApproval; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getSalesStartAt() { return salesStartAt; }
    public void setSalesStartAt(OffsetDateTime salesStartAt) { this.salesStartAt = salesStartAt; }
    public OffsetDateTime getSalesEndAt() { return salesEndAt; }
    public void setSalesEndAt(OffsetDateTime salesEndAt) { this.salesEndAt = salesEndAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
