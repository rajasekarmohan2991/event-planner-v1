package com.eventplanner.registration.payments;

import com.eventplanner.events.Event;
import com.eventplanner.registration.tickets.Ticket;
import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "payments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @Column(name = "stripe_payment_intent_id", length = 255)
    private String stripePaymentIntentId;

    @Column(name = "amount_in_minor", nullable = false)
    private Integer amountInMinor; // e.g., paise for INR

    @Column(name = "currency", length = 10, nullable = false)
    @Builder.Default
    private String currency = "INR";

    @Column(name = "status", length = 24, nullable = false)
    @Builder.Default
    private String status = "PENDING"; // PENDING, PROCESSING, SUCCEEDED, FAILED, CANCELLED

    @Column(name = "metadata")
    private String metadataJson;

    @Column(name = "subtotal_in_minor")
    private Integer subtotalInMinor;

    @Column(name = "tax_amount_in_minor")
    private Integer taxAmountInMinor;

    @Column(name = "tax_rate_percent")
    private Integer taxRatePercent;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    @PreUpdate public void preUpdate() { this.updatedAt = OffsetDateTime.now(); }
}
