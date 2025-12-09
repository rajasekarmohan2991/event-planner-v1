package com.eventplanner.payments;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/payment-settings")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class PaymentSettingsController {
    private final PaymentSettingsService service;

    public PaymentSettingsController(PaymentSettingsService service) { this.service = service; }

    @GetMapping
    public ResponseEntity<PaymentSettings> get(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(service.get(eventId));
    }

    @PutMapping
    public ResponseEntity<PaymentSettings> update(@PathVariable("eventId") Long eventId, @RequestBody PaymentSettings body) {
        return ResponseEntity.ok(service.update(eventId, body));
    }
}
