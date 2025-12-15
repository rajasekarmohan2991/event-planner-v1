import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * RBAC Multi-Tenant Middleware
 * Handles:
 * 1. Authentication checks
 * 2. Tenant identification (subdomain/path/session)
 * 3. Permission-based access control
 * 4. Tenant assignment enforcement
 */

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/login',
  '/auth/register',
  '/auth/error',
  '/auth/verify-email',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/company/register',
  '/company/login',
  '/api/auth',
  '/api/company/register',
  '/api/company/login',
  '/_next',
  '/favicon.ico',
  '/api/health',
]

// Routes that require authentication but no tenant
const AUTH_ONLY_ROUTES = [
  '/select-tenant',
  '/create-tenant',
  '/api/tenants',
  '/api/user/switch-tenant',
  '/api/admin',
  '/admin',
  '/dashboard',
  '/profile',
  '/settings',
  '/unauthorized',
  '/auth/unauthorized',
]

// Super admin only routes
const SUPER_ADMIN_ROUTES = [
  '/super-admin',
  '/api/super-admin',
]

// Role-based module access (matches lib/permissions.ts)
const MODULE_ACCESS: Record<string, string[]> = {
  '/dashboard': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'VIEWER', 'USER'],
  '/events': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'EXHIBITOR_MANAGER', 'ATTENDEE', 'VIEWER'],
  '/registrations': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'SUPPORT_STAFF', 'ATTENDEE', 'VIEWER'],
  '/exhibitors': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'EXHIBITOR_MANAGER', 'SUPPORT_STAFF', 'VIEWER'],
  '/design': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER'],
  '/communicate': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER'],
  '/reports': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN', 'EXHIBITOR_MANAGER', 'VIEWER'],
  '/eventday': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'SUPPORT_STAFF'],
  '/venues': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER'],
  '/settings': ['SUPER_ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER', 'VENUE_MANAGER', 'FINANCE_ADMIN', 'MARKETING_ADMIN'],
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthOnlyRoute(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.some(route => pathname.startsWith(route))
}

function isSuperAdminRoute(pathname: string): boolean {
  return SUPER_ADMIN_ROUTES.some(route => pathname.startsWith(route))
}

function getModuleFromPath(pathname: string): string | null {
  // Extract module from path like /events/123 -> /events
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return null
  return `/${parts[0]}`
}

function hasModuleAccess(tenantRole: string | null, module: string): boolean {
  const allowedRoles = MODULE_ACCESS[module]
  if (!allowedRoles) return true // Unknown module, allow for now
  if (!tenantRole) return false
  return allowedRoles.includes(tenantRole)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip all API routes except auth
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/auth/login')) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: !!(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https://'))
    })
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Skip public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Get authentication token (robust to cookie name/prefix differences)
  const isHttps = req.nextUrl.protocol === 'https:' || (req.headers.get('x-forwarded-proto') || '').includes('https') || !!(process.env.NEXTAUTH_URL && process.env.NEXTAUTH_URL.startsWith('https://'))
  let token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: isHttps,
  })
  if (!token) {
    // Fallback to explicit default cookie names
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps, cookieName: 'next-auth.session-token' })
  }
  if (!token) {
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET, secureCookie: isHttps, cookieName: '__Secure-next-auth.session-token' })
  }

  // Redirect to login if not authenticated
  if (!token) {
    const signInUrl = new URL('/auth/login', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Check super admin routes
  if (isSuperAdminRoute(pathname)) {
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Auth-only routes (no tenant required)
  if (isAuthOnlyRoute(pathname)) {
    return NextResponse.next()
  }

  // Extract tenant from subdomain or path
  let tenantSlug: string | null = null

  // Method 1: Subdomain (e.g., company1.eventplanner.com)
  const host = req.headers.get('host') || ''
  const subdomain = host.split('.')[0]
  if (subdomain && subdomain !== 'localhost' && subdomain !== 'www' && !subdomain.includes(':')) {
    tenantSlug = subdomain
  }

  // Method 2: Path-based (e.g., /t/company1/...)
  const pathMatch = pathname.match(/^\/t\/([^\/]+)(?:\/.*)?$/)
  if (pathMatch) {
    tenantSlug = decodeURIComponent(pathMatch[1])
  }

  // Method 3: User's current tenant from session
  if (!tenantSlug && token.currentTenantId) {
    // User has a current tenant set, allow access
    tenantSlug = 'current' // Placeholder, actual tenant is in session
  }

  // If no tenant identified and not on tenant selection page or auth-only route, redirect
  if (!tenantSlug && !isAuthOnlyRoute(pathname)) {
    return NextResponse.redirect(new URL('/select-tenant', req.url))
  }

  // Check module-level permissions based on tenant role (skip for auth-only routes)
  if (!isAuthOnlyRoute(pathname)) {
    const module = getModuleFromPath(pathname)
    if (module) {
      // Get tenant role from token (you'll need to add this to JWT)
      const tenantRole = (token as any).tenantRole as string | null

      // Super admins bypass module checks
      if (token.role !== 'SUPER_ADMIN') {
        if (!hasModuleAccess(tenantRole, module)) {
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    }
  }

  // Add tenant context to headers for downstream use
  const response = NextResponse.next()
  if (tenantSlug && tenantSlug !== 'current') {
    response.headers.set('x-tenant-slug', tenantSlug)
  }
  if (token.currentTenantId) {
    response.headers.set('x-tenant-id', token.currentTenantId as string)
  }

  // Add user role for Java API (for super admin detection)
  if (token.role) {
    response.headers.set('x-user-role', token.role as string)
  }

  // Add tenant role for permission checks
  if ((token as any).tenantRole) {
    response.headers.set('x-tenant-role', (token as any).tenantRole as string)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
