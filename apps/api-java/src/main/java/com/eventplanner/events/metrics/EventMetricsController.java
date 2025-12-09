package com.eventplanner.events.metrics;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/events/{eventId}")
@RequiredArgsConstructor
public class EventMetricsController {

    private final EventMetricsService metricsService;

    @GetMapping("/stats")
    public ResponseEntity<EventStatsDto> getStats(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(metricsService.getStats(eventId));
    }

    @GetMapping("/registrations/trend")
    public ResponseEntity<List<TrendPoint>> getRegistrationTrend(@PathVariable("eventId") Long eventId) {
        return ResponseEntity.ok(metricsService.getRegistrationTrend(eventId));
    }
}
