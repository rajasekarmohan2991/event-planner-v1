# Dashboard Rearrangement & Team Invitation Fixes

## Changes Implemented

### 1. ✅ Dashboard Card Rearrangement

**Issue:** Registration Trend and Attendance cards were above Sponsor Category and Exhibitor

**Solution:** Rearranged dashboard layout

**File:** `/apps/web/app/events/[id]/page.tsx`

**New Layout:**
```
Row 1: Ticket Sales | Registrations | Days to Event
Row 2: Sponsor Category | Exhibitor | Event Numbers
Row 3: Registration Trend | Attendance | (empty)
```

**Before:**
- Attendance and Event Numbers were in row 2
- Sponsor and Exhibitor were in row 3

**After:**
- Sponsor Category and Exhibitor moved to row 2
- Registration Trend and Attendance moved to row 3

---

### 2. ✅ Event Mode Display Format

**Issue:** Event mode showing as "IN_PERSON" (all caps)

**Solution:** Changed to display as "In Person" (proper case)

**Files Modified:**
1. `/apps/web/app/events/[id]/info/page.tsx`
   - Badge display: Shows "In Person" instead of "IN_PERSON"
   - Dropdown options: "In Person", "Virtual", "Hybrid"

2. `/apps/web/lib/format-event-mode.ts` (NEW)
   - Utility function to format event modes
   - Can be used across the app for consistency

**Display Mapping:**
- `IN_PERSON` → "In Person"
- `VIRTUAL` → "Virtual"
- `HYBRID` → "Hybrid"

---

### 3. ✅ Team Invitation Workflow

**Issue:** Invited team members don't have proper accept/reject workflow

**Solution:** Created invitation acceptance/rejection endpoints and page

**New Files:**

1. **`/apps/web/app/api/team-invitations/[token]/accept/route.ts`**
   - POST endpoint for invitees to accept invitation
   - Updates status to JOINED

2. **`/apps/web/app/api/team-invitations/[token]/reject/route.ts`**
   - POST endpoint for invitees to reject invitation
   - Updates status to REJECTED
   - Accepts optional rejection reason

3. **`/apps/web/app/team-invitation/[token]/page.tsx`**
   - UI page for invitees to accept/reject
   - Shows invitation details
   - Accept and Reject buttons
   - Success/error messages

**Workflow:**
```
1. Admin invites team member
   ↓
2. Email sent with invitation link: /team-invitation/{token}
   ↓
3. Invitee clicks link and sees invitation page
   ↓
4. Invitee clicks "Accept" or "Reject"
   ↓
5. Status updated to JOINED or REJECTED
   ↓
6. Member disappears from pending list
   ↓
7. Admin sees updated status in team management
```

---

## Backend Requirements

### Team Invitation Email

The Java backend needs to:

1. **Generate unique invitation token** when team member is invited
2. **Send email** with invitation link:
   ```
   Subject: Team Invitation for {EventName}
   
   You've been invited to join the team for {EventName}!
   
   Click here to accept: {appUrl}/team-invitation/{token}
   
   Role: {role}
   Event: {eventName}
   ```

3. **Handle accept endpoint:**
   ```java
   @PostMapping("/team-invitations/{token}/accept")
   public ResponseEntity<?> acceptInvitation(@PathVariable String token) {
       // Validate token
       // Update team member status to JOINED
       // Create user account if doesn't exist
       // Send welcome email
       return ResponseEntity.ok("Accepted");
   }
   ```

4. **Handle reject endpoint:**
   ```java
   @PostMapping("/team-invitations/{token}/reject")
   public ResponseEntity<?> rejectInvitation(
       @PathVariable String token,
       @RequestBody Map<String, String> body
   ) {
       // Validate token
       // Update team member status to REJECTED
       // Store rejection reason
       // Notify admin
       return ResponseEntity.ok("Rejected");
   }
   ```

5. **Filter team list** to exclude JOINED and REJECTED members from pending approvals

### Database Schema

Add to `event_team_members` table:
```sql
ALTER TABLE event_team_members ADD COLUMN invitation_token VARCHAR(255);
ALTER TABLE event_team_members ADD COLUMN rejection_reason TEXT;
ALTER TABLE event_team_members ADD COLUMN responded_at TIMESTAMP;
```

**Status Values:**
- `PENDING` - Invited, awaiting invitee response
- `JOINED` - Invitee accepted invitation
- `REJECTED` - Invitee rejected invitation
- `APPROVED` - Admin approved (if approval workflow enabled)

---

## Modes Field (Pending)

**User Request:** Add "modes" field to registration and event creation

**Interpretation:** Registration modes (online, offline, hybrid registration methods)

**Implementation Plan:**
1. Add `registration_mode` field to events table
2. Add dropdown in event creation form
3. Add to registration settings
4. Store in separate table if multiple modes allowed

**Suggested Values:**
- Online Registration
- Offline Registration
- Both (Hybrid)
- Invite Only
- Walk-in Registration

---

## Testing

### Test Dashboard Rearrangement:
1. Go to: http://localhost:3001/events/14
2. **Verify:**
   - ✅ Sponsor Category and Exhibitor in row 2
   - ✅ Registration Trend and Attendance in row 3

### Test Event Mode Display:
1. Go to: http://localhost:3001/events/14/info
2. **Verify:**
   - ✅ Badge shows "In Person" not "IN_PERSON"
   - ✅ Dropdown shows "In Person", "Virtual", "Hybrid"

### Test Team Invitation:
1. Invite a team member (generates token)
2. Go to: http://localhost:3001/team-invitation/{token}
3. **Verify:**
   - ✅ Shows invitation page
   - ✅ Accept button works
   - ✅ Reject button works
   - ✅ Status updates correctly
   - ✅ Member disappears from pending list

---

## Files Modified/Created

### Modified:
1. `/apps/web/app/events/[id]/page.tsx` - Dashboard rearrangement
2. `/apps/web/app/events/[id]/info/page.tsx` - Event mode display

### Created:
1. `/apps/web/lib/format-event-mode.ts` - Utility function
2. `/apps/web/app/api/team-invitations/[token]/accept/route.ts` - Accept API
3. `/apps/web/app/api/team-invitations/[token]/reject/route.ts` - Reject API
4. `/apps/web/app/team-invitation/[token]/page.tsx` - Invitation page

---

## Build Status

```
✅ Web service restarted
✅ Dashboard rearranged
✅ Event mode display fixed
✅ Team invitation endpoints created
✅ Invitation page created
⚠️ Backend integration needed for full workflow
⚠️ Modes field implementation pending clarification
```

---

## Summary

**✅ Dashboard cards rearranged** - Sponsor and Exhibitor moved up  
**✅ Event mode display fixed** - Shows "In Person" instead of "IN_PERSON"  
**✅ Team invitation workflow created** - Accept/reject endpoints and UI  
**⚠️ Backend integration needed** - Email sending and token validation  
**⚠️ Modes field pending** - Needs clarification on requirements  

The frontend infrastructure is ready for the team invitation workflow. Once the backend implements token generation, email sending, and status updates, the complete workflow will be functional! 🚀
