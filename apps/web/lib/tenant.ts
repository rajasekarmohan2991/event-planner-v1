import { headers } from 'next/headers'
import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type TenantContext = {
  slug: string
  tenantId: string
}

export type Tenant = {
  id: string
  slug: string
  name: string
  subdomain: string
  domain?: string | null
  logo?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  status: string
  plan: string
}

/**
 * Extract subdomain from host
 * company1.eventplanner.com -> company1
 */
export function extractSubdomain(host: string): string | null {
  const parts = host.split('.')
  // Ignore www and admin subdomains
  if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'admin') {
    return parts[0]
  }
  return null
}

/**
 * Get tenant slug from request headers (set by middleware)
 */
export function getTenantSlugFromHeaders(): string | null {
  try {
    const h = headers()
    const slug = h.get('x-tenant-slug')
    return slug || null
  } catch {
    return null
  }
}

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantIdFromHeaders(): string | null {
  try {
    const h = headers()
    const tenantId = h.get('x-tenant-id')
    return tenantId || null
  } catch {
    return null
  }
}

export function getTenantSlugFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/t\/([^\/]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

/**
 * Resolve tenant from multiple sources
 * Priority: 1) Subdomain 2) Path 3) Header 4) User's current tenant
 */
export async function resolveTenant(req: NextRequest): Promise<Tenant | null> {
  // Method 1: Subdomain (Primary)
  const host = req.headers.get('host') || ''
  const subdomain = extractSubdomain(host)
  
  if (subdomain) {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        domain: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        plan: true,
      }
    })
    if (tenant) return tenant as Tenant
  }
  
  // Method 2: Path-based (/t/company1)
  const pathMatch = req.nextUrl.pathname.match(/^\/t\/([^\/]+)/)
  if (pathMatch) {
    const slug = pathMatch[1]
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        domain: true,
        logo: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        plan: true,
      }
    })
    if (tenant) return tenant as Tenant
  }
  
  // Method 3: User's current tenant (from session)
  try {
    const session = await getServerSession(authOptions as any)
    const currentTenantId = (session as any)?.user?.currentTenantId
    if (currentTenantId) {
      const tenant = await prisma.tenant.findUnique({
        where: { id: currentTenantId },
        select: {
          id: true,
          slug: true,
          name: true,
          subdomain: true,
          domain: true,
          logo: true,
          primaryColor: true,
          secondaryColor: true,
          status: true,
          plan: true,
        }
      })
      if (tenant) return tenant as Tenant
    }
  } catch (error) {
    console.error('Error resolving tenant from session:', error)
  }
  
  return null
}

export function resolveTenantSlug(reqLike?: { headers: Headers; nextUrl?: URL; url?: string } | NextRequest): string | null {
  // 1) header (set by middleware)
  const slugFromHeader = reqLike ? (reqLike as any).headers?.get?.('x-tenant-slug') : getTenantSlugFromHeaders()
  if (slugFromHeader) return slugFromHeader

  // 2) path fallback
  const pathname = reqLike && 'nextUrl' in (reqLike as any) ? (reqLike as any).nextUrl?.pathname : undefined
  if (pathname) return getTenantSlugFromPath(pathname)

  return null
}

export async function getTenantIdBySlug(slug: string, allowCreate = false): Promise<string | null> {
  if (!slug) return null
  const existing = await prisma.tenant.findUnique({ where: { slug } })
  if (existing) return existing.id
  if (!allowCreate) return null
  const created = await prisma.tenant.create({ 
    data: { 
      slug, 
      name: slug,
      subdomain: slug // Required field
    } 
  })
  return created.id
}

// Resolve tenant context (slug + id) from a NextRequest
export async function getTenantContext(req: NextRequest): Promise<{ slug: string; tenantId: string } | null> {
  const slug = resolveTenantSlug(req)
  if (!slug) return null
  const tenantId = await getTenantIdBySlug(slug)
  if (!tenantId) return null
  return { slug, tenantId }
}

/**
 * Check if a user has one of the allowed roles in a tenant
 */
export async function hasTenantRole(userIdInput: string | number | bigint, tenantId: string, allowedRoles: string[]): Promise<boolean> {
  let userId: bigint
  try {
    userId = typeof userIdInput === 'bigint' ? userIdInput : BigInt(userIdInput)
  } catch {
    return false
  }
  const member = await prisma.tenantMember.findFirst({ where: { userId, tenantId } })
  if (!member) return false
  return allowedRoles.includes(String(member.role).toLowerCase()) || allowedRoles.includes(String(member.role))
}

/**
 * Check if user has access to tenant
 */
export async function hasTenantAccess(userId: bigint, tenantId: string): Promise<boolean> {
  const member = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId
      }
    }
  })
  return member !== null
}

/**
 * Get user's tenants
 */
export async function getUserTenants(userId: bigint) {
  const memberships = await prisma.tenantMember.findMany({
    where: {
      userId,
      status: 'ACTIVE'
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
    },
    orderBy: {
      createdAt: 'asc'
    }
  })
  
  return memberships.map(m => ({
    ...m.tenant,
    role: m.role,
    joinedAt: m.joinedAt
  }))
}

/**
 * Check if user is tenant owner or admin
 */
export async function isTenantAdmin(userId: bigint, tenantId: string): Promise<boolean> {
  return hasTenantRole(userId, tenantId, ['OWNER', 'ADMIN', 'owner', 'admin'])
}

/**
 * Check if user is super admin
 */
export async function isSuperAdmin(userId: bigint): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  })
  return user?.role === 'SUPER_ADMIN'
}
