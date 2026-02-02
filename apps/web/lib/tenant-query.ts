/**
 * Tenant-Scoped Query Helpers
 * CRITICAL SECURITY: Ensures all database queries are filtered by tenantId
 * to prevent data leakage between tenants
 */

import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import prisma from './prisma'

/**
 * Get current user's tenant ID from session
 * Throws error if no tenant assigned (security measure)
 */
export async function getCurrentTenantId(): Promise<string> {
  const session = await getServerSession(authOptions as any) as any
  
  if (!session || !session.user) {
    throw new Error('Unauthorized: No session found')
  }
  
  const currentTenantId = (session.user as any).currentTenantId
  
  if (!currentTenantId) {
    throw new Error('No tenant assigned: User must select a tenant first')
  }
  
  return currentTenantId
}

/**
 * Get current user's tenant ID (returns null if not assigned)
 * Use this for optional tenant context
 */
export async function getCurrentTenantIdOrNull(): Promise<string | null> {
  try {
    return await getCurrentTenantId()
  } catch {
    return null
  }
}

/**
 * Check if user is Super Admin
 * Super admins can bypass tenant filtering
 */
export async function isSuperAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions as any) as any
  return session?.user?.role === 'SUPER_ADMIN'
}

/**
 * Get tenant filter for queries
 * Returns { tenantId: string } for regular users
 * Returns {} for super admins (no filter)
 */
export async function getTenantFilter(): Promise<{ tenantId?: string }> {
  const isAdmin = await isSuperAdmin()
  
  if (isAdmin) {
    return {} // Super admin sees all tenants
  }
  
  const tenantId = await getCurrentTenantId()
  return { tenantId }
}

/**
 * Tenant-scoped Prisma client wrapper
 * Automatically adds tenantId filter to all queries
 */
export async function getTenantPrisma() {
  const tenantId = await getCurrentTenantId()
  
  return {
    // Events are managed by Java API, not Prisma
    // event: {
    //   findMany: (args?: any) => prisma.event.findMany({
    //     ...args,
    //     where: { ...args?.where, tenantId }
    //   }),
    //   findUnique: (args: any) => prisma.event.findUnique({
    //     ...args,
    //     where: { ...args.where, tenantId }
    //   }),
    //   findFirst: (args?: any) => prisma.event.findFirst({
    //     ...args,
    //     where: { ...args?.where, tenantId }
    //   }),
    //   create: (args: any) => prisma.event.create({
    //     ...args,
    //     data: { ...args.data, tenantId }
    //   }),
    //   update: (args: any) => prisma.event.update({
    //     ...args,
    //     where: { ...args.where, tenantId }
    //   }),
    //   delete: (args: any) => prisma.event.delete({
    //     ...args,
    //     where: { ...args.where, tenantId }
    //   }),
    //   count: (args?: any) => prisma.event.count({
    //     ...args,
    //     where: { ...args?.where, tenantId }
    //   }),
    // },
    
    // Registrations
    registration: {
      findMany: (args?: any) => prisma.registration.findMany({
        ...args,
        where: { ...args?.where, tenantId }
      }),
      findUnique: (args: any) => prisma.registration.findUnique({
        ...args,
        where: { ...args.where, tenantId }
      }),
      create: (args: any) => prisma.registration.create({
        ...args,
        data: { ...args.data, tenantId }
      }),
      update: (args: any) => prisma.registration.update({
        ...args,
        where: { ...args.where, tenantId }
      }),
      count: (args?: any) => prisma.registration.count({
        ...args,
        where: { ...args?.where, tenantId }
      }),
    },
    
    // Add more models as needed
  }
}

/**
 * Verify user has access to a specific tenant resource
 * Throws error if resource doesn't belong to user's tenant
 */
export async function verifyTenantAccess(resourceTenantId: string): Promise<void> {
  const isAdmin = await isSuperAdmin()
  
  if (isAdmin) {
    return // Super admin can access any tenant
  }
  
  const currentTenantId = await getCurrentTenantId()
  
  if (resourceTenantId !== currentTenantId) {
    throw new Error('Access denied: Resource belongs to different tenant')
  }
}

/**
 * Get user's tenant membership and role
 */
export async function getCurrentTenantMembership() {
  const session = await getServerSession(authOptions as any) as any
  
  if (!session || !session.user) {
    throw new Error('Unauthorized')
  }
  
  const currentTenantId = (session.user as any).currentTenantId
  
  if (!currentTenantId) {
    throw new Error('No tenant assigned')
  }
  
  const membership = await prisma.tenantMember.findUnique({
    where: {
      tenantId_userId: {
        tenantId: currentTenantId,
        userId: BigInt(session.user.id)
      }
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
          subdomain: true,
          status: true,
          plan: true
        }
      }
    }
  })
  
  if (!membership) {
    throw new Error('Tenant membership not found')
  }
  
  return membership
}

/**
 * Check if user has specific tenant role
 */
export async function hasRole(allowedRoles: string[]): Promise<boolean> {
  try {
    const membership = await getCurrentTenantMembership()
    return allowedRoles.includes(membership.role)
  } catch {
    return false
  }
}

/**
 * Require specific tenant role (throws error if not authorized)
 */
export async function requireRole(allowedRoles: string[]): Promise<void> {
  const hasAccess = await hasRole(allowedRoles)
  
  if (!hasAccess) {
    throw new Error(`Access denied: Requires one of roles: ${allowedRoles.join(', ')}`)
  }
}
