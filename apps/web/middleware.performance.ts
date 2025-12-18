/**
 * Performance Middleware
 * Handles compression, caching headers, and response optimization
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    const { pathname } = request.nextUrl

    // Add performance headers
    response.headers.set('X-Response-Time', Date.now().toString())

    // API Routes - Aggressive caching with stale-while-revalidate
    if (pathname.startsWith('/api/')) {
        // Don't cache mutations
        if (request.method !== 'GET') {
            response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
            return response
        }

        // Cache GET requests
        const cacheControl = getCacheControl(pathname)
        response.headers.set('Cache-Control', cacheControl)
        response.headers.set('CDN-Cache-Control', cacheControl)
        response.headers.set('Vercel-CDN-Cache-Control', cacheControl)

        return response
    }

    // Static assets - Long-term caching
    if (
        pathname.startsWith('/_next/static/') ||
        pathname.startsWith('/images/') ||
        pathname.startsWith('/fonts/') ||
        pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|avif|ico|woff|woff2|ttf|eot)$/)
    ) {
        response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
        return response
    }

    // HTML pages - Short cache with revalidation
    if (pathname.match(/\.(html|htm)$/) || !pathname.includes('.')) {
        response.headers.set(
            'Cache-Control',
            'public, s-maxage=60, stale-while-revalidate=120'
        )
    }

    return response
}

/**
 * Get cache control header based on API endpoint
 */
function getCacheControl(pathname: string): string {
    // Events list - cache for 1 minute, serve stale for 2 minutes
    if (pathname.match(/\/api\/events$/)) {
        return 'public, s-maxage=60, stale-while-revalidate=120'
    }

    // Single event - cache for 5 minutes, serve stale for 10 minutes
    if (pathname.match(/\/api\/events\/\d+$/)) {
        return 'public, s-maxage=300, stale-while-revalidate=600'
    }

    // Registrations - cache for 30 seconds (more dynamic)
    if (pathname.includes('/registrations')) {
        return 'public, s-maxage=30, stale-while-revalidate=60'
    }

    // Users list - cache for 2 minutes
    if (pathname.includes('/users')) {
        return 'public, s-maxage=120, stale-while-revalidate=240'
    }

    // Dashboard stats - cache for 1 minute
    if (pathname.includes('/dashboard') || pathname.includes('/stats')) {
        return 'public, s-maxage=60, stale-while-revalidate=120'
    }

    // Default - cache for 30 seconds
    return 'public, s-maxage=30, stale-while-revalidate=60'
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/webpack-hmr (hot module reload)
         * - _next/static (static files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/webpack-hmr|favicon.ico).*)',
    ],
}
