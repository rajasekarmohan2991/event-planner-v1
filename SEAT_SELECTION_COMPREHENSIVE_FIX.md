# Seat Selection & Pricing System - Comprehensive Fix

## Date: November 14, 2025 4:45 PM IST

---

## 🐛 Issues Identified

### 1. **Seat Numbers Repeating (Critical Bug)**
**Problem**: Seats showing "1", "2", "1", "2" instead of unique sequential numbers
**Example from Database**:
```
Row B: 1, 2, 1, 2, 1, 2, 1, 2...  ❌ WRONG
Row C: 1, 2, 1, 2, 1, 2, 1, 2...  ❌ WRONG
```

**Should Be**:
```
Row B: 1, 2, 3, 4, 5, 6, 7, 8...  ✅ CORRECT
Row C: 1, 2, 3, 4, 5, 6, 7, 8...  ✅ CORRECT
```

**Root Cause**: Line 55 in `/api/events/[id]/design/floor-plan/route.ts`
```typescript
seat_number: ${seatNum.toString()}  // ❌ Resets for each table!
```

### 2. **Hardcoded Seat Prices**
**Problem**: VIP/Premium/General prices are hardcoded in the seat generation logic
**Current**:
```typescript
{ type: 'VIP', basePrice: 500 }      // ❌ Hardcoded
{ type: 'PREMIUM', basePrice: 300 }  // ❌ Hardcoded
{ type: 'STANDARD', basePrice: 150 } // ❌ Hardcoded
```

**Should Be**: Fetched from event ticket settings

### 3. **No Seat Category Mapping in Floor Plan**
**Problem**: Floor plan generator doesn't allow configuring which zones are VIP/Premium/General
**Current**: Automatically assigns based on table position percentage
**Needed**: Visual zone configuration in floor plan generator

---

## ✅ Solutions to Implement

### Solution 1: Fix Seat Numbering

**Change in `/api/events/[id]/design/floor-plan/route.ts`**:
```typescript
// BEFORE (Line 39-55):
for (let seatNum = 1; seatNum <= seatsPerTable; seatNum++) {
  // ...
  seat_number: ${seatNum.toString()}  // ❌ WRONG
}

// AFTER:
for (let seatNum = 1; seatNum <= seatsPerTable; seatNum++) {
  // ...
  seat_number: ${seatCounter.toString()}  // ✅ CORRECT
  seatCounter++
}
```

### Solution 2: Add Ticket Pricing Settings

**Create Event Ticket Settings Table**:
```sql
CREATE TABLE event_ticket_settings (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  vip_price DECIMAL(10,2) DEFAULT 500,
  premium_price DECIMAL(10,2) DEFAULT 300,
  general_price DECIMAL(10,2) DEFAULT 150,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id)
);
```

**API Endpoint**: `/api/events/[id]/settings/tickets`
- GET: Fetch ticket prices
- POST/PUT: Update ticket prices

### Solution 3: Enhance Floor Plan with Seat Zones

**Add to FloorPlanConfig**:
```typescript
interface FloorPlanConfig {
  // ... existing fields ...
  seatZones: {
    vipRows: string[]      // e.g., ['A', 'B']
    premiumRows: string[]  // e.g., ['C', 'D', 'E']
    generalRows: string[]  // e.g., ['F', 'G', 'H']
  }
}
```

**UI Enhancement**: Add zone configuration in floor plan form
- Dropdown to assign each row to VIP/Premium/General
- Visual color coding on canvas
- Drag-and-drop zone boundaries

### Solution 4: Use Configured Prices

**Update Seat Generation**:
```typescript
// Fetch ticket prices from settings
const ticketSettings = await getTicketSettings(eventId)

const seatTypes = [
  { type: 'VIP', basePrice: ticketSettings.vipPrice },
  { type: 'PREMIUM', basePrice: ticketSettings.premiumPrice },
  { type: 'STANDARD', basePrice: ticketSettings.generalPrice }
]
```

---

## 📋 Implementation Plan

### Phase 1: Critical Bug Fixes (Immediate)
1. ✅ Fix seat numbering to use sequential counter
2. ✅ Update database query to show correct seat numbers
3. ✅ Test seat selection display

### Phase 2: Ticket Pricing Settings (High Priority)
1. ✅ Create event_ticket_settings table
2. ✅ Create API endpoints for ticket settings
3. ✅ Add settings UI in event management
4. ✅ Update seat generation to use settings

### Phase 3: Floor Plan Enhancements (Medium Priority)
1. ✅ Add seat zone configuration to floor plan form
2. ✅ Visual zone indicators on canvas
3. ✅ Save zone configuration with floor plan
4. ✅ Use zone config during seat generation

### Phase 4: Registration Fix (Critical)
1. ✅ Debug 500 error in registration API
2. ✅ Test end-to-end registration flow
3. ✅ Verify seat reservation and confirmation

---

## 🔧 Technical Implementation

### File Changes Required:

1. **`/apps/web/app/api/events/[id]/design/floor-plan/route.ts`**
   - Fix seat numbering logic
   - Add ticket settings fetch
   - Add zone-based seat type assignment

2. **`/apps/web/app/api/events/[id]/settings/tickets/route.ts`** (NEW)
   - GET: Fetch ticket prices
   - POST: Create/update ticket prices

3. **`/apps/web/lib/floorPlanGenerator.ts`**
   - Add seatZones to FloorPlanConfig interface
   - Add visual zone indicators

4. **`/apps/web/app/events/[id]/design/floor-plan/FloorPlanForm.tsx`**
   - Add zone configuration UI
   - Row-to-category mapping

5. **`/apps/web/app/events/[id]/settings/page.tsx`** (NEW or UPDATE)
   - Ticket pricing settings form
   - VIP/Premium/General price inputs

6. **Database Migration**:
   - Create event_ticket_settings table
   - Add default prices for existing events

---

## 🧪 Testing Checklist

### Seat Numbering:
- [ ] Generate new floor plan
- [ ] Verify seats show B1, B2, B3... (not B1, B2, B1, B2...)
- [ ] Check database: `SELECT * FROM seat_inventory WHERE event_id = X`
- [ ] Verify seat selector shows correct numbers

### Ticket Pricing:
- [ ] Create ticket price settings for event
- [ ] Generate floor plan
- [ ] Verify seats have correct prices from settings
- [ ] Update prices and regenerate
- [ ] Verify new prices applied

### Floor Plan Zones:
- [ ] Configure VIP rows (A, B)
- [ ] Configure Premium rows (C, D, E)
- [ ] Configure General rows (F, G, H)
- [ ] Generate seats
- [ ] Verify correct seat types assigned

### Registration:
- [ ] Select seats
- [ ] Complete registration form
- [ ] Verify registration created
- [ ] Check seat reservations
- [ ] Verify email sent

---

## 📊 Expected Results

### Before Fix:
```
Section: General
Row B: Seat 1, Seat 2, Seat 1, Seat 2...  ❌
Row C: Seat 1, Seat 2, Seat 1, Seat 2...  ❌
```

### After Fix:
```
Section: VIP (Rows A-B)
Row A: Seat 1, Seat 2, Seat 3, Seat 4...  ✅
Row B: Seat 9, Seat 10, Seat 11, Seat 12...  ✅

Section: Premium (Rows C-E)
Row C: Seat 17, Seat 18, Seat 19, Seat 20...  ✅
Row D: Seat 25, Seat 26, Seat 27, Seat 28...  ✅

Section: General (Rows F-H)
Row F: Seat 41, Seat 42, Seat 43, Seat 44...  ✅
```

---

## 🎯 Success Criteria

1. ✅ Seat numbers are unique and sequential
2. ✅ Ticket prices configurable per event
3. ✅ Floor plan allows zone configuration
4. ✅ Seat generation uses configured prices and zones
5. ✅ Registration completes successfully
6. ✅ Seat selector displays correctly

---

**Status**: Ready for Implementation
**Priority**: CRITICAL
**Estimated Time**: 2-3 hours
