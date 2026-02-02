package com.eventplanner.microsite;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "microsite_sections")
public class MicrositeSection {

    public enum SectionType { HERO, ABOUT, SCHEDULE, SPEAKERS, SPONSORS, FAQ, CUSTOM }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private SectionType type;

    private String title;

    @Column(name = "position", nullable = false)
    private Integer position = 0;

    @Column(columnDefinition = "TEXT")
    private String content; // JSON string payload

    @Column(name = "visible", nullable = false)
    private Boolean visible = true;

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
    public SectionType getType() { return type; }
    public void setType(SectionType type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public Integer getPosition() { return position; }
    public void setPosition(Integer position) { this.position = position; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Boolean getVisible() { return visible; }
    public void setVisible(Boolean visible) { this.visible = visible; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
