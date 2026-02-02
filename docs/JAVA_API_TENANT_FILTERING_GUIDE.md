# 🔧 Java API Tenant Filtering Implementation Guide

## ✅ CONTROLLER UPDATED

**File**: `EventController.java` - COMPLETED ✅

All controller methods now accept:
- `@RequestHeader("x-tenant-id") String tenantId`
- `@RequestHeader("x-user-role") String userRole`

And pass to service:
- `tenantId` - Current tenant ID
- `isSuperAdmin` - Boolean flag for super admin

---

## ⚠️ SERVICE LAYER NEEDS UPDATE

**File**: `EventService.java` - NEEDS IMPLEMENTATION

### Required Changes:

**1. Update Method Signatures**:

```java
// OLD:
public Page<EventResponse> getAllEvents(Pageable pageable)

// NEW:
public Page<EventResponse> getAllEvents(Pageable pageable, String tenantId, boolean isSuperAdmin)
```

**2. Add Tenant Filtering Logic**:

```java
@Transactional(readOnly = true)
public Page<EventResponse> getAllEvents(Pageable pageable, String tenantId, boolean isSuperAdmin) {
    // Super admin sees all tenants
    if (isSuperAdmin) {
        return eventRepository.findAll(pageable)
                .map(this::toResponseWithComputedStatus);
    }
    
    // Regular users see only their tenant
    if (tenantId == null || tenantId.isBlank()) {
        throw new IllegalArgumentException("Tenant ID required");
    }
    
    return eventRepository.findByTenantId(tenantId, pageable)
            .map(this::toResponseWithComputedStatus);
}
```

**3. Update All Service Methods**:

Methods that need updating:
- `getAllEvents(Pageable, String, boolean)`
- `getAllEventsByMode(EventMode, Pageable, String, boolean)`
- `getEventsByStatus(String, Pageable, String, boolean)`
- `getEventsByStatusAndMode(String, EventMode, Pageable, String, boolean)`
- `getEventById(Long, String, boolean)`
- `createEvent(EventRequest, String)`
- `updateEvent(Long, EventRequest, String, boolean)`
- `deleteEvent(Long, String, boolean)`
- `searchEvents(String, String, Pageable, String, boolean)`
- `getUpcomingEvents(int, String, boolean)`

---

## 🗄️ REPOSITORY LAYER NEEDS UPDATE

**File**: `EventRepository.java` - NEEDS NEW METHODS

### Required Methods:

```java
public interface EventRepository extends JpaRepository<Event, Long> {
    
    // Existing methods...
    
    // NEW: Tenant-filtered methods
    Page<Event> findByTenantId(String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status = 'DRAFT'")
    Page<Event> findDraftByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status = 'LIVE'")
    Page<Event> findLiveByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.status = 'COMPLETED'")
    Page<Event> findCompletedByTenantId(@Param("tenantId") String tenantId, Pageable pageable);
    
    Page<Event> findByTenantIdAndEventMode(String tenantId, EventMode mode, Pageable pageable);
    
    Page<Event> findByTenantIdAndStatus(String tenantId, EventStatus status, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND e.eventMode = :mode AND e.status = 'DRAFT'")
    Page<Event> findDraftByTenantIdAndMode(@Param("tenantId") String tenantId, @Param("mode") EventMode mode, Pageable pageable);
    
    @Query("SELECT e FROM Event e WHERE e.tenantId = :tenantId AND (LOWER(e.name) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(e.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Event> searchByTenantId(@Param("tenantId") String tenantId, @Param("query") String query, Pageable pageable);
    
    List<Event> findTop10ByTenantIdAndStartsAtAfterOrderByStartsAtAsc(String tenantId, OffsetDateTime now);
}
```

---

## 🔒 ENTITY VALIDATION

**File**: `Event.java` - CHECK IF FIELD EXISTS

Ensure the Event entity has a `tenantId` field:

```java
@Entity
@Table(name = "events")
public class Event {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ADD THIS if not exists:
    @Column(name = "tenant_id")
    private String tenantId;
    
    // ... other fields
}
```

---

## 📝 IMPLEMENTATION STEPS

### Step 1: Update Event Entity ✅ (Check if needed)

```bash
# Check if tenantId field exists
grep -n "tenantId" apps/api-java/src/main/java/com/eventplanner/events/Event.java
```

If not exists, add:
```java
@Column(name = "tenant_id")
private String tenantId;
```

### Step 2: Update EventRepository

Add all tenant-filtered query methods listed above.

### Step 3: Update EventService

Update all methods to:
1. Accept `tenantId` and `isSuperAdmin` parameters
2. Check if super admin → use existing queries
3. If not super admin → use tenant-filtered queries
4. Validate tenantId is not null for regular users

### Step 4: Validate on Write Operations

```java
@Transactional
public EventResponse createEvent(EventRequest request, String tenantId) {
    if (tenantId == null || tenantId.isBlank()) {
        throw new IllegalArgumentException("Tenant ID required");
    }
    
    Event event = eventMapper.toEntity(request);
    event.setTenantId(tenantId); // Set from header
    event.setStatus(EventStatus.DRAFT);
    event.setCreatedAt(OffsetDateTime.now());
    
    Event saved = eventRepository.save(event);
    return eventMapper.toResponse(saved);
}

@Transactional
public EventResponse updateEvent(Long id, EventRequest request, String tenantId, boolean isSuperAdmin) {
    Event existing = eventRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Event not found"));
    
    // Verify tenant ownership (unless super admin)
    if (!isSuperAdmin && !existing.getTenantId().equals(tenantId)) {
        throw new SecurityException("Access denied: Event belongs to different tenant");
    }
    
    // Update fields...
    eventMapper.updateEntity(existing, request);
    
    Event updated = eventRepository.save(existing);
    return eventMapper.toResponse(updated);
}
```

---

## 🧪 TESTING

### Test 1: Data Isolation

```bash
# Create event in Tenant A
curl -X POST http://localhost:8081/api/events \
  -H "x-tenant-id: tenant-a" \
  -H "Content-Type: application/json" \
  -d '{"name":"Event A","description":"Test"}'

# Create event in Tenant B
curl -X POST http://localhost:8081/api/events \
  -H "x-tenant-id: tenant-b" \
  -H "Content-Type: application/json" \
  -d '{"name":"Event B","description":"Test"}'

# Get events as Tenant A user
curl http://localhost:8081/api/events \
  -H "x-tenant-id: tenant-a" \
  -H "x-user-role: USER"
# Should only see Event A

# Get events as Tenant B user
curl http://localhost:8081/api/events \
  -H "x-tenant-id: tenant-b" \
  -H "x-user-role: USER"
# Should only see Event B
```

### Test 2: Super Admin Access

```bash
# Get all events as super admin
curl http://localhost:8081/api/events \
  -H "x-user-role: SUPER_ADMIN"
# Should see Event A AND Event B
```

### Test 3: Tenant Validation

```bash
# Try to update Tenant A's event as Tenant B user
curl -X PUT http://localhost:8081/api/events/1 \
  -H "x-tenant-id: tenant-b" \
  -H "x-user-role: USER" \
  -H "Content-Type: application/json" \
  -d '{"name":"Hacked"}'
# Should get 403 Forbidden or SecurityException
```

---

## 🚨 CRITICAL SECURITY NOTES

1. **Always validate tenantId on write operations**
2. **Never trust client-provided tenantId in request body**
3. **Always use header tenantId (set by middleware)**
4. **Super admin bypass must be explicit**
5. **Log all tenant access for audit**

---

## 📊 IMPLEMENTATION CHECKLIST

### EventService.java:
- [ ] Update `getAllEvents` signature and logic
- [ ] Update `getAllEventsByMode` signature and logic
- [ ] Update `getEventsByStatus` signature and logic
- [ ] Update `getEventsByStatusAndMode` signature and logic
- [ ] Update `getEventById` with tenant validation
- [ ] Update `createEvent` to set tenantId
- [ ] Update `updateEvent` with tenant validation
- [ ] Update `deleteEvent` with tenant validation
- [ ] Update `searchEvents` with tenant filtering
- [ ] Update `getUpcomingEvents` with tenant filtering

### EventRepository.java:
- [ ] Add `findByTenantId` method
- [ ] Add `findDraftByTenantId` method
- [ ] Add `findLiveByTenantId` method
- [ ] Add `findCompletedByTenantId` method
- [ ] Add `findByTenantIdAndEventMode` method
- [ ] Add `findByTenantIdAndStatus` method
- [ ] Add `searchByTenantId` method
- [ ] Add `findTop10ByTenantIdAndStartsAtAfterOrderByStartsAtAsc` method

### Event.java:
- [ ] Verify `tenantId` field exists
- [ ] Add getter/setter if needed

### Testing:
- [ ] Test data isolation
- [ ] Test super admin access
- [ ] Test tenant validation on updates
- [ ] Test tenant validation on deletes

---

## 🎯 QUICK START

**Minimal Implementation** (Get it working fast):

1. Add `tenantId` field to Event entity
2. Update EventService methods to accept tenantId
3. Add basic tenant filtering:

```java
public Page<EventResponse> getAllEvents(Pageable pageable, String tenantId, boolean isSuperAdmin) {
    if (isSuperAdmin) {
        return eventRepository.findAll(pageable).map(this::toResponseWithComputedStatus);
    }
    return eventRepository.findByTenantId(tenantId, pageable).map(this::toResponseWithComputedStatus);
}
```

4. Add repository method:

```java
Page<Event> findByTenantId(String tenantId, Pageable pageable);
```

5. Test!

---

## 📝 SUMMARY

**Controller**: ✅ DONE
**Service**: ⚠️ NEEDS UPDATE (signatures + logic)
**Repository**: ⚠️ NEEDS NEW METHODS
**Entity**: ⚠️ CHECK IF FIELD EXISTS

**Estimated Time**: 2-3 hours

**Priority**: 🔴 CRITICAL (blocks production)

---

**Once complete, data isolation will work and the system will be production-ready!** 🚀
