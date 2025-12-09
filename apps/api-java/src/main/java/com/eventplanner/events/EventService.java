package com.eventplanner.events;

import com.eventplanner.events.dto.EventRequest;
import com.eventplanner.events.dto.EventResponse;
import com.eventplanner.events.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import com.eventplanner.geo.GeocodeService;
import com.eventplanner.geo.GeocodeResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventService {

    private final EventRepository eventRepository;
    private final EventCacheRepository eventCacheRepository;
    private final EventMapper eventMapper;
    private final GeocodeService geocodeService;

    @Transactional(readOnly = true)
    public Page<EventResponse> getAllEvents(Pageable pageable, String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            return eventRepository.findAll(pageable)
                    .map(this::toResponseWithComputedStatus);
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        return eventRepository.findByTenantId(tenantId, pageable)
                .map(this::toResponseWithComputedStatus);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> getAllEventsByMode(EventMode mode, Pageable pageable, String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            return eventRepository.findByEventMode(mode, pageable)
                    .map(this::toResponseWithComputedStatus);
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        return eventRepository.findByTenantIdAndEventMode(tenantId, mode, pageable)
                .map(this::toResponseWithComputedStatus);
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> getEventsByStatus(String statusKey, Pageable pageable, String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            switch (statusKey) {
                case "DRAFT":
                    return eventRepository.findDraft(pageable).map(this::toResponseWithComputedStatus);
                case "LIVE":
                    return eventRepository.findLive(pageable).map(this::toResponseWithComputedStatus);
                case "COMPLETED":
                    return eventRepository.findCompleted(pageable).map(this::toResponseWithComputedStatus);
                case "CANCELLED":
                    return eventRepository.findByStatus(EventStatus.CANCELLED, pageable).map(this::toResponseWithComputedStatus);
                case "TRASHED":
                    return eventRepository.findByStatus(EventStatus.TRASHED, pageable).map(this::toResponseWithComputedStatus);
                case "ALL":
                    return getAllEvents(pageable, tenantId, isSuperAdmin);
                default:
                    return getAllEvents(pageable, tenantId, isSuperAdmin);
            }
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        switch (statusKey) {
            case "DRAFT":
                return eventRepository.findDraftByTenantId(tenantId, pageable).map(this::toResponseWithComputedStatus);
            case "LIVE":
                return eventRepository.findLiveByTenantId(tenantId, pageable).map(this::toResponseWithComputedStatus);
            case "COMPLETED":
                return eventRepository.findCompletedByTenantId(tenantId, pageable).map(this::toResponseWithComputedStatus);
            case "CANCELLED":
                return eventRepository.findByTenantIdAndStatus(tenantId, EventStatus.CANCELLED, pageable).map(this::toResponseWithComputedStatus);
            case "TRASHED":
                return eventRepository.findByTenantIdAndStatus(tenantId, EventStatus.TRASHED, pageable).map(this::toResponseWithComputedStatus);
            case "ALL":
                return getAllEvents(pageable, tenantId, isSuperAdmin);
            default:
                return getAllEvents(pageable, tenantId, isSuperAdmin);
        }
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> getEventsByStatusAndMode(String statusKey, EventMode mode, Pageable pageable, String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            switch (statusKey) {
                case "DRAFT":
                    return eventRepository.findDraftByMode(mode, pageable).map(this::toResponseWithComputedStatus);
                case "LIVE":
                    return eventRepository.findLiveByMode(mode, pageable).map(this::toResponseWithComputedStatus);
                case "COMPLETED":
                    return eventRepository.findCompletedByMode(mode, pageable).map(this::toResponseWithComputedStatus);
                case "CANCELLED":
                    return eventRepository.findByStatusAndEventMode(EventStatus.CANCELLED, mode, pageable).map(this::toResponseWithComputedStatus);
                case "TRASHED":
                    return eventRepository.findByStatusAndEventMode(EventStatus.TRASHED, mode, pageable).map(this::toResponseWithComputedStatus);
                case "ALL":
                    return getAllEventsByMode(mode, pageable, tenantId, isSuperAdmin);
                default:
                    return getAllEventsByMode(mode, pageable, tenantId, isSuperAdmin);
            }
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        switch (statusKey) {
            case "DRAFT":
                return eventRepository.findDraftByTenantIdAndMode(tenantId, mode, pageable).map(this::toResponseWithComputedStatus);
            case "LIVE":
                return eventRepository.findLiveByTenantIdAndMode(tenantId, mode, pageable).map(this::toResponseWithComputedStatus);
            case "COMPLETED":
                return eventRepository.findCompletedByTenantIdAndMode(tenantId, mode, pageable).map(this::toResponseWithComputedStatus);
            case "CANCELLED":
                return eventRepository.findByTenantIdAndStatusAndEventMode(tenantId, EventStatus.CANCELLED, mode, pageable).map(this::toResponseWithComputedStatus);
            case "TRASHED":
                return eventRepository.findByTenantIdAndStatusAndEventMode(tenantId, EventStatus.TRASHED, mode, pageable).map(this::toResponseWithComputedStatus);
            case "ALL":
                return getAllEventsByMode(mode, pageable, tenantId, isSuperAdmin);
            default:
                return getAllEventsByMode(mode, pageable, tenantId, isSuperAdmin);
        }
    }

    @Transactional(readOnly = true)
    public EventResponse getEventById(Long id, String tenantId, boolean isSuperAdmin) {
        // Try to get from cache first
        Optional<Event> cachedEvent = eventCacheRepository.getCachedEvent(id);
        if (cachedEvent.isPresent()) {
            Event event = cachedEvent.get();
            // Verify tenant access
            if (!isSuperAdmin && !event.getTenantId().equals(tenantId)) {
                throw new SecurityException("Access denied: Event belongs to different tenant");
            }
            log.debug("Cache hit for event id: {}", id);
            return toResponseWithComputedStatus(event);
        }
        
        // If not in cache, get from database and cache it
        log.debug("Cache miss for event id: {}", id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        
        // Verify tenant access
        if (!isSuperAdmin && !event.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access denied: Event belongs to different tenant");
        }
        
        // Cache the event
        eventCacheRepository.cacheEvent(event);
        
        return eventMapper.toResponse(event);
    }

    @Transactional
    public EventResponse createEvent(EventRequest request, String tenantId) {
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        validateRequestByMode(request);
        Event event = eventMapper.toEntity(request);
        event.setTenantId(tenantId); // Set tenant from header
        event.setCreatedAt(OffsetDateTime.now());
        event.setUpdatedAt(OffsetDateTime.now());
        // Newly created events are DRAFT by default
        event.setStatus(EventStatus.DRAFT);
        // Populate coordinates if city present
        if (request.getCity() != null && !request.getCity().isBlank()) {
            GeocodeResponse geo = geocodeService.geocodeCity(request.getCity());
            if (geo != null) {
                event.setLatitude(geo.getLat());
                event.setLongitude(geo.getLon());
            }
        }
        Event savedEvent = eventRepository.save(event);
        
        // Cache the newly created event
        eventCacheRepository.cacheEvent(savedEvent);
        
        return toResponseWithComputedStatus(savedEvent);
    }

    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request, String tenantId, boolean isSuperAdmin) {
        // Invalidate cache for this event
        eventCacheRepository.evictEventFromCache(id);
        
        return eventRepository.findById(id)
                .map(existingEvent -> {
                    // Verify tenant ownership (unless super admin)
                    if (!isSuperAdmin && !existingEvent.getTenantId().equals(tenantId)) {
                        throw new SecurityException("Access denied: Event belongs to different tenant");
                    }
                    validateRequestByMode(request);
                    String oldCity = existingEvent.getCity();
                    String newCity = request.getCity();
                    eventMapper.updateEntity(request, existingEvent);
                    // If city changed (or was added/removed), recompute coordinates
                    boolean changed = (oldCity == null ? newCity != null && !newCity.isBlank() : !oldCity.equalsIgnoreCase(newCity == null ? "" : newCity));
                    if (changed) {
                        if (newCity != null && !newCity.isBlank()) {
                            GeocodeResponse geo = geocodeService.geocodeCity(newCity);
                            if (geo != null) {
                                existingEvent.setLatitude(geo.getLat());
                                existingEvent.setLongitude(geo.getLon());
                            }
                        } else {
                            existingEvent.setLatitude(null);
                            existingEvent.setLongitude(null);
                        }
                    }
                    existingEvent.setUpdatedAt(OffsetDateTime.now());
                    Event updatedEvent = eventRepository.save(existingEvent);
                    return toResponseWithComputedStatus(updatedEvent);
                })
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
    }

    private void validateRequestByMode(EventRequest request) {
        EventMode mode = request.getEventMode();
        if (mode == null) return; // @NotNull already enforces; guard anyway
        if (mode == EventMode.VIRTUAL) {
            // Allow city/venue/address to be null/blank
            return;
        }
        // IN_PERSON or HYBRID should include a city
        if (request.getCity() == null || request.getCity().isBlank()) {
            throw new IllegalArgumentException("City is required for in-person or hybrid events");
        }
    }

    @Transactional
    public void deleteEvent(Long id, String tenantId, boolean isSuperAdmin) {
        // Soft delete: mark as TRASHED
        eventCacheRepository.evictEventFromCache(id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        // Verify tenant ownership (unless super admin)
        if (!isSuperAdmin && !event.getTenantId().equals(tenantId)) {
            throw new SecurityException("Access denied: Event belongs to different tenant");
        }
        event.setStatus(EventStatus.TRASHED);
        event.setUpdatedAt(OffsetDateTime.now());
        eventRepository.save(event);
    }

    @Transactional
    public void purgeEvent(Long id) {
        // Hard delete: only allowed if already in TRASHED state
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        if (event.getStatus() != EventStatus.TRASHED) {
            throw new IllegalStateException("Only trashed events can be permanently deleted");
        }
        // Evict from cache first
        eventCacheRepository.evictEventFromCache(id);
        eventRepository.deleteById(id);
    }

    @Transactional
    public EventResponse cancelEvent(Long id) {
        eventCacheRepository.evictEventFromCache(id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        event.setStatus(EventStatus.CANCELLED);
        event.setUpdatedAt(OffsetDateTime.now());
        return toResponseWithComputedStatus(eventRepository.save(event));
    }

    @Transactional
    public EventResponse trashEvent(Long id) {
        eventCacheRepository.evictEventFromCache(id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        // Business rule: prevent trashing live events unless cancelled first
        if (event.getStatus() != EventStatus.CANCELLED) {
            java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
            boolean liveByTime = event.getStartsAt() != null && event.getEndsAt() != null &&
                    (now.isEqual(event.getStartsAt()) || now.isAfter(event.getStartsAt())) && now.isBefore(event.getEndsAt());
            if (liveByTime) {
                throw new IllegalStateException("Live events must be cancelled before moving to trash");
            }
        }
        event.setStatus(EventStatus.TRASHED);
        event.setUpdatedAt(OffsetDateTime.now());
        return toResponseWithComputedStatus(eventRepository.save(event));
    }

    @Transactional
    public EventResponse restoreEvent(Long id) {
        eventCacheRepository.evictEventFromCache(id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        // Clearing explicit TRASHED to let it compute based on time
        event.setStatus(null);
        event.setUpdatedAt(OffsetDateTime.now());
        return toResponseWithComputedStatus(eventRepository.save(event));
    }

    @Transactional
    public EventResponse publishEvent(Long id) {
        eventCacheRepository.evictEventFromCache(id);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));
        event.setStatus(EventStatus.LIVE);
        event.setUpdatedAt(OffsetDateTime.now());
        return toResponseWithComputedStatus(eventRepository.save(event));
    }

    @Transactional(readOnly = true)
    public Page<EventResponse> searchEvents(String city, String query, Pageable pageable, String tenantId, boolean isSuperAdmin) {
        if (isSuperAdmin) {
            if (city != null && !city.isEmpty()) {
                return eventRepository.findByCityIgnoreCase(city, pageable)
                        .map(this::toResponseWithComputedStatus);
            } else if (query != null && !query.isEmpty()) {
                return eventRepository.findByNameContainingIgnoreCaseOrVenueContainingIgnoreCaseOrAddressContainingIgnoreCase(
                                query, query, query, pageable)
                        .map(this::toResponseWithComputedStatus);
            }
            return eventRepository.findAll(pageable)
                    .map(this::toResponseWithComputedStatus);
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        if (query != null && !query.isEmpty()) {
            return eventRepository.searchByTenantId(tenantId, query, pageable)
                    .map(this::toResponseWithComputedStatus);
        }
        return eventRepository.findByTenantId(tenantId, pageable)
                .map(this::toResponseWithComputedStatus);
    }

    @Transactional(readOnly = true)
    public List<String> getCities() {
        return eventRepository.findDistinctCities();
    }

    @Transactional(readOnly = true)
    public List<EventResponse> getUpcomingEvents(int limit, String tenantId, boolean isSuperAdmin) {
        Pageable pageable = PageRequest.of(0, limit);
        if (isSuperAdmin) {
            return eventRepository.findUpcomingEvents(pageable).stream()
                    .map(this::toResponseWithComputedStatus)
                    .collect(Collectors.toList());
        }
        if (tenantId == null || tenantId.isBlank()) {
            throw new IllegalArgumentException("Tenant ID required");
        }
        return eventRepository.findUpcomingByTenantId(tenantId, pageable).stream()
                .map(this::toResponseWithComputedStatus)
                .collect(Collectors.toList());
    }

    private EventResponse toResponseWithComputedStatus(Event event) {
        EventResponse response = eventMapper.toResponse(event);
        // Respect explicit statuses
        if (event.getStatus() == EventStatus.CANCELLED || event.getStatus() == EventStatus.TRASHED) {
            response.setStatus(event.getStatus().name());
            return response;
        }

        OffsetDateTime now = OffsetDateTime.now();
        // Null-safe computation: if missing times, default to DRAFT
        if (event.getStartsAt() == null || event.getEndsAt() == null) {
            response.setStatus(EventStatus.DRAFT.name());
            return response;
        }
        if (now.isBefore(event.getStartsAt())) {
            response.setStatus(EventStatus.DRAFT.name());
        } else if (!now.isAfter(event.getEndsAt())) {
            response.setStatus(EventStatus.LIVE.name());
        } else {
            response.setStatus(EventStatus.COMPLETED.name());
        }
        return response;
    }
}
