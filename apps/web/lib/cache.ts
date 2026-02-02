/**
 * High-Performance Caching Utility
 * Provides in-memory caching with TTL and automatic invalidation
 */

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number
}

class PerformanceCache {
    private cache: Map<string, CacheEntry<any>> = new Map()
    private maxSize: number = 1000 // Prevent memory leaks

    /**
     * Get cached data or execute function and cache result
     */
    async get<T>(
        key: string,
        fetcher: () => Promise<T>,
        ttl: number = 60000 // 1 minute default
    ): Promise<T> {
        const cached = this.cache.get(key)
        const now = Date.now()

        // Return cached data if valid
        if (cached && (now - cached.timestamp) < cached.ttl) {
            console.log(`✅ Cache HIT: ${key}`)
            return cached.data as T
        }

        // Fetch fresh data
        console.log(`❌ Cache MISS: ${key} - Fetching...`)
        const data = await fetcher()

        // Store in cache
        this.set(key, data, ttl)

        return data
    }

    /**
     * Set cache entry
     */
    set<T>(key: string, data: T, ttl: number = 60000): void {
        // Enforce max size
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        })
    }

    /**
     * Invalidate specific cache key
     */
    invalidate(key: string): void {
        this.cache.delete(key)
        console.log(`🗑️ Cache invalidated: ${key}`)
    }

    /**
     * Invalidate all keys matching pattern
     */
    invalidatePattern(pattern: string): void {
        const regex = new RegExp(pattern)
        let count = 0

        for (const key of this.cache.keys()) {
            if (regex.test(key)) {
                this.cache.delete(key)
                count++
            }
        }

        console.log(`🗑️ Invalidated ${count} cache entries matching: ${pattern}`)
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear()
        console.log('🗑️ Cache cleared')
    }

    /**
     * Get cache statistics
     */
    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            keys: Array.from(this.cache.keys())
        }
    }
}

// Singleton instance
export const cache = new PerformanceCache()

/**
 * Cache key generators for consistent naming
 */
export const CacheKeys = {
    events: {
        list: (filters?: any) => `events:list:${JSON.stringify(filters || {})}`,
        detail: (id: string) => `events:detail:${id}`,
        all: () => 'events:*'
    },
    users: {
        list: (filters?: any) => `users:list:${JSON.stringify(filters || {})}`,
        detail: (id: string) => `users:detail:${id}`,
        all: () => 'users:*'
    },
    registrations: {
        list: (eventId: string) => `registrations:list:${eventId}`,
        detail: (id: string) => `registrations:detail:${id}`,
        byEvent: (eventId: string) => `registrations:event:${eventId}:*`
    }
}

/**
 * Cache TTL presets (in milliseconds)
 */
export const CacheTTL = {
    SHORT: 30000,      // 30 seconds - for frequently changing data
    MEDIUM: 300000,    // 5 minutes - for moderate changes
    LONG: 3600000,     // 1 hour - for rarely changing data
    VERY_LONG: 86400000 // 24 hours - for static data
}

/**
 * Decorator for caching function results
 */
export function Cached(ttl: number = CacheTTL.MEDIUM) {
    return function (
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value

        descriptor.value = async function (...args: any[]) {
            const cacheKey = `${propertyKey}:${JSON.stringify(args)}`
            return cache.get(cacheKey, () => originalMethod.apply(this, args), ttl)
        }

        return descriptor
    }
}
