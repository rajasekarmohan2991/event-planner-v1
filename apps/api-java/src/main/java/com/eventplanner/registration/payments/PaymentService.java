package com.eventplanner.registration.payments;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.eventplanner.registration.tickets.Ticket;
import com.eventplanner.registration.tickets.TicketRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class PaymentService {
    private final PaymentRepository repo;
    private final EventRepository events;
    private final TicketRepository tickets;
    private final ObjectMapper objectMapper;

    @Value("${stripe.secret.key:}")
    private String stripeSecretKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    public PaymentService(PaymentRepository repo, EventRepository events, TicketRepository tickets, ObjectMapper objectMapper) {
        this.repo = repo;
        this.events = events;
        this.tickets = tickets;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> listByEvent(Long eventId) {
        events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        return repo.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PaymentDto get(Long paymentId) {
        Payment p = repo.findById(paymentId).orElseThrow(() -> new NoSuchElementException("Payment not found"));
        return toDto(p);
    }

    @Transactional
    public PaymentDto createPaymentIntent(Long eventId, Long ticketId, Integer quantity, Map<String, Object> metadata) {
        Event e = events.findById(eventId).orElseThrow(() -> new NoSuchElementException("Event not found"));
        Ticket t = tickets.findById(ticketId).orElseThrow(() -> new NoSuchElementException("Ticket not found"));

        if (!t.getEvent().getId().equals(e.getId())) {
            throw new IllegalArgumentException("Ticket does not belong to event");
        }

        if (t.isFree()) {
            throw new IllegalArgumentException("Cannot create payment for free ticket");
        }

        // Calculate total amount (price * quantity)
        int totalAmount = t.getPriceInMinor() * quantity;

        try {
            // Create Stripe Payment Intent
            com.stripe.Stripe.apiKey = stripeSecretKey;
            com.stripe.model.PaymentIntent paymentIntent = com.stripe.model.PaymentIntent.create(
                com.stripe.param.PaymentIntentCreateParams.builder()
                    .setAmount((long) totalAmount)
                    .setCurrency(t.getCurrency().toLowerCase())
                    .putMetadata("eventId", e.getId().toString())
                    .putMetadata("ticketId", t.getId().toString())
                    .putMetadata("quantity", quantity.toString())
                    .putMetadata("eventName", e.getName())
                    .putMetadata("ticketName", t.getName())
                    .build()
            );

            // Save payment record
            Payment payment = Payment.builder()
                    .event(e)
                    .ticket(t)
                    .stripePaymentIntentId(paymentIntent.getId())
                    .amountInMinor(totalAmount)
                    .currency(t.getCurrency())
                    .status("PENDING")
                    .metadataJson(objectMapper.writeValueAsString(metadata))
                    .build();

            Payment saved = repo.save(payment);
            return toDto(saved);

        } catch (Exception ex) {
            throw new RuntimeException("Failed to create payment intent: " + ex.getMessage());
        }
    }

    @Transactional
    public void updatePaymentStatus(String stripePaymentIntentId, String status) {
        Payment payment = repo.findAll().stream()
                .filter(p -> stripePaymentIntentId.equals(p.getStripePaymentIntentId()))
                .findFirst()
                .orElseThrow(() -> new NoSuchElementException("Payment not found for intent: " + stripePaymentIntentId));

        payment.setStatus(status);
        repo.save(payment);
    }

    private PaymentDto toDto(Payment p) {
        PaymentDto d = new PaymentDto();
        d.id = p.getId();
        d.eventId = p.getEvent().getId();
        d.ticketId = p.getTicket().getId();
        d.ticketName = p.getTicket().getName();
        d.stripePaymentIntentId = p.getStripePaymentIntentId();
        d.amountInMinor = p.getAmountInMinor();
        d.currency = p.getCurrency();
        d.status = p.getStatus();
        d.metadataJson = p.getMetadataJson();
        d.createdAt = p.getCreatedAt();
        return d;
    }
}
