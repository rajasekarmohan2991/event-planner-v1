# API Documentation - Event Planner V1

## Base URL
- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.vercel.app/api`

## Authentication

All API endpoints require authentication via NextAuth session cookies, except public endpoints.

### Headers
```
Content-Type: application/json
Cookie: next-auth.session-token=xxx
```

---

## Events API

### List Events
```http
GET /api/events?page=1&size=10&status=PUBLISHED&search=conference
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `size` (number): Items per page (default: 10)
- `status` (string): Filter by status (DRAFT, PUBLISHED, CANCELLED)
- `search` (string): Search in name/description

**Response:**
```json
{
  "events": [
    {
      "id": 22,
      "name": "Tech Conference 2025",
      "description": "Annual tech conference",
      "startDate": "2025-03-15T09:00:00Z",
      "endDate": "2025-03-17T18:00:00Z",
      "venue": "Convention Center",
      "city": "Mumbai",
      "maxCapacity": 500,
      "status": "PUBLISHED",
      "createdAt": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

### Create Event
```http
POST /api/events
```

**Request Body:**
```json
{
  "name": "Tech Conference 2025",
  "description": "Annual tech conference",
  "startDate": "2025-03-15T09:00:00Z",
  "endDate": "2025-03-17T18:00:00Z",
  "venue": "Convention Center",
  "city": "Mumbai",
  "maxCapacity": 500,
  "status": "DRAFT"
}
```

**Response:**
```json
{
  "id": 23,
  "name": "Tech Conference 2025",
  "...": "..."
}
```

### Get Event Details
```http
GET /api/events/22
```

**Response:**
```json
{
  "id": 22,
  "name": "Tech Conference 2025",
  "description": "Annual tech conference",
  "startDate": "2025-03-15T09:00:00Z",
  "endDate": "2025-03-17T18:00:00Z",
  "venue": "Convention Center",
  "city": "Mumbai",
  "maxCapacity": 500,
  "currentRegistrations": 150,
  "status": "PUBLISHED",
  "createdBy": "user123",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Update Event
```http
PUT /api/events/22
```

**Request Body:**
```json
{
  "name": "Updated Event Name",
  "status": "PUBLISHED"
}
```

**Response:**
```json
{
  "success": true,
  "event": { "id": 22, "..." : "..." }
}
```

### Delete Event
```http
DELETE /api/events/22
```

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

## Registrations API

### List Registrations
```http
GET /api/events/22/registrations?page=1&size=20&status=APPROVED
```

**Query Parameters:**
- `page` (number): Page number
- `size` (number): Items per page
- `status` (string): Filter by status (PENDING, APPROVED, REJECTED)
- `search` (string): Search by name/email

**Response:**
```json
{
  "registrations": [
    {
      "id": "reg123",
      "eventId": 22,
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "type": "GENERAL",
      "status": "APPROVED",
      "checkInStatus": "NOT_CHECKED_IN",
      "createdAt": "2025-02-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Create Registration
```http
POST /api/events/22/registrations
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "phone": "+919876543210",
  "type": "GENERAL",
  "ticketId": "ticket123",
  "totalPrice": 1000,
  "priceInr": 900,
  "promoCode": "EARLY20",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "company": "Tech Corp",
    "dietaryPreferences": "Vegetarian"
  }
}
```

**Response:**
```json
{
  "id": "reg123",
  "eventId": 22,
  "email": "john@example.com",
  "checkInCode": "REG-22-abc123",
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "message": "Registration successful"
}
```

### Emergency Registration Endpoint
```http
POST /api/events/22/register-emergency
```

Simplified endpoint that bypasses complex validation.

**Request Body:**
```json
{
  "email": "john@example.com",
  "phone": "+919876543210",
  "type": "GENERAL",
  "data": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Get Registrations (Emergency)
```http
GET /api/events/22/registrations-emergency?page=1&size=20
```

Returns registrations with simplified format.

---

## Check-In API

### Check In Attendee
```http
POST /api/events/22/check-in
```

**Request Body:**
```json
{
  "registrationId": "reg123"
}
```

**Response:**
```json
{
  "success": true,
  "attendee": {
    "id": "reg123",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "checkInStatus": "CHECKED_IN",
    "checkInTime": "2025-03-15T09:30:00Z"
  }
}
```

### Emergency Check-In
```http
POST /api/events/22/checkin-emergency
```

**Request Body:**
```json
{
  "registrationId": "reg123"
}
```

Or with token:
```json
{
  "token": "base64-encoded-qr-data"
}
```

---

## Floor Plans API

### List Floor Plans
```http
GET /api/events/22/floor-plans-direct
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "floorPlans": [
    {
      "id": "plan123",
      "name": "Main Hall Layout",
      "eventId": "22",
      "canvasWidth": 1200,
      "canvasHeight": 800,
      "backgroundColor": "#ffffff",
      "totalCapacity": 200,
      "vipCapacity": 50,
      "premiumCapacity": 75,
      "generalCapacity": 75,
      "vipPrice": 5000,
      "premiumPrice": 3000,
      "generalPrice": 1500,
      "objects": [
        {
          "id": "table1",
          "type": "table",
          "shape": "round",
          "x": 100,
          "y": 100,
          "width": 80,
          "height": 80,
          "capacity": 8,
          "tier": "VIP"
        }
      ],
      "layoutData": { "...": "..." },
      "status": "ACTIVE",
      "createdAt": "2025-02-01T00:00:00Z"
    }
  ]
}
```

### Create/Update Floor Plan
```http
POST /api/events/22/design/floor-plan
```

**Request Body:**
```json
{
  "name": "Main Hall Layout",
  "canvasWidth": 1200,
  "canvasHeight": 800,
  "backgroundColor": "#ffffff",
  "gridSize": 20,
  "vipPrice": 5000,
  "premiumPrice": 3000,
  "generalPrice": 1500,
  "layoutData": {
    "objects": [
      {
        "id": "table1",
        "type": "table",
        "shape": "round",
        "x": 100,
        "y": 100,
        "width": 80,
        "height": 80,
        "capacity": 8,
        "tier": "VIP"
      }
    ]
  }
}
```

---

## Exhibitors API

### List Exhibitors
```http
GET /api/events/22/exhibitors
```

**Response:**
```json
{
  "exhibitors": [
    {
      "id": "exh123",
      "companyName": "Tech Corp",
      "contactName": "Jane Smith",
      "contactEmail": "jane@techcorp.com",
      "contactPhone": "+919876543210",
      "boothNumber": "A-101",
      "boothType": "Standard",
      "boothSize": "3x3",
      "status": "APPROVED",
      "paymentStatus": "COMPLETED",
      "paymentAmount": 50000,
      "createdAt": "2025-02-01T00:00:00Z"
    }
  ]
}
```

### Create Exhibitor
```http
POST /api/events/22/exhibitors
```

**Request Body:**
```json
{
  "companyName": "Tech Corp",
  "contactName": "Jane Smith",
  "contactEmail": "jane@techcorp.com",
  "contactPhone": "+919876543210",
  "boothType": "Standard",
  "electricalAccess": true,
  "displayTables": true,
  "notes": "Need corner booth"
}
```

### Approve Exhibitor
```http
POST /api/events/22/exhibitors/exh123/approve
```

**Response:**
```json
{
  "success": true,
  "boothNumber": "A-101",
  "message": "Exhibitor approved and booth assigned"
}
```

### Delete Exhibitor
```http
DELETE /api/events/22/exhibitors/exh123
```

**Response:**
```json
{
  "success": true,
  "message": "Exhibitor deleted successfully"
}
```

### Set Pricing
```http
POST /api/events/22/exhibitors/exh123/finalize-pricing
```

**Request Body:**
```json
{
  "basePrice": "40000",
  "electricalPrice": "5000",
  "tablesPrice": "3000",
  "otherCharges": "2000",
  "notes": "18% GST included"
}
```

### Process Refund
```http
POST /api/events/22/exhibitors/exh123/refund
```

**Request Body:**
```json
{
  "refundAmount": "50000",
  "reason": "Event cancelled"
}
```

---

## Payments API

### Razorpay - Create Order
```http
POST /api/payments/razorpay/create-order
```

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "registrationId": "reg123"
}
```

**Response:**
```json
{
  "orderId": "order_xxx",
  "amount": 1000,
  "currency": "INR",
  "key": "rzp_test_xxx"
}
```

### Razorpay - Verify Payment
```http
POST /api/payments/razorpay/verify
```

**Request Body:**
```json
{
  "orderId": "order_xxx",
  "paymentId": "pay_xxx",
  "signature": "signature_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified successfully"
}
```

### Stripe - Create Payment Intent
```http
POST /api/payments/stripe/create-intent
```

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "usd"
}
```

**Response:**
```json
{
  "clientSecret": "pi_xxx_secret_xxx"
}
```

---

## Notifications API

### Send SMS
```http
POST /api/notify/sms
```

**Request Body:**
```json
{
  "to": "+919876543210",
  "message": "Your registration is confirmed!"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SM123456"
}
```

### Send WhatsApp
```http
POST /api/test-whatsapp
```

**Request Body:**
```json
{
  "to": "+919876543210",
  "message": "🎉 Registration Confirmed!\n\nEvent: Tech Conference\nDate: March 15, 2025"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "WA123456"
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "error": "Error message",
  "message": "User-friendly message",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Common Error Codes

- `INVALID_INPUT` - Validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `DUPLICATE` - Resource already exists
- `PAYMENT_FAILED` - Payment processing failed
- `TENANT_MISMATCH` - Tenant isolation violation

---

## Rate Limiting

- **Development**: No limits
- **Production**: 
  - 100 requests per minute per IP
  - 1000 requests per hour per user

---

## Webhooks

### Razorpay Webhook
```http
POST /api/payments/razorpay/webhook
```

Receives payment status updates from Razorpay.

### Stripe Webhook
```http
POST /api/payments/stripe/webhook
```

Receives payment status updates from Stripe.

---

## Testing

### Test Data

Use these test credentials:

**Razorpay Test Cards:**
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

**Stripe Test Cards:**
- Success: `4242 4242 4242 4242`
- 3D Secure: `4000 0027 6000 3184`

### Example cURL Requests

```bash
# Create registration
curl -X POST http://localhost:3000/api/events/22/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+919876543210",
    "type": "GENERAL",
    "data": {
      "firstName": "Test",
      "lastName": "User"
    }
  }'

# Check in attendee
curl -X POST http://localhost:3000/api/events/22/check-in \
  -H "Content-Type: application/json" \
  -d '{"registrationId": "reg123"}'

# Get floor plans
curl http://localhost:3000/api/events/22/floor-plans-direct
```

---

**Last Updated**: December 26, 2025
