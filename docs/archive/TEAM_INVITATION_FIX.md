# Team Invitation & Email Fix

## Issues Fixed

1. **Anonymous User Creation** - Backend creates users without names
2. **No Approval Workflow** - Team members auto-approved
3. **SMTP Not Working** - Using test email service
4. **No Admin Notifications** - Admins not notified of invites

## Solution

### 1. Change SMTP to Gmail
Edit: `/apps/api-java/src/main/resources/application.properties`

```properties
# Replace Ethereal with Gmail
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.mail.from=Event Planner <your-email@gmail.com>
```

### 2. Get Gmail App Password
1. Go to Google Account Settings
2. Security → 2-Step Verification → App Passwords
3. Generate password for "Mail"
4. Use that password in properties file

### 3. Backend Changes Needed
The Java backend needs to:
- NOT create anonymous users
- Set team member status to PENDING
- Send email to admins for approval
- Only create user after admin approves

### 4. Workflow
```
Event Manager invites member
  ↓
Backend: status = PENDING (don't create user yet)
  ↓
Email sent to Super Admin/Admin
  ↓
Admin approves in UI
  ↓
Backend: Create user, status = APPROVED
  ↓
Send welcome email to team member
```

## Quick Fix

1. Update SMTP settings in application.properties
2. Restart API container: `docker compose restart api`
3. Test email by inviting a team member

## Files to Modify
- `/apps/api-java/src/main/resources/application.properties` - SMTP config
- Java backend team controller - Add approval workflow
