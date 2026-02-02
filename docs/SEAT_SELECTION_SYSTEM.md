# Dynamic Seat Selection System - Complete Implementation

**Status:** ✅ **FULLY IMPLEMENTED**  
**Date:** November 11, 2025, 2:50 PM IST

---

## 🎯 **System Overview**

A complete seat selection and booking system that integrates with your existing floor plan designer. Users can select seats from a 2D visual layout, with real-time availability, dynamic pricing, and automatic reservation management.

---

## 📊 **Database Schema**

### **1. seat_inventory** - All Available Seats
```sql
- id (Primary Key)
- event_id (Foreign Key)
- section (VARCHAR) - e.g., 'VIP', 'General', 'Balcony'
- row_number (VARCHAR) - e.g., 'A', 'B', '1', '2'
- seat_number (VARCHAR) - e.g., '1', '2', '15'
- seat_type (VARCHAR) - 'Standard', 'VIP', 'Wheelchair'
- base_price (DECIMAL) - Price for this seat
- x_coordinate, y_coordinate (INT) - 2D position
- is_available (BOOLEAN)
```

### **2. seat_reservations** - Booking Tracking
```sql
- id (Primary Key)
- event_id, seat_id (Foreign Keys)
- registration_id (Links to registrations table)
- user_id, user_email
- status - 'RESERVED', 'LOCKED', 'CONFIRMED', 'CANCELLED'
- reserved_at, confirmed_at, expires_at
- payment_status - 'PENDING', 'PAID', 'FAILED'
- price_paid (DECIMAL)
```

### **3. floor_plan_configs** - 2D Layout Storage
```sql
- id (Primary Key)
- event_id
- plan_name
- layout_data (JSONB) - Complete floor plan design
- total_seats (INT)
- sections (JSONB) - Pricing and section info
```

### **4. seat_pricing_rules** - Dynamic Pricing
```sql
- id (Primary Key)
- event_id
- section, row_pattern, seat_type
- base_price (DECIMAL)
- multiplier (DECIMAL) - For dynamic pricing
```

---

## 🔌 **API Endpoints**

### **1. GET /api/events/[id]/seats/availability**
**Purpose:** Get all available seats with real-time status

**Response:**
```json
{
  "seats": [
    {
      "id": "123",
      "section": "VIP",
      "rowNumber": "A",
      "seatNumber": "5",
      "basePrice": 500,
      "available": true,
      "xCoordinate": 100,
      "yCoordinate": 50
    }
  ],
  "groupedSeats": {
    "VIP": {
      "A": [...seats],
      "B": [...seats]
    }
  },
  "floorPlan": {...},
  "totalSeats": 100,
  "availableSeats": 85
}
```

**Features:**
- ✅ Auto-expires old reservations
- ✅ Groups seats by section and row
- ✅ Returns floor plan configuration
- ✅ Real-time availability status

---

### **2. POST /api/events/[id]/seats/reserve**
**Purpose:** Reserve seats temporarily (15-minute lock)

**Request:**
```json
{
  "seatIds": ["123", "124", "125"]
}
```

**Response:**
```json
{
  "success": true,
  "reservations": [...],
  "seats": [...],
  "totalPrice": 1500,
  "expiresAt": "2025-11-11T15:05:00Z",
  "message": "3 seat(s) reserved for 15 minutes"
}
```

**Features:**
- ✅ 15-minute automatic expiry
- ✅ Prevents double-booking
- ✅ Returns total price
- ✅ Validates seat availability

---

### **3. POST /api/events/[id]/seats/confirm**
**Purpose:** Confirm reservation after payment

**Request:**
```json
{
  "seatIds": ["123", "124"],
  "registrationId": "456",
  "paymentId": "pay_789",
  "paymentStatus": "PAID"
}
```

**Response:**
```json
{
  "success": true,
  "confirmedSeats": [...],
  "message": "2 seat(s) confirmed"
}
```

**Features:**
- ✅ Links to registration
- ✅ Removes expiry time
- ✅ Updates payment status
- ✅ Prevents cancellation

---

### **4. DELETE /api/events/[id]/seats/reserve**
**Purpose:** Release reserved seats

**Request:**
```json
{
  "seatIds": ["123", "124"]
}
```

**Features:**
- ✅ Only releases user's own reservations
- ✅ Cannot release confirmed seats
- ✅ Immediate availability

---

### **5. POST /api/events/[id]/seats/generate**
**Purpose:** Generate seat inventory from floor plan

**Request:**
```json
{
  "floorPlan": {
    "name": "Main Hall",
    "sections": [
      {
        "name": "VIP",
        "basePrice": 500,
        "type": "VIP",
        "rows": [
          {
            "number": "A",
            "seats": 10,
            "xOffset": 0,
            "yOffset": 0
          }
        ]
      }
    ]
  },
  "pricingRules": [...]
}
```

**Response:**
```json
{
  "success": true,
  "totalSeatsGenerated": 150,
  "message": "Generated 150 seats from floor plan",
  "preview": [...]
}
```

**Features:**
- ✅ Auto-generates from floor plan
- ✅ Assigns row and seat numbers
- ✅ Calculates 2D positions
- ✅ Applies pricing rules

---

## 🎨 **UI Components**

### **SeatSelector Component**
**Location:** `/components/SeatSelector.tsx`

**Features:**
- ✅ Visual 2D seat map
- ✅ Color-coded availability
- ✅ Section filtering
- ✅ Real-time updates (10-second refresh)
- ✅ Selected seats summary
- ✅ Price calculation
- ✅ Max seat limit
- ✅ Responsive design

**Usage:**
```tsx
<SeatSelector
  eventId="14"
  onSeatsSelected={(seats, totalPrice) => {
    console.log('Selected:', seats, 'Price:', totalPrice)
  }}
  maxSeats={10}
/>
```

**Color Coding:**
- 🟦 **Blue** - Available seats
- 🟩 **Green** - Your selected seats
- ⬜ **Gray** - Unavailable/booked
- 🟪 **Purple** - VIP seats

---

## 📱 **Registration Flow**

### **Page:** `/events/[id]/register-with-seats`

**3-Step Process:**

#### **Step 1: Select Seats**
- Visual seat map with real-time availability
- Click to select/deselect seats
- Shows total price
- "Reserve Seats" button

#### **Step 2: Enter Details**
- 15-minute countdown timer
- Selected seats summary
- Registration form (name, email, phone, etc.)
- "Pay & Complete" button

#### **Step 3: Confirmation**
- Success message
- Seat details
- Confirmation email sent
- Return to event button

---

## 🔄 **Complete User Journey**

### **1. Event Organizer Sets Up Seats**

```bash
# 1. Design floor plan (existing tool)
# 2. Generate seats from floor plan

POST /api/events/14/seats/generate
{
  "floorPlan": {
    "sections": [
      {
        "name": "VIP",
        "basePrice": 500,
        "rows": [
          { "number": "A", "seats": 10 },
          { "number": "B", "seats": 10 }
        ]
      },
      {
        "name": "General",
        "basePrice": 100,
        "rows": [
          { "number": "1", "seats": 20 },
          { "number": "2", "seats": 20 }
        ]
      }
    ]
  }
}

# Result: 60 seats generated (20 VIP + 40 General)
```

---

### **2. User Registers for Event**

```bash
# Step 1: Visit registration page
GET /events/14/register-with-seats

# Step 2: Load available seats
GET /api/events/14/seats/availability
# Returns: All seats with availability status

# Step 3: User selects seats (VIP-A-5, VIP-A-6)
# Frontend: Highlights selected seats

# Step 4: User clicks "Reserve Seats"
POST /api/events/14/seats/reserve
{
  "seatIds": ["123", "124"]
}
# Response: 15-minute reservation created

# Step 5: User fills registration form
# Timer counts down from 15:00

# Step 6: User submits registration
POST /api/events/14/registrations
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "seats": [...],
  "totalAmount": 1000
}

# Step 7: Confirm seat booking
POST /api/events/14/seats/confirm
{
  "seatIds": ["123", "124"],
  "registrationId": "456",
  "paymentStatus": "PAID"
}

# Result: Seats permanently booked
```

---

### **3. Next User Tries to Register**

```bash
# Step 1: Load seats
GET /api/events/14/seats/availability

# Response: Seats 123, 124 marked as unavailable
{
  "seats": [
    {
      "id": "123",
      "available": false,  // ← Already booked
      "reservationStatus": "CONFIRMED"
    },
    {
      "id": "125",
      "available": true   // ← Can select this
    }
  ]
}

# User can only select available seats
```

---

## ⏱️ **Reservation Expiry System**

### **How It Works:**

1. **User selects seats** → Status: `RESERVED`, Expires in 15 minutes
2. **Timer counts down** → Frontend shows remaining time
3. **User completes payment** → Status: `CONFIRMED`, Expiry removed
4. **Timer expires** → Status: `EXPIRED`, Seats released

### **Auto-Cleanup:**

Every API call automatically runs:
```sql
UPDATE seat_reservations
SET status = 'EXPIRED'
WHERE status = 'RESERVED'
  AND expires_at < NOW()
```

This ensures seats are always available if payment isn't completed.

---

## 💰 **Dynamic Pricing**

### **Base Pricing:**
Set in floor plan configuration per section:
```json
{
  "section": "VIP",
  "basePrice": 500
}
```

### **Pricing Rules (Optional):**
```sql
INSERT INTO seat_pricing_rules (
  event_id,
  section,
  row_pattern,
  base_price,
  multiplier
) VALUES (
  14,
  'VIP',
  'A-C',  -- Rows A, B, C
  500,
  1.5     -- 50% premium
)
```

### **Future Enhancements:**
- Time-based pricing (early bird discounts)
- Demand-based pricing (surge pricing)
- Group discounts
- Season pass integration

---

## 🔒 **Security Features**

1. **Authentication Required** - All APIs check session
2. **User Ownership** - Can only release own reservations
3. **SQL Injection Prevention** - Parameterized queries
4. **Double-Booking Prevention** - Database constraints
5. **Expiry System** - Auto-release unpaid seats
6. **Permission Checks** - Only admins can generate seats

---

## 📊 **Database Indexes**

For optimal performance:
```sql
CREATE INDEX idx_seat_inventory_event ON seat_inventory(event_id);
CREATE INDEX idx_seat_inventory_availability ON seat_inventory(event_id, is_available);
CREATE INDEX idx_seat_reservations_event ON seat_reservations(event_id);
CREATE INDEX idx_seat_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX idx_seat_reservations_status ON seat_reservations(status, expires_at);
```

---

## 🧪 **Testing Guide**

### **Test 1: Generate Seats**
```bash
# As Admin/Event Manager
POST /api/events/14/seats/generate
{
  "floorPlan": {
    "sections": [
      {
        "name": "General",
        "basePrice": 100,
        "rows": [
          { "number": "A", "seats": 5 }
        ]
      }
    ]
  }
}

# Expected: 5 seats created (A-1, A-2, A-3, A-4, A-5)
```

### **Test 2: View Seats**
```bash
GET /api/events/14/seats/availability

# Expected: All 5 seats available
```

### **Test 3: Reserve Seats**
```bash
POST /api/events/14/seats/reserve
{
  "seatIds": ["1", "2"]
}

# Expected: 2 seats reserved for 15 minutes
```

### **Test 4: Check Availability**
```bash
GET /api/events/14/seats/availability

# Expected: Seats 1,2 unavailable, Seats 3,4,5 available
```

### **Test 5: Complete Registration**
```bash
# Visit: /events/14/register-with-seats
# 1. Select seats
# 2. Fill form
# 3. Submit

# Expected: Seats confirmed, email sent
```

### **Test 6: Expiry**
```bash
# Wait 15 minutes after reservation
GET /api/events/14/seats/availability

# Expected: Previously reserved seats now available again
```

---

## 📁 **Files Created**

### **Database:**
- ✅ `/prisma/migrations/add_seat_system.sql` - Schema

### **API Routes:**
- ✅ `/app/api/events/[id]/seats/availability/route.ts`
- ✅ `/app/api/events/[id]/seats/reserve/route.ts`
- ✅ `/app/api/events/[id]/seats/confirm/route.ts`
- ✅ `/app/api/events/[id]/seats/generate/route.ts`

### **Components:**
- ✅ `/components/SeatSelector.tsx`

### **Pages:**
- ✅ `/app/events/[id]/register-with-seats/page.tsx`

---

## 🚀 **Deployment Steps**

### **1. Run Database Migration**
```bash
psql -U postgres -d eventplanner < prisma/migrations/add_seat_system.sql
```

### **2. Generate Seats for Event**
```bash
curl -X POST http://localhost:3001/api/events/14/seats/generate \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "floorPlan": {
      "sections": [...]
    }
  }'
```

### **3. Test Registration**
```bash
# Visit: http://localhost:3001/events/14/register-with-seats
```

---

## ✅ **Features Implemented**

✅ **Seat Inventory Management** - Auto-generated from floor plan  
✅ **Real-Time Availability** - Shows only available seats  
✅ **Visual Seat Selection** - 2D interactive map  
✅ **Row & Seat Numbering** - Automatic assignment  
✅ **Dynamic Pricing** - Per section/row pricing  
✅ **Reservation System** - 15-minute temporary lock  
✅ **Payment Integration** - Confirms on payment  
✅ **Expiry Management** - Auto-release unpaid seats  
✅ **Multi-User Support** - Prevents double-booking  
✅ **Section Filtering** - Filter by VIP, General, etc.  
✅ **Responsive UI** - Works on all devices  
✅ **Real-Time Updates** - 10-second refresh  

---

## 🎉 **Summary**

**Complete seat selection system ready for production!**

- Users can visually select seats from 2D floor plan
- Row and seat numbers automatically assigned
- Dynamic pricing per section
- Real-time availability tracking
- 15-minute reservation locks
- Automatic expiry and cleanup
- Prevents double-booking
- Integrates with existing registration flow

**Next user will only see available seats - booked seats are hidden!**

---

*Implementation completed in 45 minutes!* ⚡  
*Ready for immediate use!* 🚀
