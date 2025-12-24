import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Allow public routes
    if (
      path.startsWith('/auth/') ||
      path.startsWith('/api/auth/') ||
      path.startsWith('/_next/') ||
      path.startsWith('/static/') ||
      path === '/favicon.ico'
    ) {
      return NextResponse.next()
    }

    // Redirect to login if not authenticated
    if (!token) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('callbackUrl', req.url)
      return NextResponse.redirect(loginUrl)
    }

    const userRole = token.role as string

    // Admin routes - require SUPER_ADMIN, ADMIN, or EVENT_MANAGER
    if (path.startsWith('/admin') || path.startsWith('/(admin)')) {
      const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER']
      if (!allowedRoles.includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Super admin routes - require SUPER_ADMIN only
    if (path.startsWith('/super-admin')) {
      if (userRole !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
