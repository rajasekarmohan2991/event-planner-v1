# Vendor Not Showing - Troubleshooting Guide

## 🔍 Problem

You added a vendor but it's showing "No vendors" or the vendor list is empty.

## 🎯 Most Likely Causes

### **1. Database Table Doesn't Exist**
The `event_vendors` table might not be created in your database yet.

### **2. API Error (500)**
The API is failing to fetch vendors due to missing table or schema issues.

### **3. Wrong Event ID**
The vendor was added to a different event.

### **4. Vendor Status is CANCELLED**
The vendor exists but has status='CANCELLED' so it's filtered out.

---

## 🔧 Debugging Steps

### **Step 1: Check Browser Console**

After the latest deployment, the vendor page will show detailed error messages:

1. Open the Vendors page
2. Open browser DevTools (F12 or Right-click → Inspect)
3. Go to Console tab
4. Look for messages:
   - ✅ `✅ Vendor data received:` - Success, shows vendor data
   - ❌ `❌ Vendor API error:` - Failed, shows error details

### **Step 2: Check Network Tab**

1. Open DevTools → Network tab
2. Refresh the Vendors page
3. Find the request to `/api/events/{id}/vendors`
4. Click on it
5. Check:
   - **Status**: Should be 200 (OK)
   - **Response**: Should show `{"vendors": [...], "total": X}`

**If Status is 500**:
- Click on the request
- Go to "Response" tab
- You'll see the error message

---

## 🛠️ Common Fixes

### **Fix 1: Table Doesn't Exist (Most Common)**

**Symptoms**:
- API returns 500 error
- Error message: "relation 'event_vendors' does not exist"
- Or: "Database schema updated. Please retry."

**Solution**:
The API has **auto-repair** built in. Just:
1. Refresh the page
2. The API will create the table automatically
3. Try adding a vendor again

**Manual Fix** (if auto-repair fails):
```sql
-- Run this in your database (Neon, Supabase, etc.)
CREATE TABLE IF NOT EXISTS event_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  tenant_id TEXT,
  name TEXT NOT NULL,
  category TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contract_amount NUMERIC DEFAULT 0,
  paid_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'PENDING',
  payment_due_date DATE,
  status TEXT DEFAULT 'ACTIVE',
  notes TEXT,
  contract_url TEXT,
  invoice_url TEXT,
  bank_name TEXT,
  account_number TEXT,
  ifsc_code TEXT,
  account_holder_name TEXT,
  upi_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### **Fix 2: Check Database Directly**

**Connect to your database** (Neon/Supabase):

```sql
-- Check if table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'event_vendors';

-- Check if any vendors exist
SELECT * FROM event_vendors;

-- Check vendors for specific event
SELECT * FROM event_vendors 
WHERE event_id = 'YOUR_EVENT_ID';
```

---

### **Fix 3: Verify Vendor Was Saved**

When you save a vendor, check:
1. Does it show "Vendor added successfully!" alert?
2. Check browser console for errors
3. Check Network tab for the POST request to `/api/events/{id}/vendors`
4. Response should be: `{"message": "Vendor created successfully", "vendor": {...}}`

---

### **Fix 4: Check Vendor Status**

Vendors with `status='CANCELLED'` are filtered out. Check database:

```sql
SELECT id, name, status, category 
FROM event_vendors 
WHERE event_id = 'YOUR_EVENT_ID';
```

If status is 'CANCELLED', update it:
```sql
UPDATE event_vendors 
SET status = 'ACTIVE' 
WHERE id = 'VENDOR_ID';
```

---

## 📊 Expected Data Flow

### **When Adding a Vendor**:

1. **User fills form** → Clicks "Save Vendor"
2. **Frontend sends POST** → `/api/events/{eventId}/vendors`
3. **API validates** → Checks event exists
4. **API inserts** → Into `event_vendors` table
5. **API returns** → `{"message": "Vendor created successfully", "vendor": {...}}`
6. **Frontend refreshes** → Calls `fetchBudgetsAndVendors()`
7. **API fetches** → `SELECT * FROM event_vendors WHERE event_id = ...`
8. **Frontend displays** → Vendor appears in category card

### **When Loading Vendors Page**:

1. **Page loads** → `useEffect` triggers
2. **Fetch vendors** → `GET /api/events/{eventId}/vendors`
3. **API queries** → `SELECT * FROM event_vendors WHERE event_id = ...`
4. **API returns** → `{"vendors": [...], "total": X}`
5. **Frontend groups** → By category (CATERING, VENUE, etc.)
6. **Frontend displays** → In budget cards

---

## 🔍 Detailed Error Messages

After deployment, you'll see these messages:

### **Success**:
```
✅ Vendor data received: {vendors: Array(5), total: 5}
```

### **Table Missing**:
```
❌ Vendor API error: {message: "relation 'event_vendors' does not exist"}
Alert: "Failed to load vendors: relation 'event_vendors' does not exist"
```

### **Database Connection Error**:
```
❌ Vendor API error: {message: "Failed to fetch vendors", error: "..."}
Alert: "Failed to load vendors: Failed to fetch vendors"
```

### **Event Not Found**:
```
❌ Vendor API error: {message: "Event not found"}
Alert: "Failed to load vendors: Event not found"
```

---

## 🎯 Quick Checklist

- [ ] Open browser DevTools → Console
- [ ] Check for error messages
- [ ] Look for "❌ Vendor API error" or "✅ Vendor data received"
- [ ] If error, read the message
- [ ] If "table does not exist", refresh page (auto-repair)
- [ ] If still failing, check database directly
- [ ] Verify event ID is correct
- [ ] Check vendor status is not 'CANCELLED'
- [ ] Try adding a new vendor and watch console

---

## 🚀 After Deployment

Once Vercel deploys (1-2 minutes):

1. **Go to Vendors page**
2. **Open browser console** (F12)
3. **You'll see one of**:
   - ✅ Success message with vendor data
   - ❌ Error message explaining the issue
4. **Follow the error message** to fix

---

## 📝 Testing Steps

1. **Open Vendors page**
2. **Check console** - Should see: `✅ Vendor data received: {...}`
3. **If error** - Alert will show the problem
4. **If "table does not exist"**:
   - Refresh page
   - Table will be created automatically
   - Try again
5. **Add a new vendor**:
   - Fill form
   - Save
   - Check console for success/error
   - Vendor should appear in category card

---

## 🔧 Manual Database Check

If you want to verify directly in your database:

```sql
-- 1. Check if table exists
\dt event_vendors

-- 2. Check all vendors
SELECT id, name, category, status, event_id 
FROM event_vendors 
ORDER BY created_at DESC;

-- 3. Check for specific event (replace with your event ID)
SELECT * FROM event_vendors 
WHERE event_id = '28';

-- 4. Count vendors by category
SELECT category, COUNT(*) 
FROM event_vendors 
GROUP BY category;

-- 5. Check vendor details
SELECT 
  id,
  name,
  category,
  contract_amount,
  paid_amount,
  status,
  created_at
FROM event_vendors
WHERE event_id = '28'
ORDER BY created_at DESC;
```

---

## 📍 File Locations

- **Frontend Page**: `/apps/web/app/events/[id]/vendors/page.tsx`
- **API Route**: `/apps/web/app/api/events/[id]/vendors/route.ts`
- **Database Table**: `event_vendors`

---

## 🎉 Summary

**Most likely issue**: The `event_vendors` table doesn't exist in your database yet.

**Solution**: 
1. Wait for Vercel deployment
2. Open Vendors page
3. Check browser console for error message
4. If "table does not exist", refresh page
5. API will auto-create the table
6. Try adding vendor again

**The new error handling will tell you exactly what's wrong!** 🎯
