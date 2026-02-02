# 🔐 SUPER ADMIN & SUBSCRIPTION STRUCTURE

## 🎯 WHAT'S IMPLEMENTED

### **1. Super Admin Dashboard**
✅ View all companies (tenants)  
✅ See company details (events, members, subscription)  
✅ Activate/Suspend companies  
✅ Monitor subscription usage  

### **2. Subscription Enforcement**
✅ Companies must have ACTIVE/TRIAL status  
✅ Event creation blocked if limit reached  
✅ User invitation blocked if limit reached  
✅ Real-time limit checking  

### **3. Company Registration Flow**
✅ Register → Creates tenant with FREE plan (TRIAL status)  
✅ Must subscribe to create events  
✅ Plan limits enforced automatically  

---

## 📁 FILES CREATED

### **Frontend Pages**
```
apps/web/app/(admin)/super-admin/companies/
├── page.tsx                    # List all companies
└── [id]/page.tsx              # Company details page
```

### **API Routes**
```
apps/web/app/api/
├── super-admin/companies/
│   ├── route.ts               # GET all companies
│   └── [id]/route.ts          # GET/PATCH company
└── events/check-limits/
    └── route.ts               # Check subscription limits
```

### **Utilities**
```
apps/web/lib/
└── subscription-check.ts      # Subscription validation logic
```

---

## 🔄 COMPLETE FLOW

### **STEP 1: Company Registers**
```
1. Visit: /company/register
2. Fill form → Submit
3. System creates:
   - Tenant (status: TRIAL, plan: FREE)
   - Admin user (role: OWNER)
   - Limits: 10 events, 5 users
```

### **STEP 2: Super Admin Reviews**
```
1. Super Admin logs in
2. Goes to: /super-admin/companies
3. Sees all companies with:
   - Name, subdomain
   - Plan, Status
   - Member count, Event count
   - Registration date
4. Clicks company → View details
5. Can Activate or Suspend
```

### **STEP 3: Company Tries to Create Event**
```
1. Admin logs in
2. Goes to: /events/create
3. System checks:
   - Is subscription ACTIVE or TRIAL? ✅
   - Current events < Max events? ✅
   - If NO: Show error "Subscription required"
4. If YES: Allow event creation
```

### **STEP 4: Subscription Limits Enforced**
```
FREE Plan:
- Max Events: 10
- Max Users: 5
- Status: TRIAL (14 days)

When limit reached:
❌ "Event limit reached (10/10). Please upgrade."
❌ "User limit reached (5/5). Please upgrade."
```

---

## 🎨 SUPER ADMIN DASHBOARD

### **Companies List View**
```
┌─────────────────────────────────────────────────────────┐
│  Companies (Tenants)                                    │
├─────────────────────────────────────────────────────────┤
│  Company      Subdomain    Plan    Status   Events  ... │
│  Acme Corp    acme-corp    PRO     ACTIVE   15      ... │
│  TechStart    techstart    FREE    TRIAL    3       ... │
│  BigCo        bigco        ENT     ACTIVE   50      ... │
└─────────────────────────────────────────────────────────┘

Stats:
┌──────────┬──────────┬──────────┬──────────┐
│ Total: 3 │ Active:2 │ Trial: 1 │ Susp: 0  │
└──────────┴──────────┴──────────┴──────────┘
```

### **Company Details View**
```
┌─────────────────────────────────────────────────────────┐
│  Acme Corp                          [Activate] [Suspend]│
│  admin@acme.com                                         │
│  PRO | ACTIVE                                           │
├─────────────────────────────────────────────────────────┤
│  Subdomain: acme-corp                                   │
│  Max Events: 200  |  Max Users: 100                     │
├─────────────────────────────────────────────────────────┤
│  Events (15)                                            │
│  - Tech Conference 2025    2025-12-15   PUBLISHED  50  │
│  - Product Launch          2025-11-20   DRAFT       0   │
├─────────────────────────────────────────────────────────┤
│  Team Members (8)                                       │
│  - John Doe (john@acme.com)         OWNER      ACTIVE  │
│  - Mary Smith (mary@acme.com)       ADMIN      ACTIVE  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔒 SUBSCRIPTION PLANS

### **Plan Limits**
```typescript
FREE:
- Events: 10
- Users: 5
- Storage: 1 GB
- Status: TRIAL (14 days)

STARTER:
- Events: 50
- Users: 20
- Storage: 10 GB
- Price: $29/month

PRO:
- Events: 200
- Users: 100
- Storage: 50 GB
- Price: $99/month

ENTERPRISE:
- Events: Unlimited
- Users: Unlimited
- Storage: Unlimited
- Price: Custom
```

### **Status Types**
```typescript
TRIAL:    // 14-day trial, full access
ACTIVE:   // Paid subscription, full access
SUSPENDED: // Payment failed, read-only
CANCELLED: // Subscription ended, no access
```

---

## 🚀 HOW TO USE

### **As Super Admin:**
```bash
1. Login with super admin account
2. Navigate to: /super-admin/companies
3. View all companies
4. Click company → See details
5. Activate/Suspend as needed
```

### **As Company Admin:**
```bash
1. Register company → /company/register
2. Login → Dashboard
3. Try to create event
4. If limit reached → Upgrade plan
5. Subscribe → Create events
```

---

## 📊 SUBSCRIPTION CHECK API

### **Check Limits**
```typescript
GET /api/events/check-limits

Response:
{
  "success": true,
  "subscription": {
    "plan": "PRO",
    "status": "ACTIVE",
    "limits": {
      "events": {
        "current": 15,
        "max": 200,
        "percentage": 7.5
      },
      "users": {
        "current": 8,
        "max": 100,
        "percentage": 8
      }
    },
    "canCreateEvent": true,
    "canAddUser": true
  }
}
```

### **Usage in Code**
```typescript
// Before creating event
const res = await fetch('/api/events/check-limits')
const data = await res.json()

if (!data.canCreateEvent) {
  alert(data.reason)
  // Show upgrade modal
  return
}

// Proceed with event creation
```

---

## ✅ WHAT'S ENFORCED

### **Event Creation**
```typescript
✅ Subscription must be ACTIVE or TRIAL
✅ Current events < Max events
❌ Blocked if limit reached
❌ Blocked if subscription suspended
```

### **User Invitation**
```typescript
✅ Subscription must be ACTIVE or TRIAL
✅ Current users < Max users
❌ Blocked if limit reached
❌ Blocked if subscription suspended
```

### **Module Access**
```typescript
✅ All modules require active subscription
✅ Read-only if suspended
❌ No access if cancelled
```

---

## 🎯 CURRENT STATUS

| Feature | Status |
|---------|--------|
| Super Admin Dashboard | ✅ Created |
| Company List View | ✅ Working |
| Company Details View | ✅ Working |
| Subscription Limits | ✅ Enforced |
| Event Creation Check | ✅ Working |
| User Invitation Check | ✅ Working |
| Activate/Suspend | ✅ Working |
| Plan Upgrade | ⚠️ UI needed |

---

## 🔧 NEXT STEPS

1. **Add Subscription UI**
   - Create `/settings/billing` page
   - Integrate Stripe payment
   - Show current usage

2. **Add Upgrade Modal**
   - Show when limit reached
   - Display plan comparison
   - Link to billing page

3. **Add Trial Expiry**
   - Auto-suspend after 14 days
   - Send reminder emails
   - Grace period logic

4. **Add Usage Analytics**
   - Track event creation
   - Monitor user activity
   - Generate reports

---

## 📚 DOCUMENTATION

- **Super Admin Access**: `/super-admin/companies`
- **API Docs**: See API routes above
- **Subscription Logic**: `apps/web/lib/subscription-check.ts`
- **Database Schema**: `apps/web/prisma/schema.prisma`

---

**Structure is now complete!** 🎉

Super Admin can:
✅ View all companies
✅ See events per company
✅ Monitor subscriptions
✅ Activate/Suspend companies

Companies must:
✅ Register first
✅ Have active subscription
✅ Stay within plan limits
