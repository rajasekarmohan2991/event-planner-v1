# 📋 Event Planner - Feature Documentation

## 🎯 RSVP System

### **What is RSVP?**
RSVP (Répondez s'il vous plaît - "Please respond") allows users to indicate their interest in attending an event **WITHOUT formally registering or paying**.

### **How it Works:**
1. **User sees event card** with "I'm Interested" button
2. **Clicks button** to express interest
3. **Selects response type:**
   - 👥 **Going** - User plans to attend
   - 🤔 **Maybe** - User is considering attending
   - ❌ **Not Going** - User cannot attend
   - ⏳ **Pending** - User hasn't decided yet

4. **Data is saved** to `rsvp_interests` table with:
   - Name
   - Email
   - Response Type (GOING/MAYBE/NOT_GOING/PENDING)
   - Status: **"NOT_REGISTERED"** (they haven't paid/registered yet)
   - Created timestamp

### **Key Difference: RSVP vs Registration**
| Feature | RSVP | Registration |
|---------|------|--------------|
| **Purpose** | Express interest | Confirm attendance |
| **Payment** | ❌ No payment | ✅ Payment required |
| **Commitment** | Low (just interested) | High (paid/confirmed) |
| **Status** | NOT_REGISTERED | REGISTERED/APPROVED |
| **Ticket** | ❌ No ticket | ✅ Ticket generated |

### **RSVP Reports:**
- **Location:** `/events/[id]/rsvp-reports`
- **Shows:**
  - Total count by response type (Going, Maybe, Not Going, Pending)
  - List of all people who expressed interest
  - Name, Email, Response Type, Status (NOT_REGISTERED)
  - Export to CSV functionality

---

## ✅ Registration Approval System

### **What is Registration Approval?**
When users register for an event, admins can **review and approve/reject** their registrations before confirming attendance.

### **How it Works:**
1. **User registers** for event (fills form, pays if required)
2. **Registration status:** `PENDING`
3. **Admin reviews** in Registration Approval page
4. **Admin can:**
   - ✅ **Approve** - User gets confirmed ticket
   - ❌ **Reject** - Registration is declined
   - 📝 **Add notes** - Reason for approval/rejection

### **API Endpoint:**
```
POST /api/events/[id]/registrations/approvals
Body: {
  "registrationIds": ["123", "456"],
  "action": "approve" | "reject",
  "notes": "Optional reason"
}
```

### **Database Updates:**
- Status changes to: `APPROVED` or `REJECTED`
- `approved_at` timestamp recorded
- `approved_by` stores admin email/ID
- `notes` field stores approval/rejection reason

### **Use Cases:**
- **Paid events:** Verify payment before approval
- **Limited capacity:** Control who gets in
- **VIP events:** Manual screening of attendees
- **Corporate events:** Verify employee/guest status

---

## 🚫 Cancellation Approval System

### **What is Cancellation Approval?**
When users want to **cancel their registration**, admins can review and approve/reject the cancellation request.

### **How it Works:**
1. **User requests cancellation** (from their registration)
2. **Cancellation status:** `PENDING`
3. **Admin reviews** in Cancellation Approval page
4. **Admin can:**
   - ✅ **Approve Cancellation** - Registration is cancelled, refund processed
   - ❌ **Reject Cancellation** - Registration remains active
   - 📝 **Add reason** - Why cancellation was approved/rejected

### **API Endpoint:**
```
POST /api/events/[id]/registrations/cancellation-approvals
Body: {
  "registrationIds": ["123", "456"],
  "action": "approve" | "reject",
  "notes": "Refund processed" | "Too late to cancel"
}
```

### **Database Updates:**
- If **approved:**
  - Status: `CANCELLED`
  - `cancelled_at` timestamp recorded
  - `cancel_reason` stores the reason
- If **rejected:**
  - Status: `ACTIVE` (remains registered)
  - `cancelled_at` set to NULL

### **Use Cases:**
- **Refund management:** Control when refunds are issued
- **Cancellation deadlines:** Enforce cancellation policies
- **Capacity management:** Track available seats
- **Revenue protection:** Prevent last-minute cancellations

---

## 📊 Sales Summary & Reports

### **What is Sales Summary?**
A comprehensive dashboard showing all financial and registration data for events.

### **Features:**
- **Total Revenue** - Sum of all paid registrations
- **Tickets Sold** - Count of confirmed registrations
- **Pending Approvals** - Registrations awaiting approval
- **Cancellations** - Cancelled registrations count
- **Revenue by Event** - Breakdown per event
- **Payment Methods** - Cash, Card, UPI, etc.
- **Date Range Filters** - Custom date selection

### **Removed Features:**
- ❌ **Overview Tab** - Removed as per user request
- Now shows direct data without tab navigation

---

## 🔄 Complete User Journey

### **Scenario 1: User Interested but Not Ready to Register**
1. User sees event → Clicks "I'm Interested" (RSVP)
2. Selects "Going" → Saved to `rsvp_interests` table
3. Status: `NOT_REGISTERED`
4. Admin can see in RSVP Reports
5. Later, user decides to register → Fills registration form → Pays
6. Status changes to `PENDING` in registrations table
7. Admin approves → Status: `APPROVED`
8. User gets ticket

### **Scenario 2: Direct Registration (No RSVP)**
1. User sees event → Clicks "Register"
2. Fills form → Pays
3. Status: `PENDING`
4. Admin reviews in Registration Approval
5. Admin approves → Status: `APPROVED`
6. User gets ticket

### **Scenario 3: User Wants to Cancel**
1. User registered and paid
2. User requests cancellation
3. Cancellation status: `PENDING`
4. Admin reviews in Cancellation Approval
5. Admin approves → Status: `CANCELLED`, refund processed
6. Seat becomes available again

---

## 📁 Database Tables

### **rsvp_interests**
```sql
- id (BIGSERIAL)
- event_id (BIGINT)
- user_id (BIGINT, nullable)
- name (VARCHAR)
- email (VARCHAR)
- response_type (GOING/MAYBE/NOT_GOING/PENDING)
- status (NOT_REGISTERED)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **registrations**
```sql
- id (BIGSERIAL)
- event_id (BIGINT)
- user_id (BIGINT)
- email, first_name, last_name
- status (PENDING/APPROVED/REJECTED/CANCELLED)
- approved_at, approved_by
- cancelled_at, cancel_reason
- payment_status
- created_at, updated_at
```

---

## 🎯 Summary

| Feature | Purpose | User Action | Admin Action | Status |
|---------|---------|-------------|--------------|--------|
| **RSVP** | Express interest | Click "I'm Interested" | View reports | NOT_REGISTERED |
| **Registration** | Confirm attendance | Fill form + Pay | Approve/Reject | PENDING → APPROVED |
| **Cancellation** | Cancel attendance | Request cancellation | Approve/Reject | ACTIVE → CANCELLED |

**All features are now implemented and working!** ✅
