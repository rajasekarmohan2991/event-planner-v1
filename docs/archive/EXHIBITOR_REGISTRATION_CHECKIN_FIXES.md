# Exhibitor Registration & Check-in Fixes

## Issues Fixed

### 1. ✅ Exhibitor Registration Email & Approval Workflow

**Issue:** 
- Exhibitors not receiving emails after registration
- Status stuck at PENDING_APPROVAL
- Payment status stuck at PENDING

**Solution:**
Updated approval workflow to properly handle status transitions and prepare for email notifications.

**Files Modified:**
1. `/apps/web/app/api/events/[id]/exhibitors/[exhibitorId]/approve/route.ts`
   - Updates status to APPROVED
   - Sets payment_status to PENDING
   - Calculates final amount
   - Prepares exhibitor details for email
   - Logs email notification (backend integration needed)

2. `/apps/web/app/api/events/[id]/exhibitors/[exhibitorId]/confirm-payment/route.ts` (NEW)
   - Confirms payment after exhibitor pays
   - Updates payment_status to PAID
   - Updates status to CONFIRMED
   - Records payment method

**Workflow:**
```
1. Exhibitor submits registration
   ↓ status: PENDING_APPROVAL, payment_status: PENDING
   
2. Admin reviews in Exhibitor Approvals page
   ↓
   
3. Admin enters final amount and clicks Approve
   ↓ status: APPROVED, payment_status: PENDING
   ↓ Email sent to exhibitor with payment details
   
4. Exhibitor makes payment
   ↓
   
5. Admin confirms payment
   ↓ status: CONFIRMED, payment_status: PAID
```

---

### 2. ✅ Registration Form dietaryOptions Error

**Issue:** 
```
ReferenceError: dietaryOptions is not defined
```

**Root Cause:**
`dietaryOptions` was defined in the parent `RegisterPage` component but used in the nested `GeneralRegistrationForm` component, causing a scope error.

**Solution:**
Added `dietaryOptions` state directly to `GeneralRegistrationForm` component with API fetch.

**File Modified:**
`/apps/web/app/events/[id]/register/page.tsx`
- Added `dietaryOptions` state to `GeneralRegistrationForm`
- Added useEffect to fetch dietary options from lookup API
- Fallback to hardcoded options if API fails
- Fixed typo: "Glutten" → "Gluten"

**Code Added:**
```typescript
const [dietaryOptions, setDietaryOptions] = useState<string[]>([])

useEffect(() => {
  fetch('/api/lookups/by-name/dietary_restrictions')
    .then(r => r.json())
    .then(data => {
      if (data.options && Array.isArray(data.options)) {
        setDietaryOptions(data.options.map((opt: any) => opt.label || opt.value))
      } else {
        setDietaryOptions(["None", "Vegetarian", "Gluten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
      }
    })
    .catch(() => {
      setDietaryOptions(["None", "Vegetarian", "Gluten Allergy", "Lactose Allergy", "Nut Allergy", "Shellfish Allergy"])
    })
}, [])
```

---

### 3. ✅ QR Code Check-in Functionality

**Issue:**
- 404 error when scanning registration QR code
- No endpoint to verify QR code and fetch attendee details
- No duplicate entry prevention

**Solution:**
Created QR code verification endpoint and enhanced check-in flow.

**Files Created:**

1. `/apps/web/app/api/registrations/verify-qr/route.ts` (NEW)
   - GET endpoint to verify QR code token
   - Decodes base64 token
   - Validates registration data
   - Checks if already checked in
   - Returns attendee details
   - Prevents duplicate entries

**API Usage:**
```
GET /api/registrations/verify-qr?token=BASE64_TOKEN

Response:
{
  "valid": true,
  "attendee": {
    "id": "123",
    "eventId": "14",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "registrationType": "GENERAL",
    "status": "CONFIRMED"
  },
  "alreadyCheckedIn": false,
  "checkedInAt": null
}
```

**Check-in Flow:**
```
1. Scan QR code
   ↓
2. Extract token from QR code
   ↓
3. Call /api/registrations/verify-qr?token=TOKEN
   ↓
4. If valid and not checked in:
   - Show attendee details
   - Display "Check In" button
   ↓
5. Click Check In
   ↓
6. Call /api/events/[id]/checkin with token
   ↓
7. Success: "Entry Successful!"
   ↓
8. If scan same QR again:
   - API returns alreadyCheckedIn: true
   - Show "Already Entered Hall" message
   - Display check-in timestamp
```

**Existing Check-in API:**
`/apps/web/app/api/events/[id]/checkin/route.ts`
- Already handles duplicate prevention
- Uses idempotency keys
- Stores check-in records in key_value table
- Returns "already: true" for duplicate scans

---

## Backend Integration Required

### Email Notifications

The Java backend needs to send emails at these points:

#### 1. Admin Notification (When Exhibitor Registers)
```java
@PostMapping("/events/{id}/exhibitors/register")
public void notifyAdmins(ExhibitorRegistration reg) {
    // Get event managers and admins
    List<User> admins = getEventAdmins(reg.getEventId());
    
    // Send email to each
    for (User admin : admins) {
        emailService.send(
            admin.getEmail(),
            "New Exhibitor Registration - " + event.getName(),
            buildAdminNotificationEmail(reg)
        );
    }
}
```

**Email Template:**
```
Subject: New Exhibitor Registration Pending Approval

A new exhibitor has registered for {eventName}:

Company: {companyName}
Contact: {contactName}
Email: {contactEmail}
Phone: {contactPhone}
Booth: {boothSize} ({boothType})
Calculated Amount: ₹{totalAmount}

Please review and approve:
{appUrl}/exhibitor-approvals

Thank you,
Event Planner System
```

#### 2. Exhibitor Approval Email
```java
@PostMapping("/events/{id}/exhibitors/{exhibitorId}/approve")
public void sendApprovalEmail(ExhibitorRegistration reg, double finalAmount) {
    emailService.send(
        reg.getContactEmail(),
        "Exhibitor Registration Approved - " + event.getName(),
        buildApprovalEmail(reg, finalAmount)
    );
}
```

**Email Template:**
```
Subject: Exhibitor Registration Approved!

Dear {contactName},

Your exhibitor registration for "{eventName}" has been APPROVED!

Company: {companyName}
Booth: {boothSize} ({boothType})
Final Payment Amount: ₹{finalAmount}

Payment Instructions:
1. Bank Transfer: [Bank Details]
2. Online Payment: [Payment Link]
3. UPI: [UPI ID]

Please complete payment within 7 days to confirm your booth.

Thank you,
Event Planner Team
```

#### 3. Payment Confirmation Email
```java
@PostMapping("/events/{id}/exhibitors/{exhibitorId}/confirm-payment")
public void sendPaymentConfirmation(ExhibitorRegistration reg) {
    emailService.send(
        reg.getContactEmail(),
        "Payment Confirmed - Booth Reserved!",
        buildPaymentConfirmationEmail(reg)
    );
}
```

**Email Template:**
```
Subject: Payment Confirmed - Your Booth is Reserved!

Dear {contactName},

Payment received! Your booth for "{eventName}" is now confirmed.

Company: {companyName}
Booth: {boothSize} ({boothType})
Amount Paid: ₹{totalAmount}
Payment Method: {paymentMethod}

Event Details:
Date: {eventDate}
Venue: {eventVenue}
Setup Time: {setupTime}

We'll send you booth setup instructions closer to the event date.

Thank you,
Event Planner Team
```

---

## Database Status Values

### Exhibitor Registration Status:
- `PENDING_APPROVAL` - Initial status after registration
- `APPROVED` - Admin approved, awaiting payment
- `CONFIRMED` - Payment received, booth confirmed
- `REJECTED` - Admin rejected
- `CANCELLED` - Cancelled by exhibitor or admin

### Payment Status:
- `PENDING` - No payment yet
- `PAID` - Full payment received
- `PARTIAL` - Partial payment received
- `REFUNDED` - Payment refunded

---

## Testing Instructions

### Test Exhibitor Registration:
1. Go to: http://localhost:3001/events/14/exhibitor-registration/register
2. Fill in company and booth details
3. Submit registration
4. **Verify:**
   - ✅ Status: PENDING_APPROVAL
   - ✅ Payment Status: PENDING
   - ✅ Appears in exhibitor-approvals page

### Test Approval Workflow:
1. Login as Admin/Event Manager
2. Go to: http://localhost:3001/exhibitor-approvals
3. Enter final payment amount
4. Click "Approve"
5. **Verify:**
   - ✅ Status changes to APPROVED
   - ✅ Payment Status: PENDING
   - ✅ Console logs show email details
   - ⚠️ Email sending needs backend integration

### Test Payment Confirmation:
1. After approval, exhibitor makes payment
2. Admin calls confirm-payment endpoint:
```bash
curl -X POST http://localhost:3001/api/events/14/exhibitors/123/confirm-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod": "Bank Transfer", "transactionId": "TXN123"}'
```
3. **Verify:**
   - ✅ Status: CONFIRMED
   - ✅ Payment Status: PAID

### Test Registration Form:
1. Go to: http://localhost:3001/events/14/register
2. Fill in form
3. Click "Continue" button
4. **Verify:**
   - ✅ No dietaryOptions error
   - ✅ Form proceeds to next step
   - ✅ Dietary restrictions checkboxes appear

### Test QR Code Check-in:
1. Register for an event (get QR code)
2. Extract token from QR code
3. Test verification:
```bash
curl "http://localhost:3001/api/registrations/verify-qr?token=BASE64_TOKEN"
```
4. **Verify:**
   - ✅ Returns attendee details
   - ✅ alreadyCheckedIn: false

5. Check in:
```bash
curl -X POST http://localhost:3001/api/events/14/checkin \
  -H "Content-Type: application/json" \
  -d '{"token": "BASE64_TOKEN"}'
```
6. **Verify:**
   - ✅ Returns ok: true
   - ✅ Check-in recorded

7. Scan same QR again:
```bash
curl "http://localhost:3001/api/registrations/verify-qr?token=BASE64_TOKEN"
```
8. **Verify:**
   - ✅ alreadyCheckedIn: true
   - ✅ Shows check-in timestamp
   - ✅ Prevents duplicate entry

---

## Files Created/Modified

### Created:
1. `/apps/web/app/api/events/[id]/exhibitors/[exhibitorId]/confirm-payment/route.ts`
2. `/apps/web/app/api/registrations/verify-qr/route.ts`

### Modified:
1. `/apps/web/app/api/events/[id]/exhibitors/[exhibitorId]/approve/route.ts`
2. `/apps/web/app/events/[id]/register/page.tsx`

---

## Build Status

```
✅ Web service restarted
✅ Registration form error fixed
✅ QR verification endpoint created
✅ Exhibitor approval workflow enhanced
✅ Payment confirmation endpoint created
✅ All services running
⚠️ Email integration needs backend
```

---

## Summary

**✅ Exhibitor registration workflow enhanced** - Status transitions working  
**✅ Registration form error fixed** - dietaryOptions scope issue resolved  
**✅ QR code check-in implemented** - Verification and duplicate prevention  
**✅ Payment confirmation added** - Complete workflow support  
**⚠️ Email notifications** - Backend integration needed  

The frontend infrastructure is complete. Once the backend implements email sending at the appropriate workflow points, the complete exhibitor registration and check-in system will be fully functional! 🚀
