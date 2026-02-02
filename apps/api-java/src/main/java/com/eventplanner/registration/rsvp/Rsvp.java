package com.eventplanner.registration.rsvp;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "event_rsvps")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Rsvp {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "email", length = 150)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 16, nullable = false)
    private RsvpStatus status;

    @Column(name = "plus_one")
    @Builder.Default
    private Integer plusOne = 0;

    @Column(name = "answers_json", columnDefinition = "text")
    private String answersJson;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }
}
