package com.eventplanner.registration;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "event_registration_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRegistrationSettings {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false, unique = true)
    private Event event;

    @Column(name = "is_open", nullable = false)
    @Builder.Default
    private boolean open = true;

    @Column(name = "deadline_at")
    private OffsetDateTime deadlineAt;

    @Column(name = "capacity")
    private Integer capacity;

    @Column(name = "waitlist_enabled", nullable = false)
    @Builder.Default
    private boolean waitlistEnabled = false;

    @Column(name = "require_rsvp", nullable = false)
    @Builder.Default
    private boolean requireRsvp = true;

    @Column(name = "confirmation_template_id")
    private Long confirmationTemplateId;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate
    public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }
}
