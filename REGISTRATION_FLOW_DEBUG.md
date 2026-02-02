# Event Registration Flow - Debugging Guide

## Complete Registration Flow

### 1. Floor Plan Generator
**Endpoint:** `POST /api/events/[id]/floor-plan/ai-generate`
**Issues to check:**
- AI generation might fail
- Floor plan not saving properly

### 2. Saving Floor Plan
**Endpoint:** `POST /api/events/[id]/floor-plan`
**Issues to check:**
- Floor plan data structure
- Database schema mismatch

### 3. Generating Seats from Floor Plan
**Endpoint:** `POST /api/events/[id]/seats/generate`
**Issues to check:**
- Seat inventory not created
- Floor plan ID mismatch

### 4. Opening Registration Page
**Page:** `/events/[id]/register-with-seats`
**Issues to check:**
- Seats not loading
- Floor plan not found

### 5. Seat Selection
**Frontend State Management**
**Issues to check:**
- Selected seats not updating
- Seat availability check failing

### 6. Promo Code Application
**Endpoint:** `POST /api/events/[id]/promo-codes/apply`
**Issues to check:**
- Amount in rupees vs paise (FIXED)
- Promo code validation

### 7. Payment Processing
**Endpoint:** `POST /api/events/[id]/registrations`
**Issues to check:**
- Missing required fields
- Ticket ID validation
- Order creation

### 8. QR Code Generation
**In registration endpoint**
**Issues to check:**
- QR code library
- Data format

## Common Errors and Fixes

### Error 1: "Missing required fields"
**Cause:** Frontend not sending firstName, lastName, email
**Fix:** Check registration form data structure

### Error 2: "Invalid ticket class"
**Cause:** Ticket ID not found or mismatch
**Fix:** Ensure ticket is created and ID is correct

### Error 3: "Seats not loading"
**Cause:** Seat inventory not generated from floor plan
**Fix:** Run seat generation endpoint

### Error 4: Promo code not working
**Cause:** Amount mismatch (rupees vs paise)
**Fix:** Already fixed - sends amount in rupees

### Error 5: QR code not generating
**Cause:** QRCode library issue or data too large
**Fix:** Check QR data size and format

## Testing Checklist

- [ ] Floor plan created successfully
- [ ] Seats generated from floor plan
- [ ] Registration page loads
- [ ] Seats are selectable
- [ ] Promo code applies correctly
- [ ] Payment processes
- [ ] QR code generated
- [ ] Email sent

## Debug Commands

```bash
# Check if seats exist for event
SELECT * FROM seat_inventory WHERE event_id = '[eventId]';

# Check if floor plan exists
SELECT * FROM floor_plans WHERE event_id = '[eventId]';

# Check registrations
SELECT * FROM registrations WHERE event_id = '[eventId]';

# Check orders
SELECT * FROM "Order" WHERE "eventId" = '[eventId]';
```

## API Test Sequence

1. Create floor plan
2. Generate seats
3. Test registration with:
   - Valid seat IDs
   - Valid email, firstName, lastName
   - Optional promo code
   - Total price

## Next Steps

If registration still fails:
1. Check browser console for errors
2. Check Vercel function logs
3. Share the specific error message
4. Test each endpoint individually
