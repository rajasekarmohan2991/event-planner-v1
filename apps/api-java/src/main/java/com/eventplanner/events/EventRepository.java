package com.eventplanner.events;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    
    // Find events by city (case-insensitive)
    Page<Event> findByCityIgnoreCase(String city, Pageable pageable);
    
    // Search by name, venue, or address (case-insensitive)
    Page<Event> findByNameContainingIgnoreCaseOrVenueContainingIgnoreCaseOrAddressContainingIgnoreCase(
            String name, String venue, String address, Pageable pageable);
    
    // Find upcoming events
    @Query("SELECT e FROM Event e WHERE e.startsAt > CURRENT_TIMESTAMP ORDER BY e.startsAt ASC")
    List<Event> findUpcomingEvents(Pageable pageable);
    
    // Find distinct cities
    @Query("SELECT DISTINCT e.city FROM Event e WHERE e.city IS NOT NULL")
    List<String> findDistinctCities();

    // Explicit status lookups (for CANCELLED / TRASHED mainly)
    Page<Event> findByStatus(EventStatus status, Pageable pageable);

    // Filter by event mode only
    Page<Event> findByEventMode(EventMode eventMode, Pageable pageable);

    // Filter by explicit status and mode
    Page<Event> findByStatusAndEventMode(EventStatus status, EventMode eventMode, Pageable pageable);

    // Draft = future events not cancelled/trashed
    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt > CURRENT_TIMESTAMP")
    Page<Event> findDraft(Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt > CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findDraftByMode(EventMode eventMode, Pageable pageable);

    // Live = between start and end, not cancelled/trashed
    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt <= CURRENT_TIMESTAMP AND e.endsAt >= CURRENT_TIMESTAMP")
    Page<Event> findLive(Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt <= CURRENT_TIMESTAMP AND e.endsAt >= CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findLiveByMode(EventMode eventMode, Pageable pageable);

    // Completed = past end, not cancelled/trashed
    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.endsAt < CURRENT_TIMESTAMP")
    Page<Event> findCompleted(Pageable pageable);

    @Query("SELECT e FROM Event e WHERE e.status NOT IN ('CANCELLED','TRASHED') AND e.endsAt < CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findCompletedByMode(EventMode eventMode, Pageable pageable);

    // Missing coordinates for backfill job
    Page<Event> findByLatitudeIsNullOrLongitudeIsNull(Pageable pageable);
    
    // ========== TENANT-FILTERED METHODS ==========
    
    // Basic tenant filtering
    Page<Event> findByTenantId(String tenantId, Pageable pageable);
    
    // Tenant + Status
    Page<Event> findByTenantIdAndStatus(String tenantId, EventStatus status, Pageable pageable);
    
    // Tenant + Mode
    Page<Event> findByTenantIdAndEventMode(String tenantId, EventMode eventMode, Pageable pageable);
    
    // Tenant + Status + Mode
    Page<Event> findByTenantIdAndStatusAndEventMode(String tenantId, EventStatus status, EventMode eventMode, Pageable pageable);
    
    // Tenant + Draft (future events not cancelled/trashed)
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt > CURRENT_TIMESTAMP")
    Page<Event> findDraftByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt > CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findDraftByTenantIdAndMode(@Param("tenantId") String tenantId, @Param("eventMode") EventMode eventMode, Pageable pageable);
    
    // Tenant + Live (between start and end)
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt <= CURRENT_TIMESTAMP AND e.endsAt >= CURRENT_TIMESTAMP")
    Page<Event> findLiveByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.startsAt <= CURRENT_TIMESTAMP AND e.endsAt >= CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findLiveByTenantIdAndMode(@Param("tenantId") String tenantId, @Param("eventMode") EventMode eventMode, Pageable pageable);
    
    // Tenant + Completed (past end)
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.endsAt < CURRENT_TIMESTAMP")
    Page<Event> findCompletedByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status NOT IN ('CANCELLED','TRASHED') AND e.endsAt < CURRENT_TIMESTAMP AND e.eventMode = :eventMode")
    Page<Event> findCompletedByTenantIdAndMode(@Param("tenantId") String tenantId, @Param("eventMode") EventMode eventMode, Pageable pageable);
    
    // Tenant + Search
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.venue) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Event> searchByTenantId(@Param("tenantId") String tenantId, @Param("query") String query, Pageable pageable);
    
    // Tenant + Upcoming events
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.startsAt > CURRENT_TIMESTAMP ORDER BY e.startsAt ASC")
    List<Event> findUpcomingByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
}
