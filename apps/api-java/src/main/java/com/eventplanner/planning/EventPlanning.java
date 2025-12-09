package com.eventplanner.planning;

import com.eventplanner.events.Event;
import com.eventplanner.geo.Location;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "event_planning")
public class EventPlanning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "event_id", unique = true, nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Location location;

    @Column(name = "budget_inr")
    private Double budgetInr;

    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate(){ this.updatedAt = OffsetDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    public Double getBudgetInr() { return budgetInr; }
    public void setBudgetInr(Double budgetInr) { this.budgetInr = budgetInr; }
    public Integer getExpectedAttendees() { return expectedAttendees; }
    public void setExpectedAttendees(Integer expectedAttendees) { this.expectedAttendees = expectedAttendees; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
