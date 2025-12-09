# QR Code Check-In System - Complete Workflow

## ✅ Issue Fixed

**Problem**: QR scanner was sending `{ code: text }` but API expected `{ token, location, deviceId, idempotencyKey }`

**Solution**: Updated `/apps/web/app/events/[id]/event-day/check-in/event/page.tsx` to send correct payload format.

---

## 🔄 Complete QR Check-In Workflow

### Step 1: Generate QR Code for Attendee

When an attendee registers, generate a signed QR code token:

```typescript
GET /api/events/[eventId]/tickets/[ticketId]/qr

Response:
{
  "token": "eyJ2IjoxLCJ0eXAiOiJDSEVDS0lOIiwiZXZlbnRJZCI6IjEiLCJ0aWNrZXRJZCI6InRpY2tldDEyMyIsImlhdCI6MTY5OTk5OTk5OSwiZXhwIjoxNzAwMDAzNTk5LCJuIjoiYWJjZGVmMTIzNDU2Nzg5MCJ9.c2lnbmF0dXJlX2hlcmU",
  "payload": {
    "v": 1,
    "typ": "CHECKIN",
    "eventId": "1",
    "ticketId": "ticket123",
    "iat": 1699999999,
    "exp": 1700003599,
    "n": "abcdef1234567890"
  }
}
```

**Token Structure:**
- `v`: Version (1)
- `typ`: Token type (CHECKIN)
- `eventId`: Event ID
- `ticketId`: Ticket/Registration ID
- `iat`: Issued at (Unix timestamp)
- `exp`: Expires at (Unix timestamp, 1 hour validity)
- `n`: Nonce for idempotency

**Security:**
- Token is HMAC-SHA256 signed
- Uses `CHECKIN_SECRET` or `NEXTAUTH_SECRET`
- Base64URL encoded
- Format: `{payload}.{signature}`

---

### Step 2: Display QR Code to Attendee

Convert the token to a QR code and display/email to attendee:

```typescript
import QRCode from 'qrcode'

// Generate QR code image
const qrCodeDataURL = await QRCode.toDataURL(token, {
  errorCorrectionLevel: 'H',
  width: 300,
  margin: 2,
})

// Display in email or ticket
<img src={qrCodeDataURL} alt="Check-in QR Code" />
```

**Best Practices:**
- Include QR code in registration confirmation email
- Add to downloadable ticket PDF
- Display in mobile app/web ticket view
- Print on physical badges

---

### Step 3: Scan QR Code at Event

Staff uses the QR scanner page to check in attendees:

**Scanner URL:**
```
/events/[eventId]/event-day/check-in/event
```

**Scanner Features:**
- ✅ Real-time camera scanning using ZXing library
- ✅ Automatic token validation
- ✅ Idempotent check-ins (prevents duplicates)
- ✅ Success/error feedback
- ✅ Auto-clear messages after 3-5 seconds

**Scanner Payload:**
```typescript
POST /api/events/[eventId]/checkin
{
  "token": "eyJ2IjoxLCJ0eXAiOiJDSEVDS0lOIi4uLg==",
  "location": "QR Scanner",
  "deviceId": "Mozilla/5.0...",
  "idempotencyKey": "qr-1699999999-abc123"
}
```

---

### Step 4: API Validates & Records Check-In

**Validation Steps:**
1. ✅ Verify HMAC signature
2. ✅ Check token type is "CHECKIN"
3. ✅ Verify eventId matches
4. ✅ Check token not expired
5. ✅ Check idempotency (prevent duplicate scans)
6. ✅ Record check-in in database

**API Response:**
```typescript
// Success
{
  "ok": true,
  "record": {
    "t": "2024-11-03T08:30:00.000Z",
    "by": "user123",
    "loc": "QR Scanner",
    "dev": "Mozilla/5.0...",
    "idem": "qr-1699999999-abc123",
    "payload": { ... }
  }
}

// Already checked in (idempotent)
{
  "ok": true,
  "already": true,
  "record": { ... }
}

// Error
{
  "message": "token expired" | "bad signature" | "wrong event"
}
```

---

## 🎯 Complete Integration Example

### 1. After Registration - Generate & Email QR Code

```typescript
// In registration API route
import QRCode from 'qrcode'
import { sendEmail } from '@/lib/email'

// Generate token
const tokenRes = await fetch(`/api/events/${eventId}/tickets/${ticketId}/qr`)
const { token } = await tokenRes.json()

// Generate QR code
const qrCode = await QRCode.toDataURL(token, {
  errorCorrectionLevel: 'H',
  width: 300
})

// Send email with QR code
await sendEmail({
  to: attendeeEmail,
  subject: 'Your Event Ticket',
  html: `
    <h1>Your Ticket for ${eventName}</h1>
    <p>Show this QR code at the entrance:</p>
    <img src="${qrCode}" alt="Check-in QR Code" />
    <p><strong>Ticket ID:</strong> ${ticketId}</p>
  `
})
```

---

### 2. At Event - Staff Check-In Flow

**Option A: QR Scanner (Recommended)**
1. Staff navigates to `/events/[id]/event-day/check-in/event`
2. Clicks "Start Camera"
3. Points camera at attendee's QR code
4. System automatically:
   - Decodes QR
   - Validates token
   - Records check-in
   - Shows success message

**Option B: Manual Check-In**
1. Staff navigates to `/events/[id]/event-day`
2. Enters attendee email
3. Clicks "Check In"
4. System finds registration and marks as checked in

---

## 🔐 Security Features

### Token Security
- ✅ HMAC-SHA256 signed (prevents tampering)
- ✅ Time-limited (1 hour validity by default)
- ✅ Event-specific (can't use for wrong event)
- ✅ Nonce-based idempotency (prevents replay attacks)

### API Security
- ✅ Requires authentication (staff/organizer/owner only)
- ✅ Role-based access control (RBAC)
- ✅ Timing-safe signature comparison
- ✅ Idempotency keys prevent duplicate check-ins

---

## 📊 Check-In Data Storage

Check-ins are stored in `KeyValue` table:

```typescript
{
  namespace: "checkin",
  key: "evt:1:tkt:ticket123",
  value: {
    t: "2024-11-03T08:30:00.000Z",  // Timestamp
    by: "staff-user-id",             // Staff who checked in
    loc: "QR Scanner",               // Location/method
    dev: "Mozilla/5.0...",           // Device info
    idem: "qr-1699999999-abc123",    // Idempotency key
    payload: { ... }                 // Original token payload
  }
}
```

---

## 🎨 UI Components

### QR Scanner Component
- **File**: `/apps/web/app/events/[id]/event-day/check-in/event/page.tsx`
- **Features**:
  - Live camera feed
  - Real-time QR decoding
  - Success/error messages
  - Start/stop controls

### Event Day Dashboard
- **File**: `/apps/web/app/events/[id]/event-day/page.tsx`
- **Features**:
  - Live stats (total, checked-in, remaining)
  - Manual check-in by email
  - QR scanner link
  - Auto-refresh every 10 seconds

---

## 🚀 Environment Variables

```bash
# Required for QR token signing
CHECKIN_SECRET=your-secure-secret-here

# Fallback (if CHECKIN_SECRET not set)
NEXTAUTH_SECRET=your-nextauth-secret
```

---

## 📱 Mobile App Integration

For mobile apps, use the same token format:

```typescript
// Generate QR in mobile app
import QRCode from 'react-native-qrcode-svg'

<QRCode
  value={token}
  size={250}
  backgroundColor="white"
  color="black"
/>
```

---

## 🔧 Troubleshooting

### Error: "token required" (400)
- **Cause**: Missing `token` field in request
- **Fix**: Ensure QR scanner sends `{ token: "..." }`

### Error: "bad signature" (400)
- **Cause**: Token signature doesn't match
- **Fix**: Check `CHECKIN_SECRET` matches between generation and validation

### Error: "token expired" (400)
- **Cause**: Token older than 1 hour
- **Fix**: Generate new QR code for attendee

### Error: "wrong event" (400)
- **Cause**: Token generated for different event
- **Fix**: Ensure scanning at correct event

### Video Warning: "Trying to play video that is already playing"
- **Cause**: ZXing scanner trying to restart video
- **Fix**: This is harmless, can be ignored or fixed by improving scanner lifecycle

---

## ✅ Testing Checklist

- [ ] Generate QR token via API
- [ ] Display QR code in browser
- [ ] Open scanner page
- [ ] Start camera
- [ ] Scan QR code
- [ ] Verify success message
- [ ] Try scanning same QR again (should show "already checked in")
- [ ] Check database for check-in record
- [ ] Verify live stats update

---

## 📈 Future Enhancements

- [ ] Offline queue for poor connectivity
- [ ] Bulk QR generation for all attendees
- [ ] QR code customization (colors, logo)
- [ ] Check-in analytics dashboard
- [ ] Export check-in reports
- [ ] SMS/WhatsApp QR delivery
- [ ] Apple Wallet / Google Pay integration
- [ ] Multi-device sync for check-ins

---

## 🎉 Status

✅ **QR Scanner Fixed** - Now sends correct payload format
✅ **Token Generation** - Already implemented
✅ **Token Validation** - Already implemented
✅ **Idempotency** - Already implemented
✅ **Security** - HMAC signing implemented

**Ready to use!** Just rebuild and test the workflow.
