package com.eventplanner.registration.promocodes;

import com.eventplanner.events.Event;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "promo_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PromoCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @Column(name = "code", nullable = false, length = 50, unique = true)
    private String code;

    @Column(name = "discount_type", nullable = false, length = 20)
    @Builder.Default
    private String discountType = "PERCENT"; // PERCENT, FIXED

    @Column(name = "discount_amount", nullable = false)
    private Integer discountAmount; // For PERCENT: percentage (0-100), For FIXED: amount in minor units

    @Column(name = "max_uses", nullable = false)
    @Builder.Default
    private Integer maxUses = -1; // -1 for unlimited

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private Integer usedCount = 0;

    @Column(name = "max_uses_per_user", nullable = false)
    @Builder.Default
    private Integer maxUsesPerUser = 1;

    @Column(name = "min_order_amount", nullable = false)
    @Builder.Default
    private Integer minOrderAmount = 0; // Minimum order amount in minor units

    @Column(name = "applicable_ticket_ids")
    private String applicableTicketIds; // JSON array of ticket IDs, null for all tickets

    @Column(name = "start_date")
    private OffsetDateTime startDate;

    @Column(name = "end_date")
    private OffsetDateTime endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }
}
