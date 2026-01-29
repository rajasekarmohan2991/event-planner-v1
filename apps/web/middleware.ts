import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname
    const userRole = token?.role as string

    // Redirect authenticated users from landing page to dashboard
    if (path === '/' && token) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

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
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Always allow public pages
        if (path === '/') {
          return true
        }

        // Always allow auth pages
        if (path.startsWith('/auth/')) {
          return true
        }

        // Always allow legal pages (terms, privacy)
        if (path.startsWith('/terms') || path.startsWith('/privacy')) {
          return true
        }

        // Require token for all other pages
        return !!token
      },
    },
    pages: {
      signIn: '/auth/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - / (landing page - public)
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder
     * - auth pages (handled by authorized callback)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|.*\\..*|site\\.webmanifest).*)',
  ],
}
