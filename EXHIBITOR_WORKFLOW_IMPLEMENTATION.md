# Exhibitor Workflow Implementation Plan

## Overview
Complete exhibitor registration workflow with email notifications and payment integration.

## Workflow Steps

### 1. Exhibitor Fills Form
**Action:** Exhibitor submits registration form
**Trigger:** POST `/api/events/[id]/exhibitors`
**Email:** Send to admin with exhibitor details

**Email Content:**
- Subject: "New Exhibitor Registration - [Event Name]"
- Company Name
- Contact Details
- Booth Type & Size
- Additional Services
- Link to approve/review

### 2. Booth Booking Successful
**Action:** Admin allocates booth OR auto-allocation
**Trigger:** POST `/api/events/[id]/exhibitors/[exhibitorId]/allocate-booth`
**Email:** Send to exhibitor with payment details

**Email Content:**
- Subject: "Booth Allocation Confirmed - Payment Required"
- Booth Details (Number, Size, Location)
- Cost Breakdown:
  - Base Booth Price
  - Additional Services (Electrical, Tables, etc.)
  - Subtotal
  - Tax (GST/VAT)
  - **Total Amount**
- Payment Link (Razorpay/Stripe)
- Payment Due Date

### 3. Payment Received
**Action:** Payment webhook received
**Trigger:** POST `/api/webhooks/payment` (Razorpay/Stripe)
**Status Update:** Change booth status to "CONFIRMED"
**Email:** Send confirmation to exhibitor

**Email Content:**
- Subject: "Payment Received - Booth Confirmed"
- Payment Receipt
- Booth Confirmation Details
- Event Details
- Next Steps

## Database Schema Updates Needed

### Exhibitor Table (Already exists)
- status: PENDING_CONFIRMATION → PAYMENT_PENDING → CONFIRMED
- paymentStatus: PENDING → PAID
- paymentAmount: Decimal
- paymentDate: DateTime
- paymentId: String (from payment gateway)

### Payment Table (Create if not exists)
- id
- exhibitorId
- eventId
- amount
- tax
- total
- status
- paymentGatewayId
- paymentMethod
- createdAt
- paidAt

## API Endpoints to Create/Update

1. **POST `/api/events/[id]/exhibitors`**
   - Add email notification to admin
   - Include all form fields

2. **POST `/api/events/[id]/exhibitors/[exhibitorId]/allocate-booth`**
   - Calculate total cost
   - Generate payment link
   - Send email with payment details

3. **POST `/api/events/[id]/exhibitors/[exhibitorId]/payment`**
   - Create payment record
   - Generate Razorpay/Stripe payment link
   - Return payment URL

4. **POST `/api/webhooks/payment`**
   - Verify payment signature
   - Update exhibitor status to CONFIRMED
   - Send confirmation email

## Email Templates Needed

1. **admin-new-exhibitor.html**
2. **exhibitor-payment-request.html**
3. **exhibitor-payment-confirmation.html**

## Implementation Priority

1. ✅ Update exhibitor POST endpoint with admin email
2. ✅ Create booth allocation endpoint
3. ✅ Create payment generation endpoint
4. ✅ Create payment webhook handler
5. ✅ Create email templates
6. ✅ Test end-to-end flow

## Cost Calculation Logic

```typescript
const basePrice = boothType.price // From booth configuration
const electricalFee = electricalAccess ? 500 : 0
const tableFee = displayTables ? 300 : 0
const subtotal = basePrice + electricalFee + tableFee
const tax = subtotal * 0.18 // 18% GST
const total = subtotal + tax
```

## Status Flow

```
PENDING_CONFIRMATION (Form submitted)
  ↓
AWAITING_APPROVAL (Admin reviewing)
  ↓
PAYMENT_PENDING (Booth allocated, payment link sent)
  ↓
PAYMENT_COMPLETED (Payment received)
  ↓
CONFIRMED (Booth confirmed)
```
