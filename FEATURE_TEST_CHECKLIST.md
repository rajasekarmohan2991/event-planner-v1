# Feature Testing Checklist - Identify What's Not Working

## Test Each Feature and Mark Status

### 1. Registration System
- [ ] Can create a registration
- [ ] Registration appears in list
- [ ] QR code displays correctly
- [ ] Email confirmation sent
- [ ] Stats update (Total, Approved, etc.)

**Issue if any:** ___________________________

---

### 2. Floor Plan Designer
- [ ] Can access floor plan page
- [ ] Can create/edit floor plan
- [ ] Can save floor plan
- [ ] AI generation works
- [ ] Drag and drop works

**Issue if any:** ___________________________

---

### 3. Currency Converter
- [ ] Shows real exchange rates (not 0)
- [ ] Can convert between currencies
- [ ] Rates auto-refresh
- [ ] All currencies available

**Issue if any:** ___________________________

---

### 4. Sponsor Management
- [ ] Can create a sponsor
- [ ] Sponsor appears in list
- [ ] Can edit sponsor
- [ ] Can delete sponsor
- [ ] All fields save correctly

**Issue if any:** ___________________________

---

### 5. Vendor Management
- [ ] Can create a vendor
- [ ] Vendor appears in list
- [ ] Can upload files
- [ ] Payment tracking works
- [ ] Can edit/delete vendors

**Issue if any:** ___________________________

---

### 6. Team Members
- [ ] Can invite team members
- [ ] Invites appear in list
- [ ] Can manage roles
- [ ] Members display correctly

**Issue if any:** ___________________________

---

### 7. Exhibitor Management
- [ ] Can create exhibitor
- [ ] Approval workflow works
- [ ] Booth assignment works
- [ ] Payment processing works

**Issue if any:** ___________________________

---

### 8. Event Settings
- [ ] General settings save
- [ ] Registration settings save
- [ ] Payment settings save
- [ ] Notification settings save
- [ ] Settings persist after reload

**Issue if any:** ___________________________

---

### 9. Communication Tab
- [ ] Email invites work
- [ ] SMS tab loads phone numbers
- [ ] WhatsApp tab loads phone numbers
- [ ] Social share works

**Issue if any:** ___________________________

---

### 10. Promo Codes
- [ ] Can create promo code
- [ ] Promo code appears in list
- [ ] Can apply promo code
- [ ] Discount calculates correctly

**Issue if any:** ___________________________

---

## Most Common Issues Right Now

Based on our session, these are likely the issues:

### Issue #1: Registrations Not Appearing
**Cause:** Event doesn't exist in Supabase database  
**Fix:** Create event in production or ensure Event 20 exists

### Issue #2: Floor Plan 404
**Cause:** Event doesn't exist in database  
**Fix:** Same as above

### Issue #3: Stats Showing 0
**Cause:** No registrations in database  
**Fix:** Create registrations after ensuring event exists

### Issue #4: Local vs Production Data Mismatch
**Cause:** Local .env pointing to local PostgreSQL instead of Supabase  
**Fix:** Update DATABASE_URL in .env to Supabase URL

### Issue #5: QR Code Not Displaying
**Cause:** Registration not saved to database  
**Fix:** Ensure event exists and registration API is working

---

## Quick Diagnostic Commands

Run these to check status:

```bash
# Check database connection
cd apps/web && npx tsx quick-check.ts

# Check if Event 20 exists
cd apps/web && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.event.findUnique({ where: { id: BigInt(20) } })
  .then(e => console.log(e ? 'Event 20 exists' : 'Event 20 NOT found'))
  .finally(() => prisma.\$disconnect());
"

# Check registrations count
cd apps/web && npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.registration.count({ where: { eventId: BigInt(20) } })
  .then(c => console.log('Registrations:', c))
  .finally(() => prisma.\$disconnect());
"
```

---

## Tell Me Which Features Are Broken

Please specify which of these are NOT working:
1. ___________________________
2. ___________________________
3. ___________________________
4. ___________________________
5. ___________________________

Then I can fix them specifically!
