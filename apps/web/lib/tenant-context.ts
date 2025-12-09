/**
 * Tenant Context Utilities
 * 
 * Helper functions to enforce tenant isolation in all queries
 */

import { headers } from 'next/headers'
import { NextRequest } from 'next/server'

const DEFAULT_TENANT_ID = 'default-tenant'

export interface TenantContext {
  id: string
  slug: string
  name: string
  status: string
  plan: string
}

/**
 * Get tenant ID from request headers (set by middleware)
 */
export function getTenantId(): string {
  try {
    const headersList = headers()
    return headersList.get('x-tenant-id') || DEFAULT_TENANT_ID
  } catch {
    return DEFAULT_TENANT_ID
  }
}

/**
 * Get full tenant context from headers
 */
export function getTenantContext(): TenantContext | null {
  try {
    const headersList = headers()
    const id = headersList.get('x-tenant-id')
    const slug = headersList.get('x-tenant-slug')
    const name = headersList.get('x-tenant-name')
    const status = headersList.get('x-tenant-status')
    const plan = headersList.get('x-tenant-plan')
    
    if (!id) return null
    
    return {
      id,
      slug: slug || '',
      name: name || '',
      status: status || 'ACTIVE',
      plan: plan || 'FREE'
    }
  } catch {
    return null
  }
}

/**
 * Get tenant ID from NextRequest (for API routes)
 */
export function getTenantIdFromRequest(req: NextRequest): string {
  return req.headers.get('x-tenant-id') || DEFAULT_TENANT_ID
}

/**
 * Create tenant filter for Prisma queries
 * Usage: where: { ...tenantFilter(), other_conditions }
 */
export function tenantFilter(tenantId?: string) {
  const id = tenantId || getTenantId()
  return { tenant_id: id }
}

/**
 * Create tenant filter with additional conditions
 * Usage: where: tenantWhere({ status: 'ACTIVE' })
 */
export function tenantWhere<T extends Record<string, any>>(conditions: T, tenantId?: string): T & { tenant_id: string } {
  const id = tenantId || getTenantId()
  return {
    ...conditions,
    tenant_id: id
  }
}

/**
 * Create data object with tenant_id for insertions
 * Usage: data: tenantData({ name: 'Event', ... })
 */
export function tenantData<T extends Record<string, any>>(data: T, tenantId?: string): T & { tenant_id: string } {
  const id = tenantId || getTenantId()
  return {
    ...data,
    tenant_id: id
  }
}

/**
 * Check if user is super admin (bypasses tenant filtering)
 */
export function isSuperAdmin(userRole?: string): boolean {
  return userRole === 'SUPER_ADMIN'
}

/**
 * Get tenant-aware query options
 * Automatically adds tenant filter unless user is super admin
 */
export function getTenantQueryOptions(userRole?: string, tenantId?: string) {
  if (isSuperAdmin(userRole)) {
    return {} // Super admin sees all data
  }
  
  return {
    where: tenantFilter(tenantId)
  }
}
