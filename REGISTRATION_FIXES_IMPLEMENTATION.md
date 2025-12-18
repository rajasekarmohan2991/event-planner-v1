# Critical Registration & Validation Fixes - Implementation Plan

## Issues Identified

### 1. ❌ Registration Submission Not Working
**Problem:** Registration flow broken, not completing properly
**Impact:** Users cannot register for events

### 2. ❌ No QR Code Generation
**Problem:** QR codes not being generated for registrations
**Impact:** No check-in capability

### 3. ❌ No Ticket Class Validation (SELLING POINT!)
**Problem:** Registrations not validating against ticket class rules
**Impact:** Can exceed capacity, wrong ticket types accepted

### 4. ❌ Date/Time Validation Missing
**Problem:** No validation for event dates and times
**Impact:** Can create sessions outside event time, data inconsistency

### 5. ❌ Promo Code Time Validation Missing
**Problem:** Promo codes should expire 30 mins before event
**Impact:** Can use promo codes during event

---

## Priority 1: Fix Registration Flow

### Current Issues in Registration API

**File:** `apps/web/app/api/events/[id]/registrations/route.ts`

**Problems:**
1. Missing QR code generation
2. No ticket class validation
3. No capacity checking
4. Payment record creation might be failing
5. Error handling not detailed enough

### Solution: Enhanced Registration Flow

```typescript
// POST /api/events/[id]/registrations

async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = BigInt(params.id)
    const formData = await req.json()
    
    // 1. VALIDATE EVENT EXISTS AND IS ACTIVE
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { ticketClasses: true }
    })
    
    if (!event) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    
    // 2. VALIDATE EVENT TIMING
    const now = new Date()
    const eventStart = new Date(event.startsAt || event.startDate)
    const eventEnd = new Date(event.endsAt || event.endDate)
    
    if (now > eventEnd) {
      return NextResponse.json({ 
        message: 'Event has ended. Registration closed.' 
      }, { status: 400 })
    }
    
    if (now > eventStart) {
      return NextResponse.json({ 
        message: 'Event has already started. Registration closed.' 
      }, { status: 400 })
    }
    
    // 3. VALIDATE TICKET CLASS
    const ticketClass = event.ticketClasses.find(tc => 
      tc.id === formData.ticketClassId
    )
    
    if (!ticketClass) {
      return NextResponse.json({ 
        message: 'Invalid ticket class' 
      }, { status: 400 })
    }
    
    // 4. CHECK TICKET CLASS AVAILABILITY
    const soldCount = await prisma.registration.count({
      where: {
        eventId: eventId,
        dataJson: {
          path: ['ticketClassId'],
          equals: ticketClass.id
        },
        status: 'APPROVED'
      }
    })
    
    if (ticketClass.capacity && soldCount >= ticketClass.capacity) {
      return NextResponse.json({ 
        message: `Ticket class "${ticketClass.name}" is sold out` 
      }, { status: 400 })
    }
    
    // 5. VALIDATE TICKET CLASS RULES
    // Check min/max quantity
    const quantity = formData.quantity || 1
    if (ticketClass.minQuantity && quantity < ticketClass.minQuantity) {
      return NextResponse.json({ 
        message: `Minimum ${ticketClass.minQuantity} tickets required` 
      }, { status: 400 })
    }
    
    if (ticketClass.maxQuantity && quantity > ticketClass.maxQuantity) {
      return NextResponse.json({ 
        message: `Maximum ${ticketClass.maxQuantity} tickets allowed` 
      }, { status: 400 })
    }
    
    // 6. VALIDATE PROMO CODE (if provided)
    let finalAmount = ticketClass.price * quantity
    let discountAmount = 0
    let promoCodeId: bigint | null = null
    
    if (formData.promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: {
          code: formData.promoCode,
          eventId: eventId,
          isActive: true
        }
      })
      
      if (!promo) {
        return NextResponse.json({ 
          message: 'Invalid promo code' 
        }, { status: 400 })
      }
      
      // VALIDATE PROMO CODE TIMING
      // Promo codes expire 30 minutes before event
      const promoExpiryTime = new Date(eventStart.getTime() - 30 * 60 * 1000)
      
      if (now > promoExpiryTime) {
        return NextResponse.json({ 
          message: 'Promo code expired (codes expire 30 minutes before event)' 
        }, { status: 400 })
      }
      
      if (promo.startsAt && promo.startsAt > now) {
        return NextResponse.json({ 
          message: 'Promo code not yet active' 
        }, { status: 400 })
      }
      
      if (promo.endsAt && promo.endsAt < now) {
        return NextResponse.json({ 
          message: 'Promo code has expired' 
        }, { status: 400 })
      }
      
      // Check usage limits
      const usageCount = await prisma.promoRedemption.count({
        where: { promoCodeId: promo.id }
      })
      
      if (promo.maxRedemptions && usageCount >= promo.maxRedemptions) {
        return NextResponse.json({ 
          message: 'Promo code usage limit reached' 
        }, { status: 400 })
      }
      
      // Calculate discount
      if (promo.type === 'PERCENTAGE') {
        discountAmount = (finalAmount * Number(promo.amount)) / 100
      } else if (promo.type === 'FIXED') {
        discountAmount = Number(promo.amount)
      }
      
      finalAmount = Math.max(0, finalAmount - discountAmount)
      promoCodeId = promo.id
    }
    
    // 7. CREATE REGISTRATION
    const registrationData = {
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone || '',
      ticketClassId: ticketClass.id,
      ticketClassName: ticketClass.name,
      quantity: quantity,
      originalAmount: ticketClass.price * quantity,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      promoCode: formData.promoCode || null,
      status: 'CONFIRMED',
      registeredAt: new Date().toISOString()
    }
    
    // 8. GENERATE QR CODE
    const qrData = {
      registrationId: crypto.randomUUID(), // Will be updated after creation
      eventId: params.id,
      email: formData.email,
      name: `${formData.firstName} ${formData.lastName}`,
      ticketClass: ticketClass.name,
      quantity: quantity,
      timestamp: new Date().toISOString()
    }
    
    const qrCodeBase64 = Buffer.from(JSON.stringify(qrData)).toString('base64')
    
    // 9. CREATE IN TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // Create registration
      const registration = await tx.registration.create({
        data: {
          eventId: eventId,
          dataJson: registrationData,
          type: 'VIRTUAL',
          email: formData.email,
          status: 'APPROVED'
        }
      })
      
      // Update QR data with actual registration ID
      qrData.registrationId = String(registration.id)
      const finalQRCode = Buffer.from(JSON.stringify(qrData)).toString('base64')
      
      // Create payment record
      await tx.order.create({
        data: {
          eventId: String(eventId),
          email: formData.email,
          status: finalAmount > 0 ? 'PAID' : 'CREATED',
          paymentStatus: finalAmount > 0 ? 'COMPLETED' : 'FREE',
          totalInr: finalAmount,
          meta: {
            registrationId: String(registration.id),
            ticketClassId: ticketClass.id,
            quantity: quantity,
            originalAmount: ticketClass.price * quantity,
            discountAmount: discountAmount
          }
        }
      })
      
      // Create promo redemption if used
      if (promoCodeId && formData.userId) {
        await tx.promoRedemption.create({
          data: {
            promoCodeId: promoCodeId,
            userId: BigInt(formData.userId),
            orderAmount: ticketClass.price * quantity,
            discountAmount: discountAmount
          }
        })
      }
      
      return { registration, qrCode: finalQRCode }
    })
    
    // 10. SEND CONFIRMATION EMAIL WITH QR CODE
    await sendEmail({
      to: formData.email,
      subject: `Registration Confirmed - ${event.name}`,
      html: `
        <h1>Registration Confirmed!</h1>
        <p>Hi ${formData.firstName},</p>
        <p>Your registration for ${event.name} is confirmed.</p>
        
        <h2>Ticket Details:</h2>
        <ul>
          <li>Ticket Class: ${ticketClass.name}</li>
          <li>Quantity: ${quantity}</li>
          <li>Amount Paid: ₹${finalAmount}</li>
        </ul>
        
        <h2>Your QR Code:</h2>
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.qrCode)}" />
        
        <p>Please present this QR code at the event for check-in.</p>
      `
    })
    
    // 11. RETURN SUCCESS
    return NextResponse.json({
      id: String(result.registration.id),
      qrCode: result.qrCode,
      ticketClass: ticketClass.name,
      quantity: quantity,
      amount: finalAmount,
      message: 'Registration successful'
    }, { status: 201 })
    
  } catch (error: any) {
    console.error('❌ Registration error:', error)
    return NextResponse.json({
      message: error.message || 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
```

---

## Priority 2: Ticket Class Validation (SELLING POINT!)

### Ticket Class Rules

```typescript
interface TicketClass {
  id: string
  name: string
  price: number
  capacity: number | null
  minQuantity: number | null
  maxQuantity: number | null
  salesStartAt: Date | null
  salesEndAt: Date | null
  isActive: boolean
  requiresApproval: boolean
  allowedUserTypes: string[] | null // ['MEMBER', 'NON_MEMBER', 'VIP']
}
```

### Validation Rules

**1. Capacity Check:**
```typescript
const soldCount = await prisma.registration.count({
  where: {
    eventId: eventId,
    ticketClassId: ticketClass.id,
    status: 'APPROVED'
  }
})

if (ticketClass.capacity && soldCount >= ticketClass.capacity) {
  throw new Error('Ticket class sold out')
}
```

**2. Quantity Limits:**
```typescript
if (ticketClass.minQuantity && quantity < ticketClass.minQuantity) {
  throw new Error(`Minimum ${ticketClass.minQuantity} tickets required`)
}

if (ticketClass.maxQuantity && quantity > ticketClass.maxQuantity) {
  throw new Error(`Maximum ${ticketClass.maxQuantity} tickets allowed`)
}
```

**3. Sales Period:**
```typescript
const now = new Date()

if (ticketClass.salesStartAt && now < ticketClass.salesStartAt) {
  throw new Error('Ticket sales have not started yet')
}

if (ticketClass.salesEndAt && now > ticketClass.salesEndAt) {
  throw new Error('Ticket sales have ended')
}
```

**4. User Type Restriction:**
```typescript
if (ticketClass.allowedUserTypes && ticketClass.allowedUserTypes.length > 0) {
  const userType = getUserType(userId) // Get from user profile
  
  if (!ticketClass.allowedUserTypes.includes(userType)) {
    throw new Error(`This ticket is only for ${ticketClass.allowedUserTypes.join(', ')}`)
  }
}
```

---

## Priority 3: Date/Time Validation

### Event Creation Validation

```typescript
// When creating/updating event
function validateEventDates(startDate: Date, endDate: Date) {
  const now = new Date()
  
  // Start date must be in future
  if (startDate < now) {
    throw new Error('Event start date must be in the future')
  }
  
  // End date must be after start date
  if (endDate <= startDate) {
    throw new Error('Event end date must be after start date')
  }
  
  // Reasonable duration check (optional)
  const durationDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  if (durationDays > 365) {
    throw new Error('Event duration cannot exceed 365 days')
  }
  
  return true
}
```

### Session Time Validation

```typescript
// When creating session
function validateSessionTime(sessionStart: Date, sessionEnd: Date, event: Event) {
  const eventStart = new Date(event.startsAt || event.startDate)
  const eventEnd = new Date(event.endsAt || event.endDate)
  
  // Session must be within event time
  if (sessionStart < eventStart) {
    throw new Error(`Session cannot start before event (${eventStart.toLocaleString()})`)
  }
  
  if (sessionEnd > eventEnd) {
    throw new Error(`Session cannot end after event (${eventEnd.toLocaleString()})`)
  }
  
  // Session end must be after start
  if (sessionEnd <= sessionStart) {
    throw new Error('Session end time must be after start time')
  }
  
  // Minimum session duration (15 minutes)
  const durationMinutes = (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)
  if (durationMinutes < 15) {
    throw new Error('Session must be at least 15 minutes long')
  }
  
  return true
}
```

---

## Priority 4: Promo Code Time Validation

### Promo Code Expiry Rule

**Rule:** Promo codes expire 30 minutes before event start time

```typescript
function validatePromoCode(promoCode: PromoCode, event: Event) {
  const now = new Date()
  const eventStart = new Date(event.startsAt || event.startDate)
  
  // Calculate promo expiry time (30 mins before event)
  const promoExpiryTime = new Date(eventStart.getTime() - 30 * 60 * 1000)
  
  // Check if promo code has expired
  if (now > promoExpiryTime) {
    throw new Error(
      `Promo code expired at ${promoExpiryTime.toLocaleString()} ` +
      `(30 minutes before event start)`
    )
  }
  
  // Check promo code's own validity period
  if (promoCode.startsAt && now < promoCode.startsAt) {
    throw new Error('Promo code not yet active')
  }
  
  if (promoCode.endsAt && now > promoCode.endsAt) {
    throw new Error('Promo code has expired')
  }
  
  // Additional check: Don't allow if event has started
  if (now > eventStart) {
    throw new Error('Cannot use promo codes after event has started')
  }
  
  return true
}
```

### Promo Code UI Display

```tsx
<PromoCodeInput>
  {promoCode && (
    <div className="text-xs text-gray-600 mt-1">
      ⏰ Promo codes expire 30 minutes before event start
      <br />
      Expires: {getPromoExpiryTime(event).toLocaleString()}
    </div>
  )}
</PromoCodeInput>
```

---

## Priority 5: QR Code Generation

### QR Code Implementation

```typescript
import QRCode from 'qrcode'

async function generateRegistrationQR(registration: Registration, event: Event) {
  const qrData = {
    type: 'EVENT_REGISTRATION',
    registrationId: registration.id,
    eventId: event.id,
    eventName: event.name,
    attendeeName: `${registration.firstName} ${registration.lastName}`,
    attendeeEmail: registration.email,
    ticketClass: registration.ticketClassName,
    quantity: registration.quantity,
    checkInCode: generateCheckInCode(registration),
    timestamp: new Date().toISOString()
  }
  
  // Generate QR code as data URL
  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 300,
    margin: 2
  })
  
  return {
    qrCode: qrCodeDataURL,
    qrData: JSON.stringify(qrData),
    checkInCode: qrData.checkInCode
  }
}

function generateCheckInCode(registration: Registration): string {
  // Format: EVT-{eventId}-{registrationId}-{random}
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `EVT-${registration.eventId}-${registration.id}-${random}`
}
```

---

## Implementation Checklist

### Phase 1: Fix Registration API ✅
- [ ] Add event validation
- [ ] Add ticket class validation
- [ ] Add capacity checking
- [ ] Add quantity limits
- [ ] Add promo code validation with 30-min rule
- [ ] Generate QR code
- [ ] Send confirmation email with QR
- [ ] Better error handling

### Phase 2: Date/Time Validation ✅
- [ ] Event creation validation
- [ ] Session time validation
- [ ] Registration time validation
- [ ] Promo code time validation

### Phase 3: Ticket Class Rules ✅
- [ ] Capacity enforcement
- [ ] Quantity limits
- [ ] Sales period validation
- [ ] User type restrictions
- [ ] Real-time availability display

### Phase 4: QR Code System ✅
- [ ] QR generation on registration
- [ ] QR in confirmation email
- [ ] QR download from dashboard
- [ ] QR check-in system

### Phase 5: UI Updates ✅
- [ ] Show ticket availability
- [ ] Show promo expiry time
- [ ] Show validation errors clearly
- [ ] Display QR code
- [ ] Download QR button

---

## Testing Scenarios

### 1. Ticket Class Validation
- ✅ Try to register for sold-out ticket class
- ✅ Try to buy less than minimum quantity
- ✅ Try to buy more than maximum quantity
- ✅ Try to register outside sales period

### 2. Date/Time Validation
- ✅ Try to create event with past date
- ✅ Try to create event with end before start
- ✅ Try to create session outside event time
- ✅ Try to register after event started

### 3. Promo Code Validation
- ✅ Try to use promo 30 mins before event
- ✅ Try to use promo after event started
- ✅ Try to use expired promo
- ✅ Try to use inactive promo

### 4. QR Code
- ✅ QR generated on registration
- ✅ QR sent in email
- ✅ QR downloadable
- ✅ QR scannable

---

## Error Messages

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
  EVENT_ENDED: 'This event has ended. Registration is closed.',
  EVENT_STARTED: 'This event has already started. Registration is closed.',
  TICKET_SOLD_OUT: 'Sorry, this ticket class is sold out.',
  MIN_QUANTITY: 'Minimum {min} tickets required for this class.',
  MAX_QUANTITY: 'Maximum {max} tickets allowed for this class.',
  PROMO_EXPIRED: 'Promo code expired (codes expire 30 minutes before event).',
  PROMO_NOT_ACTIVE: 'Promo code is not yet active.',
  PROMO_LIMIT_REACHED: 'Promo code usage limit reached.',
  INVALID_TICKET_CLASS: 'Invalid ticket class selected.',
  SESSION_OUTSIDE_EVENT: 'Session time must be within event time.',
  INVALID_EVENT_DATES: 'Event end date must be after start date.'
}
```

---

## Next Steps

1. **Fix Registration API** (Priority 1)
   - Add all validations
   - Generate QR codes
   - Send emails

2. **Implement Ticket Class Rules** (Selling Point!)
   - Capacity checking
   - Quantity limits
   - Sales period

3. **Add Date/Time Validation**
   - Event creation
   - Session creation
   - Registration timing

4. **Implement Promo Code 30-Min Rule**
   - Time validation
   - Clear error messages
   - UI indicators

5. **Test Everything**
   - All validation scenarios
   - QR code generation
   - Email delivery
   - Error handling

---

## Benefits

✅ Robust registration system
✅ Ticket class validation (selling point!)
✅ QR code for check-in
✅ Promo code time rules
✅ Date/time validation
✅ Better error messages
✅ Professional workflow
✅ Prevents overbooking
✅ Prevents invalid registrations
✅ Automated QR generation
