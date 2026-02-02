// API Route Caching Utilities
// Use these helpers to add smart caching to your API routes

export const CacheConfig = {
    // Static data that rarely changes
    STATIC: {
        revalidate: 3600, // 1 hour
        tags: ['static'],
    },

    // Semi-static data (lookups, settings)
    SEMI_STATIC: {
        revalidate: 300, // 5 minutes
        tags: ['semi-static'],
    },

    // Dynamic data that changes frequently
    DYNAMIC: {
        revalidate: 60, // 1 minute
        tags: ['dynamic'],
    },

    // Real-time data (no caching)
    REALTIME: {
        revalidate: 0,
        tags: ['realtime'],
    },
}

// Helper to add cache headers to responses
export function withCache(response: Response, config: { revalidate: number; tags: string[] }) {
    const headers = new Headers(response.headers)

    if (config.revalidate > 0) {
        headers.set('Cache-Control', `s-maxage=${config.revalidate}, stale-while-revalidate`)
        headers.set('CDN-Cache-Control', `max-age=${config.revalidate}`)
    } else {
        headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    }

    if (config.tags.length > 0) {
        headers.set('Cache-Tag', config.tags.join(','))
    }

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    })
}

// Example usage in API routes:
/*
export async function GET(req: NextRequest) {
  const data = await fetchData()
  const response = NextResponse.json(data)
  return withCache(response, CacheConfig.SEMI_STATIC)
}
*/
