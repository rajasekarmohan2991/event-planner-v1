# Quick Action Guide - Seat Selection Fixes

## 🚀 What Was Fixed

1. **✅ Seat Numbering** - Now shows B1, B2, B3... instead of B1, B2, B1, B2...
2. **✅ Ticket Pricing** - Can configure VIP/Premium/General prices per event
3. **✅ Price Integration** - Seats automatically use configured prices

---

## 🎯 Immediate Actions Required

### Step 1: Regenerate Floor Plan for Event 8

**Why**: Old seats have wrong numbering and hardcoded prices

**How**:
1. Login to application
2. Go to Event 8
3. Navigate to: **Design → Floor Plan**
4. Click **"Generate Floor Plan"** button
5. Wait for completion

**Result**: New seats with correct sequential numbering!

---

### Step 2: Configure Ticket Prices (Optional)

**Default Prices**:
- VIP: ₹500
- Premium: ₹300
- General: ₹150

**To Change Prices** (using API for now):
```bash
curl -X POST http://localhost:3001/api/events/8/settings/tickets \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "vipPrice": 750,
    "premiumPrice": 450,
    "generalPrice": 200
  }'
```

**Then**: Regenerate floor plan to apply new prices

---

### Step 3: Test Seat Selection

1. Go to Event 8 registration page
2. Click **"Select Seats"**
3. **Verify**:
   - ✅ Seats show unique numbers (B1, B2, B3...)
   - ✅ Prices are correct
   - ✅ Can select multiple seats
   - ✅ Total price calculates correctly

---

### Step 4: Complete Test Registration

1. Select 2-3 seats
2. Fill registration form:
   - First Name
   - Last Name
   - Email
   - Phone (optional)
3. Click **"Register"**
4. **Verify**:
   - ✅ Registration successful
   - ✅ No 500 error
   - ✅ Confirmation shown
   - ✅ Email sent (check inbox)

---

## 🔍 Verification Queries

### Check Seat Numbering:
```sql
SELECT section, row_number, seat_number, seat_type, base_price 
FROM seat_inventory 
WHERE event_id = 8 
ORDER BY id 
LIMIT 20;
```

**Expected**: Sequential numbers (1, 2, 3, 4, 5...)

### Check Ticket Settings:
```sql
SELECT * FROM event_ticket_settings WHERE event_id = 8;
```

### Check Recent Registrations:
```sql
SELECT id, event_id, email, created_at 
FROM registrations 
WHERE event_id = 8 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 🐛 If Issues Occur

### Issue: Still seeing B1, B2, B1, B2...
**Solution**: 
1. Delete old seats: `DELETE FROM seat_inventory WHERE event_id = 8;`
2. Regenerate floor plan
3. Clear browser cache: `Cmd+Shift+R`

### Issue: Prices still 500/300/150
**Solution**:
1. Set custom prices via API (see Step 2)
2. Regenerate floor plan
3. Verify with database query

### Issue: Registration 500 error
**Solution**:
1. Check Docker logs: `docker-compose logs web --tail=50`
2. Verify seat reservations table exists
3. Check registration form data

---

## 📞 Support Commands

### View Docker Logs:
```bash
docker-compose logs web --tail=100
```

### Restart Web Container:
```bash
docker-compose restart web
```

### Check Database Connection:
```bash
docker-compose exec postgres psql -U postgres -d event_planner -c "\dt"
```

---

## ✅ Success Checklist

- [ ] Floor plan regenerated for Event 8
- [ ] Seat numbers are sequential (verified in UI)
- [ ] Seat numbers are sequential (verified in database)
- [ ] Ticket prices configured (if custom prices needed)
- [ ] Seat selection works correctly
- [ ] Registration completes successfully
- [ ] No 500 errors
- [ ] Email confirmation received

---

**Status**: Ready to Test!
**Priority**: High - Test seat selection immediately
**Time Required**: 10-15 minutes
