/**
 * Tenant Middleware
 * 
 * Resolves tenant context from:
 * 1. X-Tenant-ID header
 * 2. Subdomain (company.eventplanner.com)
 * 3. Path (/t/company-slug)
 * 4. User's current tenant from session
 * 
 * Attaches tenant to request context for downstream use
 */

import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const DEFAULT_TENANT_ID = 'default-tenant'

export interface TenantContext {
  id: string
  slug: string
  name: string
  subdomain: string
  status: string
  plan: string
}

/**
 * Extract subdomain from host
 * Example: company1.eventplanner.com -> company1
 */
function extractSubdomain(host: string): string | null {
  const parts = host.split('.')
  // Ignore localhost, www, admin subdomains
  if (parts.length >= 3 && !['www', 'admin', 'localhost'].includes(parts[0])) {
    return parts[0]
  }
  return null
}

/**
 * Extract tenant slug from path
 * Example: /t/company-slug/events -> company-slug
 */
function extractTenantFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/t\/([^\/]+)/)
  return match ? match[1] : null
}

/**
 * Resolve tenant from multiple sources
 */
export async function resolveTenant(req: NextRequest): Promise<TenantContext | null> {
  try {
    // Priority 1: X-Tenant-ID header (explicit override)
    const tenantIdHeader = req.headers.get('x-tenant-id')
    if (tenantIdHeader) {
      const tenant = await fetchTenantById(tenantIdHeader)
      if (tenant) return tenant
    }
    
    // Priority 2: Subdomain
    const host = req.headers.get('host') || ''
    const subdomain = extractSubdomain(host)
    if (subdomain) {
      const tenant = await fetchTenantBySubdomain(subdomain)
      if (tenant) return tenant
    }
    
    // Priority 3: Path-based (/t/slug)
    const pathSlug = extractTenantFromPath(req.nextUrl.pathname)
    if (pathSlug) {
      const tenant = await fetchTenantBySlug(pathSlug)
      if (tenant) return tenant
    }
    
    // Priority 4: User's current tenant from session
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token?.currentTenantId) {
      const tenant = await fetchTenantById(token.currentTenantId as string)
      if (tenant) return tenant
    }
    
    // Fallback: Default tenant
    return await fetchTenantById(DEFAULT_TENANT_ID)
  } catch (error) {
    console.error('Error resolving tenant:', error)
    return null
  }
}

/**
 * Fetch tenant by ID from database
 */
async function fetchTenantById(id: string): Promise<TenantContext | null> {
  try {
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/internal/tenants/${id}`, {
      cache: 'no-store',
      headers: {
        'X-Internal-Request': 'true'
      }
    })
    
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Error fetching tenant ${id}:`, error)
    return null
  }
}

/**
 * Fetch tenant by subdomain
 */
async function fetchTenantBySubdomain(subdomain: string): Promise<TenantContext | null> {
  try {
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/internal/tenants/by-subdomain/${subdomain}`, {
      cache: 'no-store',
      headers: {
        'X-Internal-Request': 'true'
      }
    })
    
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Error fetching tenant by subdomain ${subdomain}:`, error)
    return null
  }
}

/**
 * Fetch tenant by slug
 */
async function fetchTenantBySlug(slug: string): Promise<TenantContext | null> {
  try {
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
    const response = await fetch(`${apiUrl}/api/internal/tenants/by-slug/${slug}`, {
      cache: 'no-store',
      headers: {
        'X-Internal-Request': 'true'
      }
    })
    
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error(`Error fetching tenant by slug ${slug}:`, error)
    return null
  }
}

/**
 * Tenant middleware function
 * Attaches tenant context to request headers
 */
export async function tenantMiddleware(req: NextRequest): Promise<NextResponse> {
  const tenant = await resolveTenant(req)
  
  // If no tenant found and not on public routes, return error
  const publicRoutes = ['/api/auth', '/auth', '/login', '/register', '/company/register', '/company/login', '/_next', '/static', '/favicon.ico']
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  
  if (!tenant && !isPublicRoute) {
    return NextResponse.json(
      { error: 'Tenant not found', message: 'Unable to resolve tenant context' },
      { status: 404 }
    )
  }
  
  // Create response with tenant context in headers
  const response = NextResponse.next()
  
  if (tenant) {
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-slug', tenant.slug)
    response.headers.set('x-tenant-name', tenant.name)
    response.headers.set('x-tenant-status', tenant.status)
    response.headers.set('x-tenant-plan', tenant.plan)
  }
  
  return response
}

/**
 * Get tenant context from request headers (set by middleware)
 */
export function getTenantFromHeaders(headers: Headers): TenantContext | null {
  const id = headers.get('x-tenant-id')
  const slug = headers.get('x-tenant-slug')
  const name = headers.get('x-tenant-name')
  const status = headers.get('x-tenant-status')
  const plan = headers.get('x-tenant-plan')
  
  if (!id || !slug) return null
  
  return {
    id,
    slug,
    name: name || '',
    subdomain: slug,
    status: status || 'ACTIVE',
    plan: plan || 'FREE'
  }
}
