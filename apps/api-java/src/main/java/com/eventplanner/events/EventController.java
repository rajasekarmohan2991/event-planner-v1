package com.eventplanner.events;

import com.eventplanner.events.dto.EventRequest;
import com.eventplanner.events.dto.EventResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<Page<EventResponse>> getAllEvents(
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "eventMode", required = false) EventMode eventMode,
            @RequestParam(name = "page", required = false, defaultValue = "1") int page,
            @RequestParam(name = "limit", required = false, defaultValue = "10") int limit,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "sortBy", required = false) String sortBy,
            @RequestParam(name = "sortDir", required = false, defaultValue = "DESC") String sortDir) {
        // Convert 1-based page to 0-based index expected by Spring Data
        int pageIndex = Math.max(page - 1, 0);
        int pageSize = Math.max(Math.min(limit, 100), 1);
        // Determine sort field mapping and direction
        String field = (sortBy == null || sortBy.isBlank()) ? "createdAt" : sortBy;
        // Whitelist fields
        switch (field) {
            case "createdAt":
            case "updatedAt":
            case "startsAt":
            case "priceInr":
            case "name":
                break;
            default:
                field = "createdAt";
        }
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(pageIndex, pageSize, Sort.by(direction, field));
        
        // Check if user is super admin (can see all tenants)
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        
        if (search != null && !search.isBlank()) {
            return ResponseEntity.ok(eventService.searchEvents(null, search, pageable, tenantId, isSuperAdmin));
        }
        final String normalizedStatus = (status == null || status.isBlank()) ? null : status.toUpperCase(Locale.ROOT);
        boolean hasStatus = normalizedStatus != null;
        boolean hasMode = eventMode != null;
        if (hasStatus && hasMode) {
            return ResponseEntity.ok(eventService.getEventsByStatusAndMode(normalizedStatus, eventMode, pageable, tenantId, isSuperAdmin));
        } else if (hasStatus) {
            return ResponseEntity.ok(eventService.getEventsByStatus(normalizedStatus, pageable, tenantId, isSuperAdmin));
        } else if (hasMode) {
            return ResponseEntity.ok(eventService.getAllEventsByMode(eventMode, pageable, tenantId, isSuperAdmin));
        }
        return ResponseEntity.ok(eventService.getAllEvents(pageable, tenantId, isSuperAdmin));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        return ResponseEntity.ok(eventService.getEventById(id, tenantId, isSuperAdmin));
    }

    @PostMapping
    public ResponseEntity<EventResponse> createEvent(
            @Valid @RequestBody EventRequest request,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId) {
        return new ResponseEntity<>(eventService.createEvent(request, tenantId), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> updateEvent(
            @PathVariable("id") Long id, 
            @Valid @RequestBody EventRequest request,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        return ResponseEntity.ok(eventService.updateEvent(id, request, tenantId, isSuperAdmin));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEvent(
            @PathVariable("id") Long id,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        eventService.deleteEvent(id, tenantId, isSuperAdmin);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/purge")
    public ResponseEntity<Void> purgeEvent(@PathVariable("id") Long id) {
        eventService.purgeEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<EventResponse> cancelEvent(@PathVariable("id") Long id) {
        return ResponseEntity.ok(eventService.cancelEvent(id));
    }

    @PatchMapping("/{id}/trash")
    public ResponseEntity<EventResponse> trashEvent(@PathVariable("id") Long id) {
        return ResponseEntity.ok(eventService.trashEvent(id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<EventResponse> restoreEvent(@PathVariable("id") Long id) {
        return ResponseEntity.ok(eventService.restoreEvent(id));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<EventResponse> publishEvent(@PathVariable("id") Long id) {
        return ResponseEntity.ok(eventService.publishEvent(id));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<EventResponse>> searchEvents(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String query,
            Pageable pageable,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        return ResponseEntity.ok(eventService.searchEvents(city, query, pageable, tenantId, isSuperAdmin));
    }

    @GetMapping("/cities")
    public ResponseEntity<List<String>> getCities() {
        return ResponseEntity.ok(eventService.getCities());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<EventResponse>> getUpcomingEvents(
            @RequestParam(defaultValue = "10") int limit,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        return ResponseEntity.ok(eventService.getUpcomingEvents(limit, tenantId, isSuperAdmin));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getEventStats(
            @PathVariable("id") Long id,
            @RequestHeader(value = "x-tenant-id", required = false) String tenantId,
            @RequestHeader(value = "x-user-role", required = false) String userRole) {
        boolean isSuperAdmin = "SUPER_ADMIN".equals(userRole);
        EventResponse ev = eventService.getEventById(id, tenantId, isSuperAdmin);
        long daysToEvent = 0;
        if (ev.getStartsAt() != null) {
            LocalDate start = ev.getStartsAt().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
            LocalDate today = LocalDate.now();
            daysToEvent = Math.max(0, java.time.temporal.ChronoUnit.DAYS.between(today, start));
        }
        // Placeholder numeric values until ticketing/registrations are wired
        return ResponseEntity.ok(Map.of(
                "ticketSalesInr", 0,
                "registrations", 0,
                "daysToEvent", daysToEvent,
                "counts", Map.of(
                        "sessions", 0,
                        "speakers", 0,
                        "team", 0,
                        "sponsors", 0,
                        "exhibitors", 0,
                        "badges", 0
                )
        ));
    }

    @GetMapping("/{id}/registrations/trend")
    public ResponseEntity<List<Map<String, Object>>> getRegistrationTrend(@PathVariable("id") Long id) {
        // For now, return a 14-day series ending today with zero counts
        List<Map<String, Object>> series = new ArrayList<>();
        LocalDate today = LocalDate.now();
        for (int i = 13; i >= 0; i--) {
            LocalDate d = today.minusDays(i);
            series.add(Map.of(
                    "date", d.toString(),
                    "count", 0
            ));
        }
        return ResponseEntity.ok(series);
    }
}
