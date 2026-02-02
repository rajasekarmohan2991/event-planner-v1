# Multi-Tenant Implementation Guide

## 📋 Overview

This guide walks you through implementing the complete multi-tenant architecture for your Event Planner application.

## ⚠️ Important Notes

**Current Status**: 
- ✅ Architecture designed
- ✅ Enhanced schema created (`schema_multitenant.prisma`)
- ✅ Tenant utilities enhanced (`lib/tenant.ts`)
- ⚠️ Schema not yet applied (causes lint errors - this is expected)
- ⚠️ Middleware not yet created
- ⚠️ Admin UI not yet built

**Lint Errors**: The current lint errors about `subdomain`, `status`, `plan` fields are **expected** because the enhanced schema hasn't been applied yet. These will disappear after Step 2.

---

## 🚀 Implementation Steps

### Step 1: Backup Current Database

```bash
# Backup your current database
cd apps/web
docker compose exec postgres pg_dump -U postgres event_planner > backup_$(date +%Y%m%d).sql

# Or export data
npx prisma db pull
npx prisma db export
```

### Step 2: Update Prisma Schema

**Option A: Full Replace (Recommended for new projects)**
```bash
# Backup current schema
cp prisma/schema.prisma prisma/schema_backup.prisma

# Replace with multi-tenant schema
cp prisma/schema_multitenant.prisma prisma/schema.prisma

# Create and apply migration
npx prisma migrate dev --name add_multitenant_architecture

# Generate Prisma client
npx prisma generate
```

**Option B: Gradual Migration (Recommended for production)**
```bash
# Add new fields to existing Tenant model
# Edit prisma/schema.prisma manually to add:
# - subdomain, domain, logo, primaryColor, etc.
# - status, plan enums
# - TenantRole enum

# Then migrate
npx prisma migrate dev --name enhance_tenant_model
npx prisma generate
```

### Step 3: Create Tenant Middleware

Create `middleware.ts` in the root of `/apps/web`:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveTenant } from '@/lib/tenant'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Public routes (no tenant required)
  const publicPaths = [
    '/auth',
    '/api/auth',
    '/landing',
    '/pricing',
    '/_next',
    '/favicon.ico',
    '/api/health'
  ]
  
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Super admin routes
  if (pathname.startsWith('/super-admin')) {
    const session = await getServerSession(authOptions as any)
    if (session?.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
    return NextResponse.next()
  }
  
  // Resolve tenant
  const tenant = await resolveTenant(request)
  
  // Tenant selection page (no tenant required)
  if (pathname === '/select-tenant' || pathname === '/create-tenant') {
    return NextResponse.next()
  }
  
  // Require tenant for all other routes
  if (!tenant) {
    return NextResponse.redirect(new URL('/select-tenant', request.url))
  }
  
  // Check tenant status
  if (tenant.status === 'SUSPENDED') {
    return NextResponse.redirect(new URL('/subscription-suspended', request.url))
  }
  
  if (tenant.status === 'CANCELLED') {
    return NextResponse.redirect(new URL('/subscription-cancelled', request.url))
  }
  
  // Check user membership (for authenticated routes)
  const session = await getServerSession(authOptions as any)
  if (session?.user && !pathname.startsWith('/api/')) {
    const prisma = (await import('@/lib/prisma')).default
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: BigInt(session.user.id)
        }
      }
    })
    
    if (!membership) {
      return NextResponse.redirect(new URL('/access-denied', request.url))
    }
  }
  
  // Add tenant context to headers
  const response = NextResponse.next()
  response.headers.set('x-tenant-id', tenant.id)
  response.headers.set('x-tenant-slug', tenant.slug)
  response.headers.set('x-tenant-subdomain', tenant.subdomain)
  
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Step 4: Create API Helper for Tenant-Scoped Routes

Create `lib/api-helpers.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { resolveTenant, hasTenantAccess, Tenant } from '@/lib/tenant'
import prisma from '@/lib/prisma'

export type TenantUser = {
  id: bigint
  email: string
  name: string
  role: string
}

/**
 * Wrap API route with tenant authentication
 */
export async function withTenantAuth(
  req: NextRequest,
  handler: (tenant: Tenant, user: TenantUser, membership: any) => Promise<NextResponse>
) {
  try {
    // Get tenant
    const tenant = await resolveTenant(req)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    // Get user session
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check membership
    const membership = await prisma.tenantMember.findUnique({
      where: {
        tenantId_userId: {
          tenantId: tenant.id,
          userId: BigInt(session.user.id)
        }
      }
    })
    
    if (!membership) {
      return NextResponse.json({ error: 'Access denied to this tenant' }, { status: 403 })
    }
    
    const user: TenantUser = {
      id: BigInt(session.user.id),
      email: session.user.email!,
      name: session.user.name!,
      role: membership.role
    }
    
    return handler(tenant, user, membership)
  } catch (error) {
    console.error('withTenantAuth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Require specific tenant roles
 */
export function requireTenantRole(allowedRoles: string[]) {
  return async (
    req: NextRequest,
    handler: (tenant: Tenant, user: TenantUser) => Promise<NextResponse>
  ) => {
    return withTenantAuth(req, async (tenant, user, membership) => {
      if (!allowedRoles.includes(membership.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        )
      }
      return handler(tenant, user)
    })
  }
}
```

### Step 5: Create Tenant Management API

Create `app/api/tenants/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Create new tenant
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const { name, slug, subdomain } = await req.json()
  
  // Validate slug/subdomain availability
  const existing = await prisma.tenant.findFirst({
    where: {
      OR: [
        { slug },
        { subdomain }
      ]
    }
  })
  
  if (existing) {
    return NextResponse.json(
      { error: 'Slug or subdomain already taken' },
      { status: 409 }
    )
  }
  
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name,
      slug,
      subdomain,
      status: 'TRIAL',
      plan: 'FREE',
      members: {
        create: {
          userId: BigInt(session.user.id),
          role: 'OWNER',
          status: 'ACTIVE',
          joinedAt: new Date()
        }
      }
    }
  })
  
  // Set as user's current tenant
  await prisma.user.update({
    where: { id: BigInt(session.user.id) },
    data: { currentTenantId: tenant.id }
  })
  
  return NextResponse.json({ tenant }, { status: 201 })
}

// Get user's tenants
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const memberships = await prisma.tenantMember.findMany({
    where: {
      userId: BigInt(session.user.id)
    },
    include: {
      tenant: {
        select: {
          id: true,
          slug: true,
          name: true,
          subdomain: true,
          logo: true,
          primaryColor: true,
          status: true,
          plan: true,
        }
      }
    }
  })
  
  return NextResponse.json({
    tenants: memberships.map(m => ({
      ...m.tenant,
      role: m.role,
      joinedAt: m.joinedAt
    }))
  })
}
```

### Step 6: Create Tenant Switcher Component

Create `components/tenant/TenantSwitcher.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, Check, Plus } from 'lucide-react'

export function TenantSwitcher() {
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [currentTenant, setCurrentTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchTenants()
  }, [])
  
  async function fetchTenants() {
    try {
      const res = await fetch('/api/tenants')
      const data = await res.json()
      setTenants(data.tenants || [])
      
      // Get current tenant from URL or session
      const host = window.location.host
      const subdomain = host.split('.')[0]
      const current = data.tenants.find((t: any) => t.subdomain === subdomain)
      setCurrentTenant(current || data.tenants[0])
    } catch (error) {
      console.error('Failed to fetch tenants:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function switchTenant(tenantId: string) {
    try {
      await fetch('/api/user/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId })
      })
      
      // Redirect to tenant subdomain
      const tenant = tenants.find(t => t.id === tenantId)
      if (tenant) {
        window.location.href = `http://${tenant.subdomain}.${window.location.host.split('.').slice(1).join('.')}`
      }
    } catch (error) {
      console.error('Failed to switch tenant:', error)
    }
  }
  
  if (loading) return null
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">{currentTenant?.name || 'Select Tenant'}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Your Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => switchTenant(tenant.id)}
            className="flex items-center justify-between"
          >
            <span>{tenant.name}</span>
            {currentTenant?.id === tenant.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/create-tenant')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Step 7: Update Auth to Support currentTenantId

Add to `lib/auth.ts` session callback:

```typescript
async session({ session, token }) {
  if (token && session.user) {
    session.user.id = token.id as string
    session.user.role = token.role as string
    session.user.email = token.email as string
    session.user.name = token.name as string
    session.user.currentTenantId = token.currentTenantId as string // ADD THIS
  }
  return session
}
```

---

## 📱 UI Components to Build

### 1. Tenant Selection Page (`/select-tenant`)
- List user's tenants
- Create new tenant button
- Switch tenant functionality

### 2. Create Tenant Page (`/create-tenant`)
- Form: Name, Slug, Subdomain
- Validation for unique slug/subdomain
- Auto-create owner membership

### 3. Tenant Settings Page (`/settings/tenant`)
- Branding: Logo, Colors
- General: Name, Timezone, Currency
- Billing: Plan, Subscription status
- Members: Invite, manage roles

### 4. Super Admin Dashboard (`/super-admin`)
- List all tenants
- Tenant stats
- Suspend/activate tenants
- View usage metrics

---

## 🔒 Security Checklist

- [ ] All tenant-scoped queries include `tenantId` filter
- [ ] Middleware validates tenant access
- [ ] API routes use `withTenantAuth` wrapper
- [ ] User can only access tenants they're members of
- [ ] Super admin routes protected
- [ ] Tenant data completely isolated
- [ ] Audit logs for sensitive operations

---

## 🧪 Testing Plan

### 1. Create Multiple Tenants
```bash
# Test tenant creation
curl -X POST http://localhost:3001/api/tenants \
  -H "Content-Type: application/json" \
  -d '{"name":"Company A","slug":"company-a","subdomain":"companya"}'
```

### 2. Test Subdomain Access
- Visit `http://companya.localhost:3001`
- Should load Company A's data only

### 3. Test Tenant Switching
- Login as user
- Switch between tenants
- Verify data isolation

### 4. Test Role Permissions
- Create users with different roles
- Test OWNER, ADMIN, MANAGER, MEMBER, VIEWER permissions

---

## 📊 Migration Strategy

### For Existing Data

```sql
-- 1. Add default tenant
INSERT INTO "Tenant" (id, slug, name, subdomain, status, plan)
VALUES ('default-tenant', 'default', 'Default Organization', 'default', 'ACTIVE', 'FREE');

-- 2. Migrate existing users to default tenant
INSERT INTO "TenantMember" (id, "tenantId", "userId", role, status, "joinedAt", "createdAt", "updatedAt")
SELECT 
  gen_random_uuid(),
  'default-tenant',
  id,
  'OWNER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
FROM users;

-- 3. Update existing events with tenantId
UPDATE "Event" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;

-- 4. Update other tenant-scoped tables
UPDATE "Registration" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
UPDATE "Order" SET "tenantId" = 'default-tenant' WHERE "tenantId" IS NULL;
-- ... repeat for all tenant-scoped tables
```

---

## 🎯 Next Steps

1. **Review** this implementation guide
2. **Backup** your database
3. **Apply** schema changes (Step 2)
4. **Create** middleware (Step 3)
5. **Build** tenant management UI
6. **Test** thoroughly
7. **Deploy** gradually

---

## 📞 Support

If you encounter issues:
1. Check lint errors are only about missing schema fields
2. Ensure Prisma client is regenerated after schema changes
3. Verify middleware is correctly configured
4. Test with simple tenant first

Ready to proceed with implementation? Let me know which step you'd like to start with!
