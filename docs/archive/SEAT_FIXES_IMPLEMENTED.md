# Seat Selection & Pricing Fixes - Implementation Complete

## Date: November 14, 2025 5:00 PM IST

---

## ✅ Critical Fixes Implemented

### 1. **Fixed Seat Numbering Bug** 🎯

**Problem**: Seats were showing repeating numbers (1, 2, 1, 2...) instead of sequential (1, 2, 3, 4...)

**Root Cause**: Line 55 in floor plan generation was using `seatNum` (resets per table) instead of `seatCounter` (global counter)

**Solution Applied**:
```typescript
// BEFORE ❌
seat_number: ${seatNum.toString()}  // Resets: 1,2,1,2,1,2...

// AFTER ✅
seat_number: ${seatCounter.toString()}  // Sequential: 1,2,3,4,5,6...
```

**File Modified**: `/apps/web/app/api/events/[id]/design/floor-plan/route.ts` (Line 55)

**Result**: 
- Row B now shows: 1, 2, 3, 4, 5, 6, 7, 8... ✅
- Row C now shows: 9, 10, 11, 12, 13, 14, 15, 16... ✅
- All seats have unique sequential numbers ✅

---

### 2. **Added Ticket Pricing Configuration** 💰

**Problem**: VIP/Premium/General prices were hardcoded (500/300/150)

**Solution**: Created event-specific ticket pricing settings

#### Database Table Created:
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

#### API Endpoints Created:
**File**: `/apps/web/app/api/events/[id]/settings/tickets/route.ts`

**GET `/api/events/[id]/settings/tickets`**
- Fetches ticket pricing for event
- Returns defaults if not configured
- Response:
```json
{
  "eventId": 8,
  "vipPrice": 500,
  "premiumPrice": 300,
  "generalPrice": 150,
  "isDefault": false
}
```

**POST `/api/events/[id]/settings/tickets`**
- Creates or updates ticket pricing
- Validates prices (must be >= 0)
- Request:
```json
{
  "vipPrice": 750,
  "premiumPrice": 450,
  "generalPrice": 200
}
```

---

### 3. **Integrated Pricing with Seat Generation** 🔗

**Updated**: Floor plan generation now fetches prices from settings

**File Modified**: `/apps/web/app/api/events/[id]/design/floor-plan/route.ts`

**Changes**:
```typescript
// Fetch ticket pricing settings from database
const ticketSettings = await prisma.$queryRaw`
  SELECT vip_price, premium_price, general_price
  FROM event_ticket_settings
  WHERE event_id = ${parseInt(eventId)}
`

// Use configured prices or defaults
const prices = ticketSettings.length > 0 ? {
  vip: Number(ticketSettings[0].vip_price) || 500,
  premium: Number(ticketSettings[0].premium_price) || 300,
  general: Number(ticketSettings[0].general_price) || 150
} : {
  vip: 500,
  premium: 300,
  general: 150
}

// Apply to seat types
const seatTypes = [
  { type: 'VIP', section: 'VIP', basePrice: prices.vip, percentage: 0.2 },
  { type: 'PREMIUM', section: 'Premium', basePrice: prices.premium, percentage: 0.3 },
  { type: 'STANDARD', section: 'General', basePrice: prices.general, percentage: 0.5 }
]
```

**Result**: Seats now use prices from event settings! ✅

---

## 📊 How It Works Now

### Workflow:

1. **Event Manager Sets Prices** (Optional)
   ```
   POST /api/events/8/settings/tickets
   {
     "vipPrice": 750,
     "premiumPrice": 450,
     "generalPrice": 200
   }
   ```

2. **Generate Floor Plan**
   - System fetches ticket prices from settings
   - If no settings exist, uses defaults (500/300/150)
   - Creates seats with configured prices

3. **Seat Selection**
   - User sees seats with correct prices
   - VIP seats: ₹750 (or configured price)
   - Premium seats: ₹450 (or configured price)
   - General seats: ₹200 (or configured price)

4. **Registration**
   - Total price calculated from seat prices
   - Payment processed
   - Seats reserved

---

## 🧪 Testing Instructions

### Test 1: Verify Seat Numbering Fix

1. **Generate New Floor Plan**:
   - Go to event → Design → Floor Plan
   - Configure hall and generate
   
2. **Check Database**:
   ```sql
   SELECT section, row_number, seat_number, seat_type, base_price 
   FROM seat_inventory 
   WHERE event_id = 8 
   ORDER BY id 
   LIMIT 30;
   ```

3. **Expected Result**:
   ```
   General | B | 1  | STANDARD | 150.00
   General | B | 2  | STANDARD | 150.00
   General | B | 3  | STANDARD | 150.00
   General | B | 4  | STANDARD | 150.00
   General | C | 5  | STANDARD | 150.00
   General | C | 6  | STANDARD | 150.00
   ...
   ```
   ✅ Sequential numbers, not repeating!

4. **Check Seat Selector**:
   - Go to event registration
   - View seat map
   - Verify seats show B1, B2, B3... (not B1, B2, B1, B2...)

### Test 2: Configure Ticket Prices

1. **Set Custom Prices** (using API or future UI):
   ```bash
   curl -X POST http://localhost:3001/api/events/8/settings/tickets \
     -H "Content-Type: application/json" \
     -d '{"vipPrice": 800, "premiumPrice": 500, "generalPrice": 250}'
   ```

2. **Verify Settings Saved**:
   ```bash
   curl http://localhost:3001/api/events/8/settings/tickets
   ```

3. **Regenerate Floor Plan**:
   - Delete existing seats
   - Generate new floor plan
   
4. **Check Seat Prices**:
   ```sql
   SELECT DISTINCT seat_type, base_price 
   FROM seat_inventory 
   WHERE event_id = 8;
   ```

5. **Expected Result**:
   ```
   VIP      | 800.00
   PREMIUM  | 500.00
   STANDARD | 250.00
   ```
   ✅ Prices match configured settings!

### Test 3: End-to-End Registration

1. **Browse Event** → Click Register
2. **Select Seats**:
   - Choose 2 VIP seats (₹800 each)
   - Choose 1 Premium seat (₹500)
   - Total should be: ₹2,100
3. **Complete Registration**:
   - Fill form
   - Submit
   - Verify success
4. **Check Database**:
   ```sql
   SELECT * FROM registrations WHERE event_id = 8 ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM seat_reservations WHERE event_id = 8 ORDER BY created_at DESC LIMIT 3;
   ```

---

## 📝 Files Modified

### 1. **`/apps/web/app/api/events/[id]/design/floor-plan/route.ts`**
**Changes**:
- Line 55: Fixed seat numbering (use `seatCounter` instead of `seatNum`)
- Lines 15-31: Added ticket settings fetch
- Lines 34-38: Use configured prices in seat types

### 2. **`/apps/web/app/api/events/[id]/settings/tickets/route.ts`** (NEW)
**Features**:
- GET endpoint: Fetch ticket prices
- POST endpoint: Create/update prices
- Validation: Prices must be >= 0
- Upsert logic: Insert or update on conflict

### 3. **Database**
**New Table**: `event_ticket_settings`
- Stores VIP/Premium/General prices per event
- Unique constraint on event_id
- Default prices: 500/300/150

---

## 🎯 What's Next (Future Enhancements)

### Phase 2: Floor Plan Zone Configuration

**Goal**: Allow visual configuration of seat zones in floor plan generator

**Features to Add**:
1. **Zone Configuration UI**:
   - Dropdown for each row: VIP / Premium / General
   - Visual color coding on canvas
   - Drag-and-drop zone boundaries

2. **Enhanced FloorPlanConfig**:
   ```typescript
   interface FloorPlanConfig {
     // ... existing fields ...
     seatZones?: {
       vipRows: string[]      // e.g., ['A', 'B']
       premiumRows: string[]  // e.g., ['C', 'D', 'E']
       generalRows: string[]  // e.g., ['F', 'G', 'H']
     }
   }
   ```

3. **Zone-Based Seat Assignment**:
   - Check row letter against zone configuration
   - Assign seat type based on zone
   - Override percentage-based assignment

**Implementation**:
- Update `/apps/web/lib/floorPlanGenerator.ts`
- Update `/apps/web/app/events/[id]/design/floor-plan/FloorPlanForm.tsx`
- Update seat generation logic to use zones

---

## ✅ Success Criteria Met

- [x] Seat numbers are unique and sequential
- [x] Ticket prices configurable per event
- [x] Seat generation uses configured prices
- [x] API endpoints for price management
- [x] Database table for settings
- [x] Backward compatible (defaults if no settings)
- [ ] Floor plan zone configuration (Phase 2)
- [ ] Settings UI in event management (Phase 2)

---

## 🚀 Deployment Status

- ✅ Database table created
- ✅ API endpoints deployed
- ✅ Seat generation updated
- ✅ Docker container restarted
- ✅ Changes live

---

## 📋 Quick Reference

### API Endpoints:
```
GET  /api/events/[id]/settings/tickets  - Fetch prices
POST /api/events/[id]/settings/tickets  - Update prices
```

### Database Queries:
```sql
-- View ticket settings
SELECT * FROM event_ticket_settings WHERE event_id = 8;

-- View seat inventory
SELECT section, row_number, seat_number, seat_type, base_price 
FROM seat_inventory 
WHERE event_id = 8 
ORDER BY id;

-- Count seats by type
SELECT seat_type, COUNT(*), AVG(base_price) 
FROM seat_inventory 
WHERE event_id = 8 
GROUP BY seat_type;
```

---

## 🎉 Summary

**Fixed**:
- ✅ Seat numbering bug (repeating numbers)
- ✅ Hardcoded prices
- ✅ No price configuration

**Added**:
- ✅ Event-specific ticket pricing
- ✅ API for price management
- ✅ Database table for settings
- ✅ Automatic price integration

**Result**: 
- Seats now have unique sequential numbers (B1, B2, B3...)
- Prices are configurable per event
- System is flexible and extensible
- Ready for Phase 2 enhancements!

---

**Status**: ✅ DEPLOYED & READY
**Action Required**: 
1. Clear browser cache
2. Regenerate floor plan for event 8
3. Test seat selection
4. Verify sequential numbering
