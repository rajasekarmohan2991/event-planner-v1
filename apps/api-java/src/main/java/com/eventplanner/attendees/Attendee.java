package com.eventplanner.attendees;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "event_attendees")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Attendee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String email;

    @Column
    private String phone;

    @Column(nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING / CONFIRMED / DECLINED / WAITLISTED

    @Column(name = "answers", columnDefinition = "jsonb")
    private String answersJson;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
