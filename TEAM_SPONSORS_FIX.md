# Team Management & Sponsors - Issues & Fixes

## Issues Identified

### 1. ✅ FIXED: Sort Button Shows "ASC" Text Instead of Icons
**Status:** FIXED ✅
**Location:** `/events/[id]/team` page
**Problem:** Sort button showed "ASC" or "DESC" text
**Solution:** Replaced with arrow icons (↑ for ascending, ↓ for descending)

### 2. ⚠️ Team Members Not Showing (Invites Not Fetching)
**Status:** NEEDS INVESTIGATION
**Location:** `/events/[id]/team` page
**Problem:** "No members found" even after sending invites

### 3. ⚠️ Cannot Add Sponsors - "Bad Request" Error
**Status:** NEEDS BACKEND FIX
**Location:** `/events/[id]/sponsors` page
**Problem:** 400 Bad Request when trying to add sponsors

---

## Issue 1: Sort Icons (FIXED ✅)

### Before:
```tsx
<button>ASC</button>  // or "DESC"
```

### After:
```tsx
<button>
  {sortDir === 'ASC' ? '↑' : '↓'}
</button>
```

### Changes Made:
- File: `apps/web/app/events/[id]/team/page.tsx`
- Line: ~245
- Replaced text with Unicode arrow symbols
- Added better tooltip: "Sort ascending/descending - Click to toggle"
- Increased button padding for better UX

---

## Issue 2: Team Members Not Showing

### Problem Analysis:

**Expected Flow:**
1. User clicks "+ Add Event Members"
2. Enters emails or selects from company users
3. Clicks "Send Invites"
4. Email sent with invite link
5. Recipient clicks link → Accepts/Rejects
6. Member appears in list with status "Invited" or "Joined"

**Current Issue:**
- Members list shows "No members found"
- Invites are being sent (API call succeeds)
- But members don't appear in the list

### Possible Causes:

#### A. API Response Format Mismatch
The frontend expects:
```typescript
{
  items: TeamMember[],
  totalPages: number
}
```

Check if backend returns different format.

#### B. Status Mapping Issue
Frontend maps:
```typescript
status: m.status === 'INVITED' ? 'Invited' : 
        m.status === 'JOINED' ? 'Joined' : 
        m.status === 'REJECTED' ? 'Rejected' : 
        String(m.status)
```

Backend might return different status values.

#### C. Filtering Issue
Code filters out 'anonymousUser':
```typescript
const base = eventMembers.filter(m => 
  m.name !== 'anonymousUser' && 
  m.email !== 'anonymousUser'
)
```

Check if invited members have these values.

### Debugging Steps:

**1. Check API Response:**
```bash
# Open browser console on /events/[id]/team page
# Look for fetch to /api/events/[id]/team/members
# Check the response data structure
```

**2. Check Backend Logs:**
```bash
# Check Render backend logs
# Look for POST /api/events/{id}/team/invite
# Check if members are being created in database
```

**3. Check Database:**
```sql
SELECT * FROM event_team_members 
WHERE event_id = 9 
ORDER BY created_at DESC;
```

### Temporary Workaround:
Add console logging to see what's happening:

```typescript
// In apps/web/app/events/[id]/team/page.tsx
// Line ~50
const resp = await listTeamMembers(...)
console.log('📊 Team members response:', resp)
console.log('📊 Items:', resp.items)
console.log('📊 Mapped:', mapped)
```

---

## Issue 3: Cannot Add Sponsors

### Error Details:
```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "Failed to read request",
  "instance": "/api/events/9/sponsors",
  "properties": null
}
```

### Problem Analysis:

**Frontend Sends:**
```json
{
  "name": "New age sponsor",
  "tier": "PARTNER",
  "amount": 10000,
  "website": "https://example.com",
  "logoUrl": "https://..."
}
```

**Backend Expects:**
The backend (Java/Spring Boot) might expect different field names or structure.

### Possible Issues:

#### A. Field Name Mismatch
Backend might expect:
- `companyName` instead of `name`
- `contributionAmount` instead of `amount`
- `sponsorTier` instead of `tier`

#### B. Missing Required Fields
Backend might require:
- `eventId` (should be in URL path)
- `tenantId` (should be in header)
- `description`
- `contactPerson`
- `contactEmail`

#### C. Enum Value Mismatch
Backend tier enum might be:
- `PLATINUM_SPONSOR` instead of `PLATINUM`
- Different casing

### Solution Options:

**Option 1: Fix Frontend to Match Backend**

Update the payload in `apps/web/app/events/[id]/sponsors/page.tsx`:

```typescript
const payload = {
  companyName: name,  // Changed from 'name'
  sponsorTier: tier,  // Changed from 'tier'
  contributionAmount: amount,  // Changed from 'amount'
  websiteUrl: website,  // Changed from 'website'
  logoUrl: logoUrl,
  eventId: params.id,  // Add eventId
  // Add any other required fields
}
```

**Option 2: Fix Backend to Accept Current Format**

Update the backend DTO to accept:
```java
public class CreateSponsorRequest {
    private String name;  // Accept 'name'
    private String tier;  // Accept 'tier'
    private Double amount;  // Accept 'amount'
    private String website;
    private String logoUrl;
}
```

**Option 3: Check Backend API Documentation**

1. Check Swagger/OpenAPI docs at: `https://event-planner-v1.onrender.com/swagger-ui.html`
2. Look for `POST /api/events/{id}/sponsors`
3. Check the request body schema
4. Update frontend to match

### Debugging Steps:

**1. Check Backend Logs:**
```bash
# On Render dashboard
# Go to Logs tab
# Look for errors when POST /api/events/9/sponsors is called
# Check what fields are missing or invalid
```

**2. Test with curl:**
```bash
curl -X POST https://event-planner-v1.onrender.com/api/events/9/sponsors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Sponsor",
    "tier": "GOLD",
    "amount": 100000
  }'
```

**3. Check Database Schema:**
```sql
DESCRIBE sponsors;
-- or
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'sponsors';
```

### Quick Fix (Try This First):

Add more fields to the payload:

```typescript
// In apps/web/app/events/[id]/sponsors/page.tsx
// Line ~170
const payload = {
  name,
  tier,
  amount: amount || 0,
  website: website || null,
  logoUrl: logoUrl || null,
  eventId: params.id,  // ADD THIS
  description: '',  // ADD THIS
  contactPerson: '',  // ADD THIS
  contactEmail: ''  // ADD THIS
}
```

---

## Team Invite Email System

### How It Should Work:

**1. Send Invite:**
```
User clicks "Send Invites"
  ↓
POST /api/events/{id}/team/invite
  ↓
Backend creates team_member record with status='INVITED'
  ↓
Backend sends email with invite link
```

**2. Email Content:**
```
Subject: You're invited to join [Event Name] team!

Hi [Name],

You've been invited to join the team for [Event Name] as [Role].

Click here to accept: https://yourapp.com/events/9/team/accept?token=xyz

This link expires in 7 days.
```

**3. Accept Invite:**
```
User clicks link
  ↓
GET /events/9/team/accept?token=xyz
  ↓
Backend verifies token
  ↓
Updates status to 'JOINED'
  ↓
Redirects to event dashboard
```

### Required Components:

**1. Email Template:**
Create `apps/web/emails/team-invite.tsx`:
```tsx
export function TeamInviteEmail({ eventName, role, acceptUrl }) {
  return (
    <div>
      <h1>You're invited!</h1>
      <p>Join {eventName} as {role}</p>
      <a href={acceptUrl}>Accept Invite</a>
    </div>
  )
}
```

**2. Accept Invite Page:**
Create `apps/web/app/events/[id]/team/accept/page.tsx`:
```tsx
export default function AcceptInvitePage({ searchParams }) {
  const { token } = searchParams
  
  useEffect(() => {
    // Verify token and update status
    fetch(`/api/events/${id}/team/accept`, {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }, [])
  
  return <div>Accepting invite...</div>
}
```

**3. Backend API:**
```
POST /api/events/{id}/team/accept
Body: { token: "xyz" }

Response: { success: true, member: {...} }
```

---

## Testing Checklist

### Team Members:
- [ ] Can send invites
- [ ] Invites appear in list with status "Invited"
- [ ] Email is sent with accept link
- [ ] Accept link works
- [ ] Status updates to "Joined"
- [ ] Can resend invite
- [ ] Can remove member
- [ ] Can edit member role
- [ ] Sort by name works
- [ ] Sort icons show correctly (↑↓)
- [ ] Search works
- [ ] Pagination works

### Sponsors:
- [ ] Can add sponsor
- [ ] Auto-tier calculation works
- [ ] Can override tier
- [ ] Can upload logo
- [ ] Sponsors appear in list
- [ ] Can edit sponsor
- [ ] Can delete sponsor
- [ ] Tier badges show correctly

---

## Next Steps

1. **Fix Team Members Not Showing:**
   - Check API response format
   - Add console logging
   - Verify database records
   - Check status mapping

2. **Fix Sponsor Creation:**
   - Check backend API documentation
   - Test with curl
   - Update payload to match backend expectations
   - Add missing required fields

3. **Implement Email System:**
   - Set up email service (SendGrid/AWS SES)
   - Create email templates
   - Create accept invite page
   - Add token generation/verification

4. **Test Everything:**
   - Send test invites
   - Accept invites
   - Add sponsors
   - Verify all features work

---

## Files Modified

- ✅ `apps/web/app/events/[id]/team/page.tsx` - Fixed sort icons
- ⏳ `apps/web/app/events/[id]/sponsors/page.tsx` - Needs payload fix
- ⏳ Backend sponsor API - Needs investigation

---

## Support

If issues persist:
1. Check backend logs on Render
2. Check database records
3. Test API endpoints with curl/Postman
4. Review backend API documentation
5. Contact backend team for API schema
