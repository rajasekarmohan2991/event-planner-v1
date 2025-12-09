# Comprehensive Fix Plan - All Critical Issues

## Date: November 14, 2025 5:40 PM IST

---

## 🎯 Issues to Fix

### 1. ✅ Exhibitors - Cannot Add New
**Status**: Table created
**Solution**: Created exhibitors table with all required fields

### 2. ❌ Promo Codes - Cannot Save/Use in Registration
**Problem**: Promo codes not being applied during registration
**Solution**: 
- Fix promo code application in registration flow
- Store promo code usage in promo_redemptions table
- Calculate discount correctly

### 3. ❌ Payment Details - Not Reflected in Payment Module
**Problem**: Payments table structure mismatch
**Solution**:
- Add registration_id column to payments table
- Create payment record during registration
- Link payment to registration

### 4. ❌ Sales Summary - Not Showing Real Data
**Problem**: Mock data instead of real registrations
**Solution**:
- Query actual registrations from database
- Calculate real revenue from payments
- Count actual ticket sales

### 5. ❌ Registration Approvals - Not Showing Real Data
**Problem**: Mock data, no real approval workflow
**Solution**:
- Create registration_approvals table
- Fetch pending registrations
- Implement approve/deny actions

### 6. ❌ Cancellation Approvals - Not Showing Real Data
**Problem**: Mock data, no real cancellation workflow
**Solution**:
- Create cancellation_requests table
- Fetch pending cancellations
- Implement approve/deny refund actions

### 7. ❌ Event Registrations - Not Showing Real Data
**Problem**: Shows "No registrations yet" despite successful registration
**Solution**:
- Fix registration query to fetch real data
- Display all registrations for event
- Show registration details

### 8. ❌ RSVP System - Not Implemented
**Problem**: No RSVP email system
**Solution**:
- Create RSVP email template with Attending/Maybe/Not Attending buttons
- Generate unique RSVP tokens
- Create RSVP response endpoint
- Store responses in rsvp_responses table

---

## 📋 Implementation Order

### Phase 1: Database Schema (DONE)
- [x] Create exhibitors table
- [x] Create rsvp_responses table
- [x] Create registration_approvals table
- [x] Create cancellation_requests table
- [ ] Fix payments table structure

### Phase 2: Fix Existing Issues
1. Fix payments table to link with registrations
2. Fix promo code application in registration
3. Fix sales summary to show real data
4. Fix event registrations display

### Phase 3: Implement Workflows
1. Registration approval workflow
2. Cancellation approval workflow
3. RSVP email system

### Phase 4: Testing
1. Test exhibitor creation
2. Test registration with promo code
3. Test payment tracking
4. Test approval workflows
5. Test RSVP system

---

## 🔧 Technical Implementation

### 1. Fix Payments Table
```sql
ALTER TABLE payments ADD COLUMN IF NOT EXISTS registration_id BIGINT REFERENCES registrations(id);
CREATE INDEX IF NOT EXISTS idx_payments_registration ON payments(registration_id);
```

### 2. Promo Code Application
**File**: `/api/events/[id]/registrations/route.ts`
- Check for promo code in request
- Validate promo code
- Calculate discount
- Create promo_redemption record
- Apply discount to payment amount

### 3. Sales Summary API
**File**: `/api/events/[id]/sales/summary/route.ts`
- Query registrations count
- Sum payment amounts for revenue
- Calculate conversion rate
- Get ticket sales by type

### 4. Registration Approvals API
**File**: `/api/events/[id]/approvals/registrations/route.ts`
- GET: Fetch pending registrations
- POST: Approve/deny registration

### 5. Cancellation Approvals API
**File**: `/api/events/[id]/approvals/cancellations/route.ts`
- GET: Fetch pending cancellations
- POST: Approve/deny refund

### 6. RSVP System
**Files**:
- `/api/events/[id]/rsvp/send/route.ts` - Send RSVP emails
- `/api/rsvp/respond/route.ts` - Handle RSVP responses
- Email template with buttons

---

## 📊 Database Schema

### Exhibitors Table (CREATED)
```sql
CREATE TABLE exhibitors (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  website VARCHAR(500),
  notes TEXT,
  -- ... additional fields
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Payments Table (TO FIX)
```sql
ALTER TABLE payments 
ADD COLUMN registration_id BIGINT REFERENCES registrations(id),
ADD COLUMN payment_method VARCHAR(50),
ADD COLUMN payment_details JSONB;
```

### RSVP Responses Table (CREATED)
```sql
CREATE TABLE rsvp_responses (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  email VARCHAR(255) NOT NULL,
  response VARCHAR(50) CHECK (response IN ('ATTENDING', 'MAYBE', 'NOT_ATTENDING')),
  response_token VARCHAR(255) UNIQUE,
  responded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Registration Approvals Table (CREATED)
```sql
CREATE TABLE registration_approvals (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING',
  approved_by BIGINT,
  approved_at TIMESTAMP,
  denial_reason TEXT
);
```

### Cancellation Requests Table (CREATED)
```sql
CREATE TABLE cancellation_requests (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT NOT NULL,
  reason TEXT,
  refund_amount DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'PENDING',
  processed_by BIGINT,
  processed_at TIMESTAMP
);
```

---

## ✅ Success Criteria

- [ ] Can add new exhibitors
- [ ] Promo codes save and apply correctly
- [ ] Payment details show in payment module
- [ ] Sales summary shows real data
- [ ] Registration approvals show real pending registrations
- [ ] Cancellation approvals show real pending cancellations
- [ ] Event registrations display shows real data
- [ ] RSVP emails sent with response buttons
- [ ] RSVP responses stored and tracked

---

**Status**: Implementation in progress
**Priority**: CRITICAL
**Estimated Time**: 3-4 hours for complete implementation
