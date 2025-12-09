package com.eventplanner.events.metrics;

import com.eventplanner.events.Event;
import com.eventplanner.events.EventRepository;
import com.eventplanner.registration.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class EventMetricsService {
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;

    public EventStatsDto getStats(Long eventId) {
        Event e = eventRepository.findById(eventId).orElse(null);
        long daysToEvent = 0;
        if (e != null && e.getStartsAt() != null) {
            OffsetDateTime now = OffsetDateTime.now();
            if (e.getStartsAt().isAfter(now)) {
                daysToEvent = Math.max(0, ChronoUnit.DAYS.between(now.toLocalDate().atStartOfDay(now.getOffset()), e.getStartsAt()));
            }
        }
        Map<String, Integer> counts = new HashMap<>();
        counts.put("sessions", 0);
        counts.put("speakers", 0);
        counts.put("team", 0);
        counts.put("sponsors", 0);
        counts.put("exhibitors", 0);
        counts.put("badges", 0);
        long registrations = 0;
        try {
            registrations = registrationRepository.countByEventId(eventId);
        } catch (Exception ignored) {}

        return EventStatsDto.builder()
                .ticketSalesInr(0)
                .registrations(registrations)
                .daysToEvent(daysToEvent)
                .counts(counts)
                .build();
    }

    public List<TrendPoint> getRegistrationTrend(Long eventId) {
        // TODO: Replace with real aggregation when registrations are persisted
        // Return a 14-day series with zeros
        List<TrendPoint> list = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            String date = OffsetDateTime.now().minusDays(i).toLocalDate().toString();
            list.add(new TrendPoint(date, 0));
        }
        return list;
    }
}
