package com.eventplanner.events;

import com.eventplanner.geo.GeocodeResponse;
import com.eventplanner.geo.GeocodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class GeocodeBackfillJob {

    private final EventRepository eventRepository;
    private final GeocodeService geocodeService;

    // Run nightly at 02:15 AM server time
    @Scheduled(cron = "0 15 2 * * *")
    public void backfillMissingCoordinates() {
        int page = 0;
        int size = 200;
        int updatedCount = 0;
        while (true) {
            Pageable pageable = PageRequest.of(page, size);
            Page<Event> batch = eventRepository.findByLatitudeIsNullOrLongitudeIsNull(pageable);
            if (batch.isEmpty()) break;
            for (Event ev : batch.getContent()) {
                String city = ev.getCity();
                if (city == null || city.isBlank()) continue;
                try {
                    GeocodeResponse geo = geocodeService.geocodeCity(city);
                    if (geo != null) {
                        ev.setLatitude(geo.getLat());
                        ev.setLongitude(geo.getLon());
                        eventRepository.save(ev);
                        updatedCount++;
                    }
                } catch (Exception e) {
                    log.warn("Backfill geocode failed for event {} city {}: {}", ev.getId(), city, e.toString());
                }
            }
            if (!batch.hasNext()) break;
            page++;
        }
        if (updatedCount > 0) {
            log.info("Geocode backfill updated {} events with coordinates", updatedCount);
        }
    }
}
