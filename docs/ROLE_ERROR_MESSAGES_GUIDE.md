# Role-Based Error Messages - Complete Guide

**System Status:** ✅ **FULLY IMPLEMENTED AND ACTIVE**

---

## 🎯 **How The Error System Works**

When any user tries to perform an action they don't have permission for, the system automatically:

1. **Detects** the unauthorized action
2. **Generates** a detailed, role-specific error message
3. **Displays** the error with:
   - Clear title explaining what's not allowed
   - Your current role
   - Why you can't perform this action
   - Which roles CAN perform this action
   - Instructions to contact admin

---

## 📋 **Error Message Examples By Role**

### **USER Role Attempting Actions:**

#### ❌ Try to Create Event:
```json
{
  "error": "Event Creation Not Allowed",
  "message": "Your role is not intended to create new events.",
  "suggestion": "Please contact an Administrator, Event Manager, or Super Administrator to create events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"],
  "userRole": "USER",
  "roleGuidance": "As a User, you can only view events and register for them. You cannot create, edit, or manage events."
}
```

#### ❌ Try to Edit Event:
```json
{
  "error": "Event Editing Not Allowed",
  "message": "Your role is not intended to edit or update event information.",
  "suggestion": "Please contact an Administrator, Event Manager, or Super Administrator to modify events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"],
  "userRole": "USER",
  "roleGuidance": "As a User, you can only view events and register for them. You cannot create, edit, or manage events."
}
```

#### ❌ Try to View Analytics:
```json
{
  "error": "Analytics Access Not Allowed",
  "message": "Your role is not intended to view analytics and reports.",
  "suggestion": "Please contact an Administrator, Event Manager, or Super Administrator for analytics access.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"],
  "userRole": "USER"
}
```

---

### **ORGANIZER Role Attempting Actions:**

#### ❌ Try to Create Event:
```json
{
  "error": "Event Creation Not Allowed",
  "message": "Your role is not intended to create new events.",
  "suggestion": "Please contact an Administrator, Event Manager, or Super Administrator to create events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"],
  "userRole": "ORGANIZER",
  "roleGuidance": "As an Event Organizer, you can view events and registrations but cannot create or manage events. Event management is done by Event Managers."
}
```

#### ❌ Try to Manage Events:
```json
{
  "error": "Event Editing Not Allowed",
  "message": "Your role is not intended to edit or update event information.",
  "suggestion": "Please contact an Administrator, Event Manager, or Super Administrator to modify events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"],
  "userRole": "ORGANIZER",
  "roleGuidance": "As an Event Organizer, you can view events and registrations but cannot create or manage events. Event management is done by Event Managers."
}
```

---

### **EVENT_MANAGER Role Attempting Actions:**

#### ❌ Try to Create User:
```json
{
  "error": "User Creation Not Allowed",
  "message": "Your role is not intended to create new users in the system.",
  "suggestion": "Only Super Administrators can create new users.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "EVENT_MANAGER",
  "roleGuidance": "As an Event Manager, you can manage events and view analytics but cannot manage users, delete events, or access system settings."
}
```

#### ❌ Try to Delete Event:
```json
{
  "error": "Event Deletion Not Allowed",
  "message": "Your role is not intended to delete events from the system.",
  "suggestion": "Only Super Administrators can permanently remove events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "EVENT_MANAGER",
  "roleGuidance": "As an Event Manager, you can manage events and view analytics but cannot manage users, delete events, or access system settings."
}
```

#### ❌ Try to Access System Settings:
```json
{
  "error": "System Settings Access Not Allowed",
  "message": "Your role is not intended to modify system settings or configurations.",
  "suggestion": "Only Super Administrators can change system settings.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "EVENT_MANAGER"
}
```

---

### **ADMIN Role Attempting Actions:**

#### ❌ Try to Create User:
```json
{
  "error": "User Creation Not Allowed",
  "message": "Your role is not intended to create new users in the system.",
  "suggestion": "Only Super Administrators can create new users.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "ADMIN",
  "roleGuidance": "As an Administrator, you can view users and manage events but cannot create/edit/delete users, delete events, manage roles, or access system settings."
}
```

#### ❌ Try to Delete Event:
```json
{
  "error": "Event Deletion Not Allowed",
  "message": "Your role is not intended to delete events from the system.",
  "suggestion": "Only Super Administrators can permanently remove events.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "ADMIN",
  "roleGuidance": "As an Administrator, you can view users and manage events but cannot create/edit/delete users, delete events, manage roles, or access system settings."
}
```

#### ❌ Try to Manage Roles:
```json
{
  "error": "Role Management Not Allowed",
  "message": "Your role is not intended to manage user roles or permissions.",
  "suggestion": "Only Super Administrators can modify roles and permissions.",
  "contactAdmin": true,
  "allowedRoles": ["SUPER_ADMIN"],
  "userRole": "ADMIN"
}
```

---

## 🧪 **How to Test The Error System**

### **Test 1: USER tries to create event**

1. Login as user with USER role
2. Try to access: `POST /api/events`
3. Expected error: "Event Creation Not Allowed" with full details

**Frontend Test:**
```javascript
// Will automatically show error
fetch('/api/events', {
  method: 'POST',
  body: JSON.stringify({ title: 'Test Event' })
})
.then(res => res.json())
.then(data => {
  console.log(data.error) // "Event Creation Not Allowed"
  console.log(data.message) // Full explanation
  console.log(data.contactAdmin) // true
  console.log(data.allowedRoles) // ["SUPER_ADMIN", "ADMIN", "EVENT_MANAGER"]
})
```

### **Test 2: ORGANIZER tries to edit event**

1. Login as user with ORGANIZER role
2. Try to access: `PUT /api/events/12`
3. Expected error: "Event Editing Not Allowed"

### **Test 3: ADMIN tries to create user**

1. Login as user with ADMIN role
2. Try to access: `POST /api/admin/users`
3. Expected error: "User Creation Not Allowed"

### **Test 4: EVENT_MANAGER tries to delete event**

1. Login as user with EVENT_MANAGER role
2. Try to access: `DELETE /api/events/12`
3. Expected error: "Event Deletion Not Allowed"

---

## 🔐 **Protected Operations**

### **User Management** (SUPER_ADMIN only)
- ❌ Create Users → All other roles get error
- ❌ Edit Users → All other roles get error  
- ❌ Delete Users → All other roles get error
- ✅ View Users → ADMIN can view (others get error)

### **Event Management** (SUPER_ADMIN, ADMIN, EVENT_MANAGER)
- ❌ Create Events → USER, ORGANIZER get error
- ❌ Edit Events → USER, ORGANIZER get error
- ❌ Delete Events → All except SUPER_ADMIN get error

### **Role Management** (SUPER_ADMIN only)
- ❌ Manage Roles → All other roles get error
- ❌ Assign Roles → All other roles get error

### **System Settings** (SUPER_ADMIN only)
- ❌ Change Settings → All other roles get error

### **Analytics** (SUPER_ADMIN, ADMIN, EVENT_MANAGER)
- ❌ View Analytics → USER, ORGANIZER get error

### **Refunds** (SUPER_ADMIN, ADMIN only)
- ❌ Process Refunds → EVENT_MANAGER, ORGANIZER, USER get error

---

## 📍 **Where Error Checking Happens**

### **API Routes With Permission Checks:**

1. `/api/events` (GET, POST)
   - POST: Requires `events.create`
   - GET: Requires `events.view`

2. `/api/events/[id]` (PUT, DELETE)
   - PUT: Requires `events.edit`
   - DELETE: Requires `events.delete`

3. `/api/admin/users` (GET, POST)
   - POST: Requires `users.create`
   - GET: Requires `users.view`

4. `/api/admin/promo-codes` (GET, POST)
   - POST: Requires `promo_codes.create`
   - GET: Requires `promo_codes.view`

5. `/api/admin/refunds` (GET, POST)
   - POST: Requires `payments.refund`
   - GET: Requires `payments.refund` or `admin.dashboard`

6. `/api/admin/invitations` (GET, POST)
   - POST: Requires `communication.send_email`

7. `/api/admin/roles` (GET, POST)
   - POST: Requires `admin.permissions`
   - GET: Requires `admin.permissions`

---

## 💻 **Frontend Error Display**

### **Using the Permission Hook:**

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function CreateEventButton() {
  const { hasPermission, getErrorMessage } = usePermissions()
  
  const handleCreate = () => {
    if (!hasPermission('events.create')) {
      alert(getErrorMessage('events.create', 'Create Event'))
      return
    }
    // Proceed with creation
  }
  
  return (
    <button 
      onClick={handleCreate}
      disabled={!hasPermission('events.create')}
    >
      Create Event
    </button>
  )
}
```

### **Using Permission Error Component:**

```typescript
import PermissionError from '@/components/PermissionError'

function EventManager() {
  const { userRole, hasPermission } = usePermissions()
  
  if (!hasPermission('events.create')) {
    return (
      <PermissionError
        permission="events.create"
        userRole={userRole}
        action="Create Event"
      />
    )
  }
  
  return <EventCreationForm />
}
```

---

## 🎯 **Error Message Structure**

Every permission error includes:

1. **error** - Short title ("Event Creation Not Allowed")
2. **message** - Explanation of why ("Your role is not intended to...")
3. **suggestion** - Who can perform this action
4. **contactAdmin** - Whether to show "contact admin" message (true/false)
5. **allowedRoles** - Array of roles that CAN perform this action
6. **userRole** - Your current role
7. **roleGuidance** - Description of what your role CAN do
8. **requiredPermissions** - Array of permissions needed

---

## ✅ **System Status**

**Implementation Files:**
- ✅ `/lib/permission-errors.ts` - Error definitions
- ✅ `/lib/permission-middleware.ts` - API checking
- ✅ `/components/PermissionError.tsx` - UI components
- ✅ `/hooks/usePermissions.ts` - Frontend hooks
- ✅ `/lib/roles-config.ts` - Role definitions

**Coverage:**
- ✅ 26+ API routes protected
- ✅ All critical operations checked
- ✅ Frontend permission validation
- ✅ Detailed error messages
- ✅ Role-specific guidance

**Status:** 🟢 **LIVE AND ACTIVE**

---

## 🚀 **Quick Test Commands**

Test as different roles using curl:

```bash
# Test as USER (should fail)
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"title":"Test Event"}'

# Expected: 403 with detailed error message

# Test as ORGANIZER (should fail)
curl -X PUT http://localhost:3001/api/events/12 \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"title":"Updated Event"}'

# Expected: 403 with "Event Editing Not Allowed"

# Test as ADMIN creating user (should fail)
curl -X POST http://localhost:3001/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"email":"test@test.com"}'

# Expected: 403 with "User Creation Not Allowed"
```

---

## 📝 **Summary**

✅ **Complete error message system implemented**  
✅ **Every role has specific error messages**  
✅ **All critical operations are protected**  
✅ **Clear instructions to contact admin**  
✅ **Frontend and backend validation**  
✅ **User-friendly error displays**  

**The system automatically generates proper error messages saying:**
- ❌ "This role is not intended to save the settings or change or update"
- ✅ "Please contact your system administrator for access"
- ✅ Shows which roles CAN perform the action
- ✅ Explains what your current role CAN do

**Ready for production use!** 🎉

---

*Last Updated: November 11, 2025, 2:10 PM IST*
