# Ticket Class + Seat Selection Integration Plan

## Current State

### What Works:
- ✅ Seat selection page exists (`/events/[id]/register-with-seats`)
- ✅ Seat reservation API works
- ✅ Registration API works
- ✅ Ticket classes exist in database

### What's Missing:
- ❌ Ticket class selection BEFORE seat selection
- ❌ Filtering seats by ticket class
- ❌ Passing ticket class ID to registration
- ❌ Pricing based on ticket class

---

## Desired Flow

```
Step 1: Select Ticket Class
┌─────────────────────────────────┐
│  Choose Your Ticket Type:       │
│  ○ VIP - ₹5000 (50 available)   │
│  ○ Premium - ₹3000 (100 avail)  │
│  ● General - ₹1000 (200 avail)  │
│                                  │
│  [Continue to Seat Selection]   │
└─────────────────────────────────┘
         ↓
Step 2: Select Seats (Filtered by Ticket Class)
┌─────────────────────────────────┐
│  Showing: General Admission      │
│  Available: 200 seats            │
│                                  │
│  [Seat Map - Only General seats] │
│                                  │
│  Selected: A12, A13 (₹2000)      │
│  [Reserve Seats]                 │
└─────────────────────────────────┘
         ↓
Step 3: Fill Details
┌─────────────────────────────────┐
│  Name, Email, Phone, etc.        │
│  Promo Code (optional)           │
│  [Proceed to Payment]            │
└─────────────────────────────────┘
         ↓
Step 4: Payment
┌─────────────────────────────────┐
│  Total: ₹2360 (incl. tax)        │
│  [Pay Now]                       │
└─────────────────────────────────┘
```

---

## Implementation Plan

### 1. Update Registration Page (`/events/[id]/register/page.tsx`)

**Add Ticket Class Selection**:
```typescript
// Fetch ticket classes for the event
const [ticketClasses, setTicketClasses] = useState([])
const [selectedTicketClass, setSelectedTicketClass] = useState(null)

useEffect(() => {
  fetch(`/api/events/${eventId}/tickets`)
    .then(res => res.json())
    .then(data => setTicketClasses(data.tickets || []))
}, [eventId])

// When user selects ticket class and clicks continue:
const handleContinueToSeats = () => {
  if (!selectedTicketClass) {
    alert('Please select a ticket class')
    return
  }
  
  // Save ticket class to localStorage
  localStorage.setItem(`registration:${eventId}:ticketClass`, 
    JSON.stringify(selectedTicketClass))
  
  // Redirect to seat selection with ticket class filter
  router.push(`/events/${eventId}/register-with-seats?ticketClass=${selectedTicketClass.id}`)
}
```

### 2. Update Seat Selection Page (`/events/[id]/register-with-seats/page.tsx`)

**Load Ticket Class from URL/localStorage**:
```typescript
const [ticketClass, setTicketClass] = useState(null)

useEffect(() => {
  // Try URL param first
  const ticketClassId = searchParams?.get('ticketClass')
  
  if (ticketClassId) {
    // Fetch ticket class details
    fetch(`/api/events/${eventId}/tickets/${ticketClassId}`)
      .then(res => res.json())
      .then(data => setTicketClass(data))
  } else {
    // Fallback to localStorage
    const saved = localStorage.getItem(`registration:${eventId}:ticketClass`)
    if (saved) setTicketClass(JSON.parse(saved))
  }
}, [eventId, searchParams])
```

**Pass Ticket Class to SeatSelector**:
```typescript
<SeatSelector
  eventId={eventId}
  ticketClassId={ticketClass?.id}  // NEW: Filter seats
  onSeatSelect={handleSeatsSelected}
  maxSeats={ticketClass?.maxPurchase || 10}
/>
```

### 3. Update SeatSelector Component

**Filter Seats by Ticket Class**:
```typescript
// In SeatSelector.tsx
const fetchSeats = async () => {
  const url = ticketClassId 
    ? `/api/events/${eventId}/seats/availability?ticketClass=${ticketClassId}`
    : `/api/events/${eventId}/seats/availability`
    
  const res = await fetch(url)
  const data = await res.json()
  setSeats(data.seats)
}
```

### 4. Update Registration Submission

**Include Ticket Class ID**:
```typescript
const handlePayment = async () => {
  const regRes = await fetch(`/api/events/${eventId}/registrations`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        ...formData,
        ticketId: ticketClass.id,  // NEW: Include ticket class
        seats: selectedSeats.map(s => ({...})),
      },
      type: 'SEATED',
      totalPrice: totalPrice,
    })
  })
}
```

---

## Database Schema Check

### Required Tables:
- ✅ `tickets` (ticket classes) - EXISTS
- ✅ `seat_inventory` - EXISTS  
- ✅ `seat_reservations` - EXISTS
- ✅ `registrations` - EXISTS

### Required Columns:
- ✅ `tickets.id` - Ticket class ID
- ✅ `tickets.name` - e.g., "VIP", "General"
- ✅ `tickets.price_in_minor` - Price in paise
- ✅ `tickets.quantity` - Total available
- ✅ `tickets.sold` - Number sold
- ✅ `tickets.min_purchase` - Min seats per booking
- ✅ `tickets.max_purchase` - Max seats per booking
- ✅ `seat_inventory.seat_type` - Maps to ticket class
- ✅ `registrations.ticket_id` - Links to ticket class

---

## API Endpoints Required

### Existing (Already Work):
- ✅ `GET /api/events/[id]/seats/availability?ticketClass=X`
- ✅ `POST /api/events/[id]/seats/reserve`
- ✅ `POST /api/events/[id]/registrations`

### Need to Create:
- ❌ `GET /api/events/[id]/tickets` - List all ticket classes
- ❌ `GET /api/events/[id]/tickets/[ticketId]` - Get single ticket class

---

## Files to Modify

1. `/apps/web/app/events/[id]/register/page.tsx`
   - Add ticket class selection UI
   - Fetch ticket classes
   - Save selection to localStorage
   - Redirect with ticket class param

2. `/apps/web/app/events/[id]/register-with-seats/page.tsx`
   - Load ticket class from URL/localStorage
   - Pass to SeatSelector
   - Include in registration submission

3. `/apps/web/components/events/SeatSelector.tsx`
   - Accept `ticketClassId` prop
   - Filter API call by ticket class
   - Show ticket class info in UI

4. `/apps/web/app/api/events/[id]/tickets/route.ts` (NEW)
   - List all active ticket classes for event

5. `/apps/web/app/api/events/[id]/tickets/[ticketId]/route.ts` (NEW)
   - Get single ticket class details

---

## Testing Checklist

- [ ] Ticket classes appear on registration page
- [ ] Selecting ticket class filters available seats
- [ ] Seat prices match ticket class price
- [ ] Registration includes correct ticket class ID
- [ ] Sold count increments after purchase
- [ ] Min/max purchase limits enforced
- [ ] Promo codes work with ticket classes
- [ ] Multiple ticket classes can coexist

---

## Next Steps

1. Create ticket class API endpoints
2. Update registration page with ticket selection
3. Update seat selection page to filter by ticket
4. Test end-to-end flow
5. Deploy and verify

