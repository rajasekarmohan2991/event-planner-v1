# Event Planner - Complete User Guide
## End-to-End Functionality Documentation

**Version**: 1.0  
**Last Updated**: December 23, 2025

---

## Table of Contents

1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Authentication & Onboarding](#authentication--onboarding)
4. [Event Organizer Workflows](#event-organizer-workflows)
5. [Attendee Workflows](#attendee-workflows)
6. [Team Member Workflows](#team-member-workflows)
7. [Exhibitor Workflows](#exhibitor-workflows)
8. [Check-in & Event Day Operations](#check-in--event-day-operations)
9. [Admin Workflows](#admin-workflows)
10. [API Reference](#api-reference)

---

## System Overview

### What is Event Planner?

Event Planner is a comprehensive multi-tenant event management platform that enables organizations to:
- Create and manage events
- Sell tickets with dynamic pricing
- Manage floor plans and seating
- Handle registrations and check-ins
- Manage exhibitors and sponsors
- Track budgets and vendors
- Generate analytics and reports

### Key Features

- **Multi-tenant Architecture**: Each organization has isolated data
- **Role-Based Access Control (RBAC)**: Granular permissions per role
- **Seat Selection**: Interactive 2D floor plans with real-time availability
- **Payment Integration**: Support for Stripe, Razorpay, and dummy payments
- **QR Code Check-in**: Fast and secure event entry
- **Promo Codes**: Flexible discount management
- **Team Collaboration**: Invite team members with specific roles
- **Exhibitor Management**: Complete exhibitor lifecycle from registration to booth allocation

---

## User Roles & Permissions

### 1. System Roles (Global)

#### SUPER_ADMIN
- **Access**: Full system access across all tenants
- **Capabilities**:
  - Manage all tenants
  - View system-wide analytics
  - Configure global settings
  - Access all events and data

#### ADMIN
- **Access**: Elevated permissions within assigned tenants
- **Capabilities**:
  - Manage tenant settings
  - Create and manage events
  - Manage users and permissions
  - View all reports

#### USER
- **Access**: Basic authenticated user
- **Capabilities**:
  - Browse public events
  - Register for events
  - View own registrations
  - Manage profile

### 2. Tenant Roles (Organization-Level)

#### TENANT_ADMIN
- **Access**: Full control of organization
- **Capabilities**:
  - Manage organization settings
  - Create/edit/delete events
  - Manage team members
  - Configure branding
  - View all analytics

#### EVENT_MANAGER
- **Access**: Event creation and management
- **Capabilities**:
  - Create and manage events
  - Configure tickets and pricing
  - Manage registrations
  - View event analytics
  - Manage event team

#### VENUE_MANAGER
- **Access**: Venue and floor plan management
- **Capabilities**:
  - Create floor plans
  - Manage seating arrangements
  - Configure venue details
  - Handle check-in operations

#### FINANCE_ADMIN
- **Access**: Financial operations
- **Capabilities**:
  - View payment reports
  - Manage refunds
  - Configure pricing
  - Export financial data
  - Manage budgets and vendors

#### MARKETING_ADMIN
- **Access**: Marketing and communications
- **Capabilities**:
  - Manage event websites
  - Create promo codes
  - Send email campaigns
  - View marketing analytics
  - Manage social media integration

#### SUPPORT_STAFF
- **Access**: On-ground event support
- **Capabilities**:
  - Check-in attendees
  - View attendee lists
  - Handle on-site registrations
  - Assist with queries

#### EXHIBITOR_MANAGER
- **Access**: Exhibitor relationship management
- **Capabilities**:
  - Manage exhibitor registrations
  - Allocate booths
  - Handle exhibitor payments
  - Communicate with exhibitors

#### VIEWER
- **Access**: Read-only access
- **Capabilities**:
  - View events
  - View reports
  - Export data (limited)

### 3. Event Roles (Event-Specific)

#### OWNER
- **Access**: Full control of specific event
- **Capabilities**:
  - All event management functions
  - Delete event
  - Transfer ownership

#### ORGANIZER
- **Access**: Event management
- **Capabilities**:
  - Edit event details
  - Manage team
  - Configure settings
  - View analytics

#### STAFF
- **Access**: Operational tasks
- **Capabilities**:
  - Check-in attendees
  - View attendee lists
  - Manage registrations
  - Handle queries

#### VIEWER
- **Access**: Read-only event access
- **Capabilities**:
  - View event details
  - View reports
  - Export data (limited)

---

## Authentication & Onboarding

### 1. User Registration

**Endpoint**: `/auth/register`

**Steps**:
1. Navigate to registration page
2. Fill in required details:
   - Full Name
   - Email Address
   - Password (min 8 characters)
   - Confirm Password
3. Accept Terms & Conditions
4. Click "Create Account"
5. Verify email (if enabled)

**API Flow**:
```typescript
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "USER"
}
```

### 2. User Login

**Endpoint**: `/auth/login`

**Steps**:
1. Navigate to login page
2. Enter email and password
3. Click "Sign In"
4. Redirected to dashboard based on role

**API Flow**:
```typescript
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Session Management**:
- JWT tokens stored in HTTP-only cookies
- Session expires after 7 days of inactivity
- Refresh token rotation for security

### 3. Organization Setup (First-Time)

**For Tenant Admins**:

1. **Create Organization**:
   - Navigate to `/onboarding`
   - Fill organization details:
     - Organization Name
     - Subdomain (e.g., `mycompany.eventplanner.com`)
     - Industry/Category
     - Time Zone
     - Currency
   - Upload logo (optional)
   - Click "Create Organization"

2. **Configure Branding**:
   - Primary Color
   - Secondary Color
   - Favicon
   - Email Templates

3. **Invite Team Members**:
   - Go to Settings → Team
   - Click "Invite Member"
   - Enter email and select role
   - Send invitation

---

## Event Organizer Workflows

### 1. Creating an Event

**Path**: Dashboard → Events → Create Event

**Steps**:

#### Step 1: Basic Information
```
- Event Name: "Tech Conference 2025"
- Description: Rich text editor
- Category: Technology
- Event Type: Conference
- Status: Draft
```

#### Step 2: Date & Time
```
- Start Date: 2025-03-15
- Start Time: 09:00 AM
- End Date: 2025-03-15
- End Time: 06:00 PM
- Time Zone: Asia/Kolkata
```

#### Step 3: Venue Details
```
- Venue Name: "Grand Convention Center"
- Address: "123 Main Street"
- City: "Mumbai"
- State: "Maharashtra"
- Country: "India"
- Postal Code: "400001"
- Capacity: 500
```

#### Step 4: Pricing & Tickets
```
- Create Ticket Classes:
  
  VIP Ticket:
  - Name: "VIP Pass"
  - Price: ₹5,000
  - Quantity: 50
  - Sales Start: 2025-01-01
  - Sales End: 2025-03-14
  - Min per order: 1
  - Max per order: 5
  
  General Ticket:
  - Name: "General Admission"
  - Price: ₹2,000
  - Quantity: 450
  - Sales Start: 2025-01-01
  - Sales End: 2025-03-14
```

#### Step 5: Floor Plan (Optional)
```
- Use AI Generator:
  - Select Event Type: Conference
  - Select Seating: Rows
  - VIP Seats: 50
  - Premium Seats: 150
  - General Seats: 300
  - Generate Floor Plan
  
- OR Manual Design:
  - Drag and drop seats
  - Configure sections
  - Set pricing per section
```

#### Step 6: Registration Settings
```
- Enable/Disable Registration
- Require Approval: Yes/No
- Time Limit: 15 minutes
- Allow Transfers: Yes/No
- Custom Fields:
  - Company Name (Text)
  - Job Title (Text)
  - Dietary Restrictions (Select)
```

#### Step 7: Publish
```
- Review all details
- Click "Publish Event"
- Event goes live
- Public URL: /events/{id}/public
```

**API Flow**:
```typescript
POST /api/events
{
  "name": "Tech Conference 2025",
  "description": "Annual technology conference...",
  "startsAt": "2025-03-15T09:00:00Z",
  "endsAt": "2025-03-15T18:00:00Z",
  "venue": "Grand Convention Center",
  "city": "Mumbai",
  "capacity": 500,
  "status": "PUBLISHED",
  "category": "Technology"
}
```

### 2. Managing Tickets & Pricing

**Path**: Event Dashboard → Tickets

**Create Ticket Class**:
```typescript
POST /api/events/{id}/tickets
{
  "name": "Early Bird",
  "description": "Limited time offer",
  "priceInr": 1500,
  "capacity": 100,
  "salesStartAt": "2025-01-01T00:00:00Z",
  "salesEndAt": "2025-02-01T23:59:59Z",
  "minQuantity": 1,
  "maxQuantity": 10,
  "status": "ACTIVE"
}
```

**Edit Ticket**:
- Update pricing
- Adjust capacity
- Modify sales period
- Enable/disable ticket

**Promo Codes**:
```typescript
POST /api/events/{id}/promo-codes
{
  "code": "EARLYBIRD25",
  "type": "PERCENT",
  "amount": 25,
  "maxRedemptions": 100,
  "perUserLimit": 1,
  "minOrderAmount": 1000,
  "startsAt": "2025-01-01T00:00:00Z",
  "endsAt": "2025-02-01T23:59:59Z",
  "isActive": true
}
```

### 3. Team Management

**Path**: Event Dashboard → Team

**Invite Team Member**:
```typescript
POST /api/events/{id}/team/invite
{
  "email": "staff@example.com",
  "role": "STAFF",
  "message": "Welcome to the team!"
}
```

**Roles Available**:
- OWNER: Full control
- ORGANIZER: Management access
- STAFF: Operational access
- VIEWER: Read-only

**Manage Permissions**:
- Approve/Reject members
- Change roles
- Remove members
- Resend invitations

### 4. Floor Plan Management

**Path**: Event Dashboard → Floor Plan

**AI-Generated Floor Plan**:
1. Select event type (Conference, Theatre, Concert, etc.)
2. Choose seating arrangement (Rows, Round Tables, etc.)
3. Allocate seats by tier (VIP, Premium, General)
4. Set pricing per tier
5. Generate and preview
6. Publish floor plan

**Manual Floor Plan**:
1. Create new floor plan
2. Add objects:
   - Seating grids
   - Round tables
   - Stage
   - Entry/Exit points
   - Restrooms
   - Bars/Lounges
3. Configure each object:
   - Position (x, y)
   - Dimensions
   - Capacity
   - Pricing tier
4. Save and publish

**API Flow**:
```typescript
POST /api/events/{id}/seats/generate
{
  "floorPlan": {
    "name": "Main Hall",
    "totalSeats": 500,
    "sections": [
      {
        "name": "VIP",
        "type": "VIP",
        "basePrice": 5000,
        "rows": [
          {
            "number": "V1",
            "label": "VIP Row 1",
            "count": 10,
            "xOffset": 100,
            "yOffset": 50
          }
        ]
      }
    ],
    "shapes": [
      {
        "id": "stage-1",
        "type": "rect",
        "label": "STAGE",
        "x": 500,
        "y": 50,
        "width": 300,
        "height": 120
      }
    ]
  }
}
```

### 5. Exhibitor Management

**Path**: Event Dashboard → Exhibitors

**Review Exhibitor Registrations**:
1. View pending applications
2. Review company details
3. Check booth preferences
4. Approve/Reject application
5. Allocate booth
6. Send confirmation

**Booth Allocation**:
```typescript
POST /api/events/{id}/exhibitors/{exhibitorId}/allocate-booth
{
  "boothNumber": "A-101",
  "boothType": "PREMIUM",
  "sizeSqm": 12,
  "priceInr": 50000
}
```

**Payment Tracking**:
- View payment status
- Send payment reminders
- Record payments
- Generate invoices

### 6. Budget & Vendor Management

**Path**: Event Dashboard → Vendors

**Add Vendor**:
```typescript
POST /api/events/{id}/vendors
{
  "name": "Catering Services Inc",
  "category": "CATERING",
  "contactName": "Jane Smith",
  "contactEmail": "jane@catering.com",
  "contactPhone": "+91-9876543210",
  "contractAmount": 100000,
  "status": "ACTIVE"
}
```

**Budget Categories**:
- CATERING
- VENUE
- PHOTOGRAPHY
- ENTERTAINMENT
- DECORATION
- OTHER

**Track Expenses**:
- View budget vs actual
- Update payment status
- Upload contracts/invoices
- Generate expense reports

### 7. Registration Management

**Path**: Event Dashboard → Registrations

**View Registrations**:
- Filter by status (Pending, Approved, Denied)
- Search by name/email
- Export to CSV/Excel
- View registration details

**Approve/Deny Registrations**:
```typescript
POST /api/events/{id}/registrations/{regId}/approve
{
  "status": "APPROVED",
  "notes": "Approved for VIP access"
}
```

**Manual Registration**:
1. Click "Add Registration"
2. Fill attendee details
3. Select ticket class
4. Apply payment
5. Generate QR code
6. Send confirmation email

### 8. Analytics & Reports

**Path**: Event Dashboard → Analytics

**Available Reports**:
- Registration trends
- Revenue by ticket class
- Seat occupancy
- Promo code usage
- Payment status
- Exhibitor statistics
- Check-in rates

**Export Options**:
- PDF
- CSV
- Excel
- JSON

---

## Attendee Workflows

### 1. Browsing Events

**Path**: `/events/browse`

**Features**:
- Search by name/description
- Filter by:
  - City (with location detection)
  - Category
  - Price (Free/Paid)
  - Date range
- Category cards for quick filtering
- Event cards with:
  - Banner image
  - Date, time, duration
  - Venue and city
  - Price
  - Availability status

**User Actions**:
- Click "Register" → Start registration
- Click "I'm Interested" → Save for later
- Share event on social media

### 2. Event Registration (With Seats)

**Path**: `/events/{id}/register-with-seats`

#### Step 1: Seat Selection
```
1. View interactive floor plan
2. See real-time seat availability:
   - Green: Available
   - Yellow: Reserved (by you)
   - Red: Taken
   - Gray: Blocked
3. Click seats to select/deselect
4. View pricing breakdown
5. Click "Continue to Details"
```

**Seat Reservation**:
- Seats reserved for 15 minutes
- Timer displayed
- Auto-extend if active
- Release on timeout

#### Step 2: Attendee Details
```
Required Fields:
- First Name
- Last Name
- Email
- Phone Number

Optional Fields:
- Company
- Job Title
- Gender
- Emergency Contact
- Parking Required
- Dietary Restrictions
- Activities of Interest

Custom Fields (if configured):
- Dynamic fields based on event
```

#### Step 3: Promo Code (Optional)
```
1. Enter promo code
2. Click "Apply"
3. View discount calculation:
   - Original Amount: ₹5,000
   - Discount (25%): -₹1,250
   - Final Amount: ₹3,750
4. Remove code if needed
```

**API Flow**:
```typescript
POST /api/events/{id}/promo-codes/apply
{
  "code": "EARLYBIRD25",
  "orderAmount": 5000
}

Response:
{
  "valid": true,
  "calculatedDiscount": 1250,
  "finalAmount": 3750
}
```

#### Step 4: Payment
```
Payment Methods:
1. Stripe (Credit/Debit Card)
2. Razorpay (UPI, Cards, Wallets)
3. Dummy Payment (Testing)

For Dummy Payment:
- Select "Dummy Payment"
- Click "Complete Payment"
- Instant confirmation
```

#### Step 5: Confirmation
```
Success Screen:
- Registration ID
- QR Code (scannable)
- Event details summary
- Download QR code
- Add to calendar
- Email confirmation sent

QR Code Contains:
{
  "registrationId": "reg_123",
  "eventId": "8",
  "email": "john@example.com",
  "name": "John Doe",
  "type": "SEATED",
  "url": "/events/8/checkin/reg_123"
}
```

**Complete API Flow**:
```typescript
// 1. Reserve Seats
POST /api/events/{id}/seats/reserve
{
  "seatIds": ["seat_1", "seat_2"]
}

// 2. Apply Promo Code (Optional)
POST /api/events/{id}/promo-codes/apply
{
  "code": "EARLYBIRD25",
  "orderAmount": 5000
}

// 3. Create Registration
POST /api/events/{id}/registrations
{
  "data": {
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "seats": [
      {
        "id": "seat_1",
        "section": "VIP",
        "row": "V1",
        "seat": "1",
        "price": 5000
      }
    ]
  },
  "type": "SEATED",
  "totalPrice": 3750,
  "promoCode": "EARLYBIRD25"
}

// 4. Confirm Seats
POST /api/events/{id}/seats/confirm
{
  "seatIds": ["seat_1"],
  "registrationId": "reg_123",
  "paymentStatus": "PAID"
}
```

### 3. Event Registration (Without Seats)

**Path**: `/events/{id}/register`

**Simplified Flow**:
1. Fill attendee details
2. Select ticket quantity
3. Apply promo code (optional)
4. Complete payment
5. Receive confirmation

**Use Cases**:
- General admission events
- Workshops
- Webinars
- Standing room events

### 4. Managing Registrations

**Path**: `/dashboard/registrations`

**View My Registrations**:
- Upcoming events
- Past events
- Cancelled registrations
- QR codes for each event

**Actions**:
- View details
- Download QR code
- Download ticket PDF
- Cancel registration (if allowed)
- Transfer ticket (if allowed)

### 5. Event Check-in

**On Event Day**:
1. Open registration confirmation email
2. Display QR code on phone
3. Approach check-in desk
4. Staff scans QR code
5. Instant verification
6. Entry granted

**Alternative**: 
- Show registration ID
- Staff manually searches and checks in

---

## Team Member Workflows

### 1. Accepting Team Invitation

**Email Received**:
```
Subject: You've been invited to join Tech Conference 2025

Hi,

You've been invited to join the team for "Tech Conference 2025" 
as a STAFF member.

[Accept Invitation]

This invitation expires in 7 days.
```

**Steps**:
1. Click "Accept Invitation" in email
2. If no account: Register
3. If have account: Login
4. Redirected to event dashboard
5. Access granted based on role

**API Flow**:
```typescript
POST /api/events/{id}/team/invite/accept
{
  "token": "invite_token_xyz"
}
```

### 2. Event Dashboard Access

**Based on Role**:

**ORGANIZER**:
- Full event management
- Edit event details
- Manage team
- View all reports

**STAFF**:
- View attendee lists
- Check-in attendees
- View registrations
- Limited editing

**VIEWER**:
- View event details
- View reports
- Export data
- No editing

### 3. Check-in Operations (STAFF)

**Path**: `/events/{id}/checkin/scanner`

**Scanner Interface**:
1. Open scanner page
2. Grant camera permission
3. Point camera at QR code
4. Automatic scan and verification
5. Display result:
   - ✅ Valid: Show attendee details
   - ❌ Invalid: Show error message
   - ⚠️ Already checked in: Show warning

**Manual Check-in**:
1. Search by:
   - Registration ID
   - Email
   - Name
2. View attendee details
3. Click "Check In"
4. Confirm action

**API Flow**:
```typescript
POST /api/events/{id}/checkin
{
  "registrationId": "reg_123",
  "method": "QR_SCAN"
}

Response:
{
  "success": true,
  "attendee": {
    "name": "John Doe",
    "email": "john@example.com",
    "ticketType": "VIP",
    "seatNumber": "V1-1"
  },
  "checkedInAt": "2025-03-15T09:15:00Z"
}
```

---

## Exhibitor Workflows

### 1. Exhibitor Registration

**Path**: `/events/{id}/exhibitor-registration/register`

**Registration Form**:
```
Company Information:
- Company Name
- Business Address
- Company Description
- Products/Services

Contact Information:
- Prefix (Mr/Ms/Dr)
- First Name
- Last Name
- Preferred Pronouns
- Job Title
- Work Phone
- Cell Phone
- Email

Booth Preferences:
- Booth Type (Standard/Premium/Island)
- Booth Size
- Preferred Location
- Special Requirements

Staff Information:
- Number of staff
- Staff names
- Competitor information

Additional Services:
- Electrical Access
- Display Tables
- Other requirements
```

**Submission**:
1. Fill all required fields
2. Review details
3. Submit application
4. Status: PENDING_CONFIRMATION

### 2. Email Confirmation

**Email Sent**:
```
Subject: Confirm your exhibitor registration

Please confirm your email address to proceed:

[Confirm Email]

Confirmation link expires in 24 hours.
```

**After Confirmation**:
- Status: AWAITING_APPROVAL
- Notification sent to event organizers

### 3. Admin Approval

**Organizer Reviews**:
1. View application details
2. Check company information
3. Verify booth availability
4. Approve or Reject

**If Approved**:
- Status: PAYMENT_PENDING
- Payment link sent to exhibitor
- Invoice generated

### 4. Payment

**Payment Email**:
```
Subject: Payment Required - Tech Conference 2025

Your exhibitor application has been approved!

Amount Due: ₹50,000
Booth: A-101 (Premium, 12 sqm)

[Pay Now]
```

**Payment Process**:
1. Click payment link
2. Select payment method
3. Complete payment
4. Status: PAYMENT_COMPLETED

### 5. Booth Allocation

**Organizer Allocates**:
```typescript
POST /api/events/{id}/exhibitors/{exhibitorId}/allocate-booth
{
  "boothNumber": "A-101",
  "boothType": "PREMIUM",
  "sizeSqm": 12
}
```

**Exhibitor Receives**:
- Booth confirmation email
- Booth location map
- Setup instructions
- Event day guidelines
- Status: BOOTH_ALLOCATED

### 6. Event Day

**Exhibitor Check-in**:
1. Arrive at venue
2. Show QR code or check-in code
3. Receive exhibitor badge
4. Directed to booth location
5. Setup booth

**QR Code Contains**:
```json
{
  "exhibitorId": "exh_123",
  "eventId": "8",
  "companyName": "Tech Solutions Inc",
  "boothNumber": "A-101",
  "checkInCode": "EXH-8-12345678"
}
```

---

## Check-in & Event Day Operations

### 1. Pre-Event Setup

**Staff Preparation**:
1. Login to check-in portal
2. Download attendee list (offline backup)
3. Test scanner functionality
4. Verify internet connection
5. Print backup attendee list

**Equipment Needed**:
- Tablet/Phone with camera
- Internet connection
- Backup device
- Printed attendee list
- Badges/wristbands

### 2. Check-in Process

**QR Code Scan**:
```
Flow:
1. Attendee shows QR code
2. Staff scans with device
3. System validates:
   - Registration exists
   - Payment confirmed
   - Not already checked in
   - Event date matches
4. Display result
5. Mark as checked in
6. Issue badge/wristband
```

**Manual Check-in**:
```
Flow:
1. Attendee provides:
   - Email OR
   - Registration ID OR
   - Name
2. Staff searches system
3. Verify identity
4. Check in manually
5. Issue badge/wristband
```

**API Endpoints**:
```typescript
// QR Scan
POST /api/events/{id}/checkin
{
  "qrData": "{registrationId: 'reg_123', ...}",
  "method": "QR_SCAN"
}

// Manual Search
GET /api/events/{id}/registrations?search=john@example.com

// Manual Check-in
POST /api/events/{id}/checkin
{
  "registrationId": "reg_123",
  "method": "MANUAL"
}
```

### 3. Real-time Dashboard

**Check-in Stats**:
- Total Registrations: 500
- Checked In: 342
- Pending: 158
- Check-in Rate: 68.4%
- Live updates every 5 seconds

**Attendee List**:
- Filter by status
- Search functionality
- Sort by name/time
- Export current view

### 4. Issue Resolution

**Common Issues**:

**Issue**: QR code not scanning
**Solution**: 
1. Increase screen brightness
2. Clean camera lens
3. Use manual entry

**Issue**: Registration not found
**Solution**:
1. Verify email address
2. Check registration status
3. Contact support
4. Manual registration if needed

**Issue**: Already checked in
**Solution**:
1. Verify with attendee
2. Check timestamp
3. Allow re-entry if valid

**Issue**: Payment not confirmed
**Solution**:
1. Verify payment status
2. Check email confirmation
3. Contact finance team
4. Manual override if needed

### 5. Post-Event

**Data Export**:
- Check-in report
- No-show list
- Timing analysis
- Attendance by category

**Analytics**:
- Peak check-in times
- Average check-in duration
- Staff performance
- Issue frequency

---

## Admin Workflows

### 1. System Administration

**Path**: `/admin`

**Tenant Management**:
```typescript
// Create Tenant
POST /api/admin/tenants
{
  "name": "Acme Events",
  "subdomain": "acme",
  "plan": "PRO",
  "maxEvents": 50,
  "maxUsers": 20
}

// Update Tenant
PUT /api/admin/tenants/{id}
{
  "status": "ACTIVE",
  "plan": "ENTERPRISE"
}
```

**User Management**:
- View all users
- Assign system roles
- Suspend/activate accounts
- Reset passwords
- View activity logs

### 2. Module Access Control

**Path**: `/admin/permissions`

**Configure Permissions**:
```typescript
POST /api/admin/module-access
{
  "moduleName": "events",
  "role": "EVENT_MANAGER",
  "canView": true,
  "canCreate": true,
  "canEdit": true,
  "canDelete": false
}
```

**Available Modules**:
- events
- registrations
- payments
- analytics
- settings
- team
- exhibitors
- vendors

### 3. System Monitoring

**Metrics**:
- Active users
- Events created
- Registrations processed
- Revenue generated
- System health
- API performance

**Alerts**:
- Failed payments
- System errors
- High load warnings
- Security incidents

---

## API Reference

### Authentication

```typescript
// Register
POST /api/auth/register
Body: { name, email, password }

// Login
POST /api/auth/login
Body: { email, password }

// Logout
POST /api/auth/logout

// Refresh Token
POST /api/auth/refresh
```

### Events

```typescript
// List Events
GET /api/events?page=1&limit=20&status=PUBLISHED

// Get Event
GET /api/events/{id}

// Create Event
POST /api/events
Body: { name, description, startsAt, endsAt, venue, ... }

// Update Event
PUT /api/events/{id}
Body: { name, description, ... }

// Delete Event
DELETE /api/events/{id}

// Publish Event
POST /api/events/{id}/publish
```

### Registrations

```typescript
// List Registrations
GET /api/events/{id}/registrations

// Create Registration
POST /api/events/{id}/registrations
Body: { data: { email, firstName, lastName, ... }, type, totalPrice }

// Get Registration
GET /api/events/{id}/registrations/{regId}

// Approve Registration
POST /api/events/{id}/registrations/{regId}/approve

// Check-in
POST /api/events/{id}/checkin
Body: { registrationId, method }
```

### Seats

```typescript
// Get Floor Plan
GET /api/events/{id}/seats/floor-plan

// Reserve Seats
POST /api/events/{id}/seats/reserve
Body: { seatIds: ["seat_1", "seat_2"] }

// Confirm Seats
POST /api/events/{id}/seats/confirm
Body: { seatIds, registrationId, paymentStatus }

// Release Seats
DELETE /api/events/{id}/seats/reserve
Body: { seatIds }

// Generate Floor Plan
POST /api/events/{id}/seats/generate
Body: { floorPlan: { ... } }
```

### Promo Codes

```typescript
// List Promo Codes
GET /api/events/{id}/promo-codes

// Create Promo Code
POST /api/events/{id}/promo-codes
Body: { code, type, amount, maxRedemptions, ... }

// Apply Promo Code
POST /api/events/{id}/promo-codes/apply
Body: { code, orderAmount }

// Delete Promo Code
DELETE /api/events/{id}/promo-codes/{codeId}
```

### Team

```typescript
// List Team Members
GET /api/events/{id}/team/members

// Invite Member
POST /api/events/{id}/team/invite
Body: { email, role, message }

// Update Member
PUT /api/events/{id}/team/members/{userId}
Body: { role }

// Remove Member
DELETE /api/events/{id}/team/members/{userId}
```

### Exhibitors

```typescript
// List Exhibitors
GET /api/events/{id}/exhibitors

// Create Exhibitor
POST /api/events/{id}/exhibitors
Body: { name, contactEmail, boothType, ... }

// Approve Exhibitor
POST /api/events/{id}/exhibitors/{exhibitorId}/approve

// Allocate Booth
POST /api/events/{id}/exhibitors/{exhibitorId}/allocate-booth
Body: { boothNumber, boothType, sizeSqm, priceInr }

// Record Payment
POST /api/events/{id}/exhibitors/{exhibitorId}/payment
Body: { amount, method, reference }
```

### Payments

```typescript
// List Payments
GET /api/events/{id}/payments?page=1&size=50

// Get Payment
GET /api/events/{id}/payments/{paymentId}
```

### Analytics

```typescript
// Event Analytics
GET /api/events/{id}/analytics

// Registration Trends
GET /api/events/{id}/analytics/registrations

// Revenue Report
GET /api/events/{id}/analytics/revenue

// Check-in Stats
GET /api/events/{id}/analytics/checkin
```

---

## Appendix

### A. Error Codes

```
400 - Bad Request (Invalid data)
401 - Unauthorized (Not logged in)
403 - Forbidden (No permission)
404 - Not Found (Resource doesn't exist)
409 - Conflict (Duplicate entry)
500 - Internal Server Error
```

### B. Status Values

**Event Status**:
- DRAFT
- PUBLISHED
- CANCELLED
- COMPLETED

**Registration Status**:
- PENDING
- APPROVED
- DENIED
- CANCELLED

**Payment Status**:
- PENDING
- COMPLETED
- FAILED
- REFUNDED

**Exhibitor Status**:
- PENDING_CONFIRMATION
- AWAITING_APPROVAL
- PAYMENT_PENDING
- PAYMENT_COMPLETED
- BOOTH_ALLOCATED
- CONFIRMED
- REJECTED
- CANCELLED

### C. Best Practices

1. **Security**:
   - Use HTTPS in production
   - Rotate API keys regularly
   - Implement rate limiting
   - Validate all inputs
   - Sanitize user data

2. **Performance**:
   - Cache frequently accessed data
   - Optimize database queries
   - Use pagination for large lists
   - Compress images
   - Enable CDN for static assets

3. **User Experience**:
   - Provide clear error messages
   - Show loading states
   - Implement auto-save
   - Mobile-responsive design
   - Accessibility compliance

4. **Data Management**:
   - Regular backups
   - Data retention policies
   - GDPR compliance
   - Export capabilities
   - Audit logs

---

## Support

For technical support or questions:
- Email: support@eventplanner.com
- Documentation: https://docs.eventplanner.com
- Community: https://community.eventplanner.com

---

**Document Version**: 1.0  
**Last Updated**: December 23, 2025  
**Next Review**: March 2025
