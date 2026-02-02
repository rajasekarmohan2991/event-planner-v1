# Multi-Tenant Architecture Design

## 🏗️ Architecture Overview

### Tenant Identification Method
**Chosen Approach**: **Subdomain-based** with path-based fallback
- Primary: `company1.eventplanner.com`
- Fallback: `eventplanner.com/t/company1`
- Admin: `admin.eventplanner.com` (Super Admin)

### Data Isolation Strategy
**Row-Level Security (RLS)** with `tenantId` column in all tenant-scoped tables

---

## 📊 Database Schema Design

### Core Tenant Tables

```prisma
model Tenant {
  id              String          @id @default(cuid())
  slug            String          @unique  // URL-safe identifier
  name            String          // Display name
  domain          String?         @unique  // Custom domain (optional)
  subdomain       String          @unique  // company1
  
  // Branding
  logo            String?
  primaryColor    String?         @default("#3B82F6")
  secondaryColor  String?         @default("#10B981")
  faviconUrl      String?
  
  // Settings
  timezone        String          @default("UTC")
  currency        String          @default("USD")
  dateFormat      String          @default("MM/DD/YYYY")
  
  // Subscription & Billing
  plan            String          @default("FREE")  // FREE, STARTER, PRO, ENTERPRISE
  subscriptionStatus String       @default("ACTIVE") // ACTIVE, SUSPENDED, CANCELLED
  billingEmail    String?
  maxEvents       Int             @default(10)
  maxUsers        Int             @default(5)
  
  // Email Templates
  emailFromName   String?
  emailFromAddress String?
  emailReplyTo    String?
  
  // Feature Flags
  features        Json?           // { "customBranding": true, "whiteLabel": false }
  
  // Metadata
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  deletedAt       DateTime?       // Soft delete
  
  // Relations
  members         TenantMember[]
  events          Event[]
  customFields    CustomField[]
  emailTemplates  EmailTemplate[]
  lookups         TenantLookup[]
  settings        TenantSetting[]
}

model TenantMember {
  id        String   @id @default(cuid())
  tenantId  String
  userId    BigInt
  role      TenantRole @default(MEMBER)
  
  // Permissions
  permissions Json?   // Custom permissions per user
  
  // Status
  status    String   @default("ACTIVE") // ACTIVE, INVITED, SUSPENDED
  invitedBy BigInt?
  invitedAt DateTime?
  joinedAt  DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, userId])
  @@index([userId])
  @@index([tenantId, role])
}

enum TenantRole {
  OWNER       // Full control, billing, delete tenant
  ADMIN       // Manage users, settings, all events
  MANAGER     // Create/manage events, view reports
  MEMBER      // Create events, limited access
  VIEWER      // Read-only access
}
```

### User Model Enhancement

```prisma
model User {
  id                BigInt              @id @default(autoincrement())
  name              String
  email             String              @unique
  emailVerified     DateTime?
  password          String?
  role              SystemRole          @default(USER)  // System-wide role
  image             String?
  selectedCity      String?
  currentTenantId   String?             // Active tenant context
  
  createdAt         DateTime            @default(now())
  updatedAt         DateTime            @updatedAt
  
  // Relations
  accounts          Account[]
  sessions          Session[]
  memberships       TenantMember[]      // Multi-tenant access
  
  organizerProfile  OrganizerProfile?
  individualKYC     IndividualVerification?
  
  @@map("users")
}

enum SystemRole {
  SUPER_ADMIN  // Can manage all tenants
  USER         // Regular user
}
```

---

## 🔐 Tenant-Scoped Tables

### Events (Tenant-Specific)

```prisma
model Event {
  id          String   @id @default(cuid())
  tenantId    String   // REQUIRED - tenant isolation
  
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  status      String
  
  // ... other fields
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId, status])
  @@index([tenantId, startDate])
}
```

### Registrations (Tenant-Specific)

```prisma
model Registration {
  id          String   @id @default(cuid())
  tenantId    String   // REQUIRED
  eventId     String
  userId      BigInt?
  email       String
  status      String
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  event       Event    @relation(fields: [eventId], references: [id])
  
  @@index([tenantId, eventId])
  @@index([tenantId, status])
}
```

---

## 🎨 Lookups: Global vs Tenant-Specific

### Global Lookups (Shared Across All Tenants)

**System-wide, read-only for tenants:**

```prisma
model GlobalLookup {
  id          String   @id @default(cuid())
  category    String   // "EVENT_TYPE", "INDUSTRY", "COUNTRY"
  code        String
  label       String
  description String?
  order       Int      @default(0)
  active      Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([category, code])
  @@index([category, active])
}

// Examples:
// - EVENT_TYPE: Conference, Workshop, Webinar, Trade Show
// - INDUSTRY: Technology, Healthcare, Finance, Education
// - COUNTRY: USA, Canada, UK, India
// - TIMEZONE: UTC, EST, PST, IST
```

### Tenant-Specific Lookups (Customizable)

**Each tenant can customize:**

```prisma
model TenantLookup {
  id          String   @id @default(cuid())
  tenantId    String
  category    String   // "CUSTOM_STATUS", "CUSTOM_TAG", "DEPARTMENT"
  code        String
  label       String
  description String?
  color       String?  // For UI display
  icon        String?
  order       Int      @default(0)
  active      Boolean  @default(true)
  
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@unique([tenantId, category, code])
  @@index([tenantId, category, active])
}

// Examples:
// - CUSTOM_STATUS: Pending Approval, In Review, Confirmed
// - CUSTOM_TAG: VIP, Sponsor, Speaker, Attendee
// - DEPARTMENT: Marketing, Sales, Engineering
```

### Lookup Decision Matrix

| Lookup Type | Global | Tenant-Specific | Reason |
|-------------|--------|-----------------|--------|
| Event Types | ✅ | ❌ | Standard categories |
| Industries | ✅ | ❌ | Universal classification |
| Countries | ✅ | ❌ | ISO standards |
| Timezones | ✅ | ❌ | IANA standard |
| Event Status | ❌ | ✅ | Custom workflows |
| Tags/Labels | ❌ | ✅ | Organization-specific |
| Departments | ❌ | ✅ | Company structure |
| Custom Fields | ❌ | ✅ | Unique requirements |
| Email Templates | ❌ | ✅ | Branding |
| Color Profiles | ❌ | ✅ | Brand identity |

---

## 🔒 Tenant Identification & Middleware

### 1. Tenant Resolution Strategy

```typescript
// lib/tenant.ts
export async function resolveTenant(req: NextRequest): Promise<Tenant | null> {
  // Method 1: Subdomain (Primary)
  const host = req.headers.get('host') || ''
  const subdomain = extractSubdomain(host)
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'admin') {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain }
    })
    if (tenant) return tenant
  }
  
  // Method 2: Path-based (/t/company1)
  const pathMatch = req.nextUrl.pathname.match(/^\/t\/([^\/]+)/)
  if (pathMatch) {
    const slug = pathMatch[1]
    const tenant = await prisma.tenant.findUnique({
      where: { slug }
    })
    if (tenant) return tenant
  }
  
  // Method 3: User's current tenant (from session)
  const session = await getServerSession(authOptions)
  if (session?.user?.currentTenantId) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.user.currentTenantId }
    })
    if (tenant) return tenant
  }
  
  return null
}

function extractSubdomain(host: string): string | null {
  const parts = host.split('.')
  if (parts.length >= 3) {
    return parts[0] // company1 from company1.eventplanner.com
  }
  return null
}
```

### 2. Tenant Middleware

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const tenant = await resolveTenant(request)
  
  // Public routes (no tenant required)
  const publicPaths = ['/auth', '/api/auth', '/landing', '/pricing']
  if (publicPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Super admin routes
  if (request.nextUrl.pathname.startsWith('/super-admin')) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }
  
  // Tenant-required routes
  if (!tenant) {
    return NextResponse.redirect(new URL('/select-tenant', request.url))
  }
  
  // Check tenant status
  if (tenant.subscriptionStatus !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/subscription-suspended', request.url))
  }
  
  // Check user membership
  const session = await getServerSession(authOptions)
  if (session?.user) {
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: session.user.id
        }
      }
    })
    
    if (!membership) {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }
  }
  
  // Add tenant to request headers
  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenant.id)
  response.headers.set('x-tenant-slug', tenant.slug)
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

---

## 🛡️ Data Isolation & Security

### 1. Tenant-Scoped Prisma Client

```typescript
// lib/prisma-tenant.ts
import { PrismaClient } from '@prisma/client'
import { headers } from 'next/headers'

export function getTenantPrisma() {
  const headersList = headers()
  const tenantId = headersList.get('x-tenant-id')
  
  if (!tenantId) {
    throw new Error('Tenant context required')
  }
  
  // Extend Prisma client with tenant middleware
  const prisma = new PrismaClient()
  
  prisma.$use(async (params, next) => {
    // Auto-inject tenantId for tenant-scoped models
    const tenantModels = ['event', 'registration', 'exhibitor', 'customField']
    
    if (tenantModels.includes(params.model?.toLowerCase() || '')) {
      if (params.action === 'create' || params.action === 'createMany') {
        params.args.data = {
          ...params.args.data,
          tenantId
        }
      }
      
      if (['findMany', 'findFirst', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
        params.args.where = {
          ...params.args.where,
          tenantId
        }
      }
    }
    
    return next(params)
  })
  
  return prisma
}
```

### 2. API Route Protection

```typescript
// lib/api-helpers.ts
export async function withTenantAuth(
  req: NextRequest,
  handler: (tenant: Tenant, user: User) => Promise<NextResponse>
) {
  // Get tenant
  const tenant = await resolveTenant(req)
  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }
  
  // Get user session
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Check membership
  const membership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: session.user.id
      }
    }
  })
  
  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  
  return handler(tenant, session.user)
}
```

---

## 👥 User & Tenant Management

### 1. Tenant Switching

```typescript
// app/api/user/switch-tenant/route.ts
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { tenantId } = await req.json()
  
  // Verify user has access to this tenant
  const membership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: session.user.id
      }
    },
    include: { tenant: true }
  })
  
  if (!membership) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  
  // Update user's current tenant
  await prisma.user.update({
    where: { id: session.user.id },
    data: { currentTenantId: tenantId }
  })
  
  return NextResponse.json({
    success: true,
    tenant: membership.tenant
  })
}
```

### 2. Invite User to Tenant

```typescript
// app/api/tenants/[id]/invite/route.ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withTenantAuth(req, async (tenant, user) => {
    // Check if user is admin
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: user.id
        }
      }
    })
    
    if (!['OWNER', 'ADMIN'].includes(membership?.role || '')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }
    
    const { email, role } = await req.json()
    
    // Check if user exists
    let invitedUser = await prisma.user.findUnique({ where: { email } })
    
    if (!invitedUser) {
      // Create placeholder user
      invitedUser = await prisma.user.create({
        data: {
          email,
          name: email.split('@')[0],
          role: 'USER'
        }
      })
    }
    
    // Create tenant membership
    const tenantMember = await prisma.tenantMember.create({
      data: {
        tenantId: tenant.id,
        userId: invitedUser.id,
        role,
        status: 'INVITED',
        invitedBy: user.id,
        invitedAt: new Date()
      }
    })
    
    // Send invitation email
    await sendInvitationEmail({
      to: email,
      tenantName: tenant.name,
      inviterName: user.name,
      role
    })
    
    return NextResponse.json({ success: true, member: tenantMember })
  })
}
```

---

## 📈 Billing & Subscription

### Subscription Plans

```typescript
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    maxEvents: 10,
    maxUsers: 5,
    features: ['Basic event management', 'Email support']
  },
  STARTER: {
    name: 'Starter',
    price: 29,
    maxEvents: 50,
    maxUsers: 10,
    features: ['Custom branding', 'Priority support', 'Analytics']
  },
  PRO: {
    name: 'Pro',
    price: 99,
    maxEvents: 200,
    maxUsers: 50,
    features: ['White label', 'API access', 'Advanced analytics', 'Custom domain']
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 299,
    maxEvents: -1, // Unlimited
    maxUsers: -1,
    features: ['Everything in Pro', 'Dedicated support', 'SLA', 'Custom integrations']
  }
}
```

---

## 🎯 Implementation Checklist

### Phase 1: Database & Core (Week 1)
- [ ] Update Prisma schema with enhanced Tenant model
- [ ] Add tenantId to all relevant tables
- [ ] Create migration scripts
- [ ] Implement tenant middleware
- [ ] Create tenant-scoped Prisma client

### Phase 2: Authentication & Access (Week 2)
- [ ] Update auth to support multi-tenant
- [ ] Implement tenant switching
- [ ] Create tenant invitation system
- [ ] Build role-based permissions

### Phase 3: Admin Interface (Week 3)
- [ ] Super Admin dashboard
- [ ] Tenant management CRUD
- [ ] User-tenant assignment UI
- [ ] Billing & subscription management

### Phase 4: Tenant Features (Week 4)
- [ ] Tenant settings page
- [ ] Custom branding UI
- [ ] Email template customization
- [ ] Tenant-specific lookups management

### Phase 5: Testing & Migration (Week 5)
- [ ] Data migration scripts
- [ ] Security audit
- [ ] Performance testing
- [ ] Documentation

---

## 🚀 Next Steps

1. **Review this architecture** - Confirm it meets your requirements
2. **Update Prisma schema** - I'll modify the schema file
3. **Run migrations** - Apply database changes
4. **Implement middleware** - Tenant identification
5. **Build admin UI** - Tenant management interface

Ready to proceed? I'll start implementing the database schema changes.
