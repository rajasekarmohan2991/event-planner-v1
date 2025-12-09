package com.eventplanner.registration.reports;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/events/{eventId}/reports")
@CrossOrigin(
        origins = {"http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"},
        allowCredentials = "true"
)
public class RegistrationReportsController {
    private final RegistrationReportsService service;

    public RegistrationReportsController(RegistrationReportsService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public ResponseEntity<RegistrationSummaryDto> getRegistrationSummary(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getRegistrationSummary(eventId));
    }

    @GetMapping("/ticket-sales")
    public ResponseEntity<java.util.List<TicketSalesDto>> getTicketSales(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getTicketSalesReport(eventId));
    }

    @GetMapping("/payments")
    public ResponseEntity<PaymentAnalyticsDto> getPaymentAnalytics(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getPaymentAnalytics(eventId));
    }

    @GetMapping("/promo-codes")
    public ResponseEntity<PromoCodeAnalyticsDto> getPromoCodeAnalytics(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getPromoCodeAnalytics(eventId));
    }

    @GetMapping("/trends")
    public ResponseEntity<RegistrationTrendsDto> getRegistrationTrends(@PathVariable Long eventId) {
        return ResponseEntity.ok(service.getRegistrationTrends(eventId));
    }
}
