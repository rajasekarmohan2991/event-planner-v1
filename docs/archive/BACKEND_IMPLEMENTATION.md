# Backend Implementation Guide

## 1. Database Changes ✅ COMPLETE

```sql
-- Event attendees - attendance mode
ALTER TABLE event_attendees ADD COLUMN attendance_mode VARCHAR(50);

-- Team invitations
ALTER TABLE event_team_members 
ADD COLUMN invitation_token VARCHAR(255),
ADD COLUMN token_expires_at TIMESTAMP,
ADD COLUMN invitation_status VARCHAR(50) DEFAULT 'PENDING';
```

## 2. Team Invitation Flow

### Status: PENDING → INVITED → JOINED/REJECTED

### A. Invite API
```java
@PostMapping("/events/{id}/team/invite")
- Generate UUID token
- Set expires_at = now + 7 days
- Save with status = PENDING
- Return success
```

### B. Admin Approve API
```java
@PostMapping("/events/{id}/team/approve?email=xxx")
- Update status = INVITED
- Send email with link: /team-invitation/{token}
- Email template: "You're invited to join {eventName} team"
```

### C. Accept Invitation API
```java
@PostMapping("/team-invitations/{token}/accept")
- Validate token not expired
- Update invitation_status = JOINED
- Create user account if not exists
- Send welcome email
```

### D. Reject Invitation API
```java
@PostMapping("/team-invitations/{token}/reject")
- Update invitation_status = REJECTED
- Notify admin
```

## 3. Email Templates

### Team Invitation Email
```html
Subject: Team Invitation - {eventName}

Hi,

You've been invited to join the team for "{eventName}"!

Role: {role}
Event: {eventName}
Date: {eventDate}

Click to accept: {appUrl}/team-invitation/{token}

This link expires in 7 days.
```

### Exhibitor Approval Email
```html
Subject: Exhibitor Registration Approved

Dear {contactName},

Your exhibitor registration for "{eventName}" is APPROVED!

Final Amount: ₹{finalAmount}

Payment Options:
1. Razorpay: {paymentLink}
2. Bank Transfer: [Details]
3. UPI: {upiId}

Complete payment within 7 days.
```

## 4. Frontend Status ✅ COMPLETE

- Attendance mode selection for HYBRID events
- Auto-set for IN_PERSON/VIRTUAL only events
- Team invitation accept/reject pages
- QR code check-in with duplicate prevention
- Registration form fixed

## 5. Testing URLs

- Registration: http://localhost:3001/events/14/register
- Team Invitation: http://localhost:3001/team-invitation/{token}
- Exhibitor Approvals: http://localhost:3001/exhibitor-approvals

## 6. Next Steps

1. Implement Java APIs above
2. Configure email service (SMTP/SendGrid)
3. Add payment gateway (Razorpay/Stripe)
4. Test complete workflows
