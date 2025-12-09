package com.eventplanner.registration.payments;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events/{eventId}/payments")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class PaymentController {
    private final PaymentService service;

    @Value("${stripe.publishable.key:}")
    private String stripePublishableKey;

    public PaymentController(PaymentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<PaymentDto>> list(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.listByEvent(eventId));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDto> get(@PathVariable Long eventId, @PathVariable Long paymentId) {
        return ResponseEntity.ok(service.get(paymentId));
    }

    @PostMapping("/create-intent")
    public ResponseEntity<PaymentDto> createPaymentIntent(
            @PathVariable Long eventId,
            @RequestParam Long ticketId,
            @RequestParam(defaultValue = "1") Integer quantity,
            @RequestBody(required = false) Map<String, Object> metadata
    ) {
        return ResponseEntity.ok(service.createPaymentIntent(eventId, ticketId, quantity, metadata));
    }

    @GetMapping("/stripe-config")
    public ResponseEntity<Map<String, String>> getStripeConfig() {
        return ResponseEntity.ok(Map.of("publishableKey", stripePublishableKey));
    }
}
