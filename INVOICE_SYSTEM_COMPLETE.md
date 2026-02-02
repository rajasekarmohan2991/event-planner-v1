# Invoice System - Complete Implementation Guide

## ✅ What's Been Implemented

### 1. Invoice Creation API
**Endpoint**: `POST /api/events/[id]/invoices/create`

**Features**:
- ✅ Automatic invoice number generation
- ✅ Tax calculation based on tenant settings
- ✅ Line items support
- ✅ Payment link generation
- ✅ Email delivery option

**Request Example**:
```json
{
  "type": "EXHIBITOR",
  "entityId": "exhibitor-123",
  "payerName": "John Doe",
  "payerEmail": "john@example.com",
  "payerPhone": "+91 9876543210",
  "payerCompany": "ABC Corp",
  "payerAddress": "123 Main St, Mumbai",
  "items": [
    {
      "description": "Exhibitor Booth - Premium",
      "quantity": 1,
      "unitPrice": 50000,
      "amount": 50000
    },
    {
      "description": "Additional Table",
      "quantity": 2,
      "unitPrice": 5000,
      "amount": 10000
    }
  ],
  "notes": "Payment due within 7 days",
  "dueDate": "2026-01-26",
  "sendEmail": true
}
```

**Response**:
```json
{
  "success": true,
  "invoice": {
    "id": "uuid-here",
    "invoiceNumber": "EXH-3600-12345678",
    "amount": 70800,
    "status": "PENDING",
    "paymentLink": "https://yourapp.com/invoices/uuid/pay",
    "downloadLink": "https://yourapp.com/api/events/36/invoices/uuid/download"
  }
}
```

### 2. Invoice Download API
**Endpoint**: `GET /api/events/[id]/invoices/[invoiceId]/download`

**Features**:
- ✅ Professional HTML invoice generation
- ✅ Automatic download as HTML file
- ✅ Print-ready format
- ✅ Company branding included

### 3. Payment Link Generation
**Endpoint**: `GET /api/events/[id]/invoices/[invoiceId]/payment-link`

**Features**:
- ✅ Secure token generation (32-byte hex)
- ✅ 7-day expiration
- ✅ Unique payment URL per invoice

**Endpoint**: `POST /api/events/[id]/invoices/[invoiceId]/payment-link`

**Features**:
- ✅ Email delivery with payment link
- ✅ Professional email template
- ✅ Amount and due date display

### 4. Public Payment Page
**URL**: `/invoices/[invoiceId]/pay?token=xxx`

**Features**:
- ✅ Secure token verification
- ✅ Invoice details display
- ✅ Payment gateway integration ready
- ✅ Download invoice option
- ✅ Responsive design

### 5. Public Invoice API
**Endpoint**: `GET /api/invoices/[invoiceId]?token=xxx`

**Features**:
- ✅ Token-based authentication
- ✅ Expiration checking
- ✅ Full invoice details
- ✅ Line items included

## 📋 Database Schema Requirements

The invoice system requires these columns in the `invoices` table:

```sql
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_token TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_token_expires TIMESTAMP;
```

## 🔧 How to Use

### Creating an Invoice

```typescript
// Example: Create invoice for exhibitor
const response = await fetch(`/api/events/${eventId}/invoices/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'EXHIBITOR',
    entityId: exhibitorId,
    payerName: 'Company Name',
    payerEmail: 'billing@company.com',
    payerPhone: '+91 9876543210',
    payerCompany: 'Company Pvt Ltd',
    items: [
      {
        description: 'Booth Space - 10x10',
        quantity: 1,
        unitPrice: 50000,
        amount: 50000
      }
    ],
    notes: 'Payment due within 7 days',
    dueDate: '2026-01-30',
    sendEmail: true
  })
})

const { invoice } = await response.json()
console.log('Payment Link:', invoice.paymentLink)
```

### Generating Payment Link

```typescript
// Get payment link
const response = await fetch(
  `/api/events/${eventId}/invoices/${invoiceId}/payment-link`
)
const { paymentLink } = await response.json()

// Or send via email
await fetch(
  `/api/events/${eventId}/invoices/${invoiceId}/payment-link`,
  { method: 'POST' }
)
```

### Downloading Invoice

```typescript
// Direct download
window.open(
  `/api/events/${eventId}/invoices/${invoiceId}/download`,
  '_blank'
)
```

## 💰 Amount Calculation

The system automatically calculates:

1. **Subtotal**: Sum of all line item amounts
2. **Tax**: Calculated from tenant's tax structure (default 18% GST)
3. **Total**: Subtotal + Tax

**Example**:
- Item 1: ₹50,000
- Item 2: ₹10,000
- **Subtotal**: ₹60,000
- **Tax (18%)**: ₹10,800
- **Total**: ₹70,800

## 🎨 Invoice Design Features

- ✅ Professional gradient header
- ✅ Company branding
- ✅ Status badges (PAID/PENDING/OVERDUE)
- ✅ Detailed line items table
- ✅ Tax breakdown
- ✅ Payment information (if paid)
- ✅ Bank details (if pending)
- ✅ Notes section
- ✅ Print-optimized CSS

## 🔐 Security Features

1. **Token-Based Access**: Payment links use secure 32-byte tokens
2. **Expiration**: Tokens expire after 7 days
3. **Validation**: Token verified before showing invoice
4. **HTTPS Required**: All payment links use HTTPS

## 📧 Email Templates

### Invoice Email
- Subject: `Invoice [NUMBER] - [EVENT NAME]`
- Professional HTML design
- Download link included
- Payment instructions

### Payment Link Email
- Subject: `Payment Request - Invoice [NUMBER]`
- Prominent "Pay Now" button
- Amount highlighted
- Expiration notice

## 🚀 Next Steps

### 1. Add Payment Token Columns
```bash
# Run this SQL in your database
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_token TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_token_expires TIMESTAMP;
```

### 2. Test Invoice Creation
```bash
curl -X POST http://localhost:3001/api/events/36/invoices/create \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EXHIBITOR",
    "payerName": "Test Company",
    "payerEmail": "test@example.com",
    "items": [{"description": "Test Item", "quantity": 1, "unitPrice": 10000, "amount": 10000}]
  }'
```

### 3. Integrate Payment Gateway

The payment page is ready for integration with:
- **Razorpay**: Add Razorpay checkout
- **Stripe**: Add Stripe checkout session
- **PayPal**: Add PayPal integration

## 📝 Invoice Types Supported

- `EXHIBITOR`: Exhibitor booth payments
- `SPONSOR`: Sponsorship packages
- `VENDOR`: Vendor services
- `SPEAKER`: Speaker fees

## 🎯 Features Summary

| Feature | Status | Endpoint |
|---------|--------|----------|
| Create Invoice | ✅ | POST `/api/events/[id]/invoices/create` |
| Download Invoice | ✅ | GET `/api/events/[id]/invoices/[id]/download` |
| Generate Payment Link | ✅ | GET `/api/events/[id]/invoices/[id]/payment-link` |
| Send Payment Email | ✅ | POST `/api/events/[id]/invoices/[id]/payment-link` |
| Public Payment Page | ✅ | `/invoices/[id]/pay` |
| Public Invoice API | ✅ | GET `/api/invoices/[id]` |
| Tax Calculation | ✅ | Automatic from tenant settings |
| Email Delivery | ✅ | Optional on creation |
| Secure Tokens | ✅ | 32-byte hex with expiration |

## ⚠️ Current Registration Issue

**Note**: There's a separate registration issue with seat selection that needs to be addressed:
- 400 error on `/api/events/36/seats/generate`
- 400 error on registration submission
- Missing required fields or ticket validation failing

This is unrelated to the invoice system and should be debugged separately.

---

**Status**: ✅ Invoice system fully implemented and ready for use
**Date**: 2026-01-19
**Files Created**: 5 new API endpoints + 1 payment page
