# Event Team Invitation System - Current vs Desired Flow

## 📧 Your Screenshot Shows

The email you received has:
- **Subject**: "You're invited to collaborate on an event"
- **Content**: 
  - "You have been invited as 'Event Staff' to collaborate on Event #3"
  - **Approve link**: `http://localhost:8081/api/events/3/team/approve?email=rbusiness2111@gmail.com`
  - **Reject link**: `http://localhost:8081/api/events/3/team/reject?email=rbusiness2111@gmail.com`

This is the **ideal flow** you want!

---

## 🔄 Current Implementation vs Desired Flow

### **Current Flow** (What's Implemented Now)

1. Admin invites user by email
2. System **automatically creates account** if user doesn't exist
3. System **immediately assigns role** (OWNER/ORGANIZER/STAFF/VIEWER)
4. Sends simple email: "You have been added to event team"
5. ❌ **No approval/rejection**
6. ❌ **No signup flow for new users**
7. ❌ **No status tracking** (pending/approved/rejected)

### **Desired Flow** (What You Want)

1. Admin invites user by email
2. System creates **pending invitation** (not account yet)
3. Sends email with **Approve** and **Reject** links
4. User clicks **Approve**:
   - If user **exists** → Assign role → Status: APPROVED
   - If user **doesn't exist** → Redirect to **Sign Up** page
   - After signup → Assign role → Status: APPROVED
5. User clicks **Reject**:
   - Status: REJECTED
   - No account created
6. Admin can see invitation status (Pending/Approved/Rejected)

---

## 🎯 What Needs to Be Implemented

### **1. Database Changes**

Add `event_team_invitations` table:

```sql
CREATE TABLE event_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- OWNER, ORGANIZER, STAFF, VIEWER
  status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  invited_by TEXT, -- User ID who sent invite
  token TEXT UNIQUE, -- Secure token for approve/reject links
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP, -- Optional: invite expiration
  UNIQUE(event_id, email)
);
```

### **2. Update Invite API**

**File**: `/apps/web/app/api/events/[id]/team/invite/route.ts`

**Changes**:
- Don't create user account immediately
- Create invitation record with token
- Send email with approve/reject links
- Track invitation status

**New Logic**:
```typescript
// Generate secure token
const token = crypto.randomBytes(32).toString('hex')

// Create invitation (not user account)
await prisma.$executeRaw`
  INSERT INTO event_team_invitations 
  (event_id, tenant_id, email, role, token, invited_by, expires_at)
  VALUES (${eventId}, ${tenantId}, ${email}, ${role}, ${token}, ${session.user.id}, NOW() + INTERVAL '7 days')
  ON CONFLICT (event_id, email) 
  DO UPDATE SET 
    role = ${role}, 
    token = ${token}, 
    status = 'PENDING',
    updated_at = NOW()
`

// Send email with approve/reject links
const approveUrl = `${process.env.NEXTAUTH_URL}/api/events/${eventId}/team/approve?token=${token}`
const rejectUrl = `${process.env.NEXTAUTH_URL}/api/events/${eventId}/team/reject?token=${token}`
```

### **3. Update Approve API**

**File**: `/apps/web/app/api/events/[id]/team/approve/route.ts`

**New Logic**:
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  
  // 1. Find invitation by token
  const invitation = await prisma.$queryRaw`
    SELECT * FROM event_team_invitations 
    WHERE token = ${token} AND event_id = ${params.id}
  `
  
  if (!invitation) {
    return NextResponse.redirect('/error?message=Invalid invitation')
  }
  
  // 2. Check if user exists
  const user = await prisma.user.findUnique({ 
    where: { email: invitation.email } 
  })
  
  if (!user) {
    // 3. User doesn't exist → Redirect to signup with token
    return NextResponse.redirect(
      `/auth/signup?email=${invitation.email}&token=${token}&event=${params.id}`
    )
  }
  
  // 4. User exists → Assign role and approve
  await assignRoleToUser(user.id, params.id, invitation.role, invitation.tenantId)
  
  // 5. Update invitation status
  await prisma.$executeRaw`
    UPDATE event_team_invitations 
    SET status = 'APPROVED', updated_at = NOW()
    WHERE token = ${token}
  `
  
  // 6. Redirect to event page
  return NextResponse.redirect(`/events/${params.id}?invited=true`)
}
```

### **4. Update Reject API**

**File**: `/apps/web/app/api/events/[id]/team/reject/route.ts`

**New Logic**:
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  
  // Update invitation status to REJECTED
  await prisma.$executeRaw`
    UPDATE event_team_invitations 
    SET status = 'REJECTED', updated_at = NOW()
    WHERE token = ${token} AND event_id = ${params.id}
  `
  
  return NextResponse.redirect('/invitation-rejected')
}
```

### **5. Create Signup Page with Token**

**File**: `/apps/web/app/auth/signup/page.tsx`

**Features**:
- Pre-fill email from query parameter
- Show event invitation message
- After successful signup:
  - Assign role from invitation
  - Mark invitation as APPROVED
  - Redirect to event page

**Logic**:
```typescript
const searchParams = useSearchParams()
const email = searchParams.get('email')
const token = searchParams.get('token')
const eventId = searchParams.get('event')

// After signup success
if (token && eventId) {
  // Assign role from invitation
  await fetch(`/api/events/${eventId}/team/approve?token=${token}`, {
    method: 'POST'
  })
  
  // Redirect to event
  router.push(`/events/${eventId}`)
}
```

### **6. Update Team Members Page**

**File**: `/apps/web/app/events/[id]/team/page.tsx`

**Show Invitation Status**:
```typescript
// Fetch both members and pending invitations
const members = await fetch(`/api/events/${eventId}/team/members`)
const invitations = await fetch(`/api/events/${eventId}/team/invitations`)

// Display
{invitations.map(invite => (
  <div>
    <span>{invite.email}</span>
    <Badge status={invite.status}>
      {invite.status} {/* PENDING, APPROVED, REJECTED */}
    </Badge>
    {invite.status === 'PENDING' && (
      <Button onClick={() => resendInvite(invite.id)}>
        Resend Invite
      </Button>
    )}
  </div>
))}
```

---

## 📧 Email Template (Desired)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Event Team Invitation</title>
</head>
<body>
  <h1>You're invited to collaborate on an event</h1>
  
  <p>Hi {recipientName},</p>
  
  <p>You have been invited as <strong>{role}</strong> to collaborate on <strong>{eventName}</strong>.</p>
  
  <p>
    <a href="{approveUrl}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
      Approve your invite
    </a>
  </p>
  
  <p>
    <a href="{rejectUrl}" style="color: #f44336;">
      Reject this invite
    </a>
  </p>
  
  <p>
    Or copy and paste these links:<br>
    Approve: {approveUrl}<br>
    Reject: {rejectUrl}
  </p>
  
  <p>Thanks,<br>Event Planner</p>
</body>
</html>
```

---

## 🔄 Complete User Journey

### **Scenario 1: Existing User**

1. Admin invites `john@example.com` as "Event Staff"
2. John receives email with approve/reject links
3. John clicks **Approve**
4. System checks: User exists ✅
5. System assigns "Event Staff" role to John
6. Invitation status: APPROVED
7. John redirected to event page
8. John can now access event with Staff permissions

### **Scenario 2: New User**

1. Admin invites `jane@example.com` as "Organizer"
2. Jane receives email with approve/reject links
3. Jane clicks **Approve**
4. System checks: User doesn't exist ❌
5. System redirects Jane to **Sign Up** page
6. Sign up page pre-fills email: `jane@example.com`
7. Jane completes signup (name, password)
8. After signup, system:
   - Creates user account
   - Assigns "Organizer" role
   - Marks invitation as APPROVED
   - Adds Jane to company tenant
9. Jane redirected to event page
10. Jane can now access event with Organizer permissions

### **Scenario 3: User Rejects**

1. Admin invites `bob@example.com`
2. Bob receives email
3. Bob clicks **Reject**
4. Invitation status: REJECTED
5. Bob sees "Invitation rejected" page
6. No account created
7. Admin sees Bob's invitation as "Rejected" in team list

---

## 🎯 Status Tracking

### **Invitation Statuses**:

| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| **PENDING** | Invite sent, awaiting response | Resend, Cancel |
| **APPROVED** | User accepted and joined | View, Remove |
| **REJECTED** | User declined invitation | Delete, Re-invite |
| **EXPIRED** | Invite expired (7 days) | Re-invite |

---

## 🔧 API Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/events/[id]/team/invite` | POST | Send invitation email |
| `/api/events/[id]/team/approve` | GET | Approve invitation (from email link) |
| `/api/events/[id]/team/reject` | GET | Reject invitation (from email link) |
| `/api/events/[id]/team/invitations` | GET | List all invitations with status |
| `/api/events/[id]/team/invitations/[id]/resend` | POST | Resend invitation email |
| `/api/events/[id]/team/invitations/[id]/cancel` | DELETE | Cancel pending invitation |

---

## 📝 Implementation Checklist

- [ ] Create `event_team_invitations` table
- [ ] Update invite API to create invitation (not user)
- [ ] Generate secure tokens for approve/reject links
- [ ] Send email with approve/reject links
- [ ] Update approve API to check user existence
- [ ] Redirect new users to signup page
- [ ] Create signup page with token handling
- [ ] After signup, assign role from invitation
- [ ] Update reject API to mark status
- [ ] Create invitations list API
- [ ] Update team members page to show invitation status
- [ ] Add resend invite functionality
- [ ] Add cancel invite functionality
- [ ] Handle expired invitations

---

## 🎉 Summary

**Current System**: Auto-creates accounts and assigns roles immediately

**Desired System**: 
1. ✅ Send email with approve/reject links
2. ✅ Track invitation status (pending/approved/rejected)
3. ✅ Redirect new users to signup
4. ✅ Assign role after approval/signup
5. ✅ Show invitation status in team list

This matches the email screenshot you shared and provides a proper invitation workflow with user consent!
