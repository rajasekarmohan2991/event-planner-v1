package com.eventplanner.registration;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "registration_custom_fields",
        uniqueConstraints = @UniqueConstraint(name = "uq_reg_field_event_key", columnNames = {"event_id", "field_key"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RegistrationCustomField {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "field_key", nullable = false, length = 64)
    private String key;

    @Column(name = "label", nullable = false, length = 255)
    private String label;

    @Column(name = "field_type", nullable = false, length = 24)
    private String type;

    @Column(name = "required", nullable = false)
    @Builder.Default
    private boolean required = false;

    @Column(name = "options")
    private String optionsJson; // store JSON as text; DB column is JSONB

    @Column(name = "order_index", nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(name = "visibility", nullable = false, length = 24)
    @Builder.Default
    private String visibility = "PUBLIC";

    @Column(name = "logic")
    private String logicJson; // conditional logic JSON

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }
}
