/**
 * Optimized Database Query Utilities
 * Provides pre-optimized queries with proper indexing and field selection
 */

import prisma from './prisma'
import { cache, CacheKeys, CacheTTL } from './cache'

/**
 * Optimized Events Queries
 */
export const OptimizedEvents = {
    /**
     * Get events list with minimal fields (fast)
     */
    async getList(filters: {
        status?: string
        tenantId?: string
        search?: string
        limit?: number
        skip?: number
    } = {}) {
        const cacheKey = CacheKeys.events.list(filters)

        return cache.get(cacheKey, async () => {
            const { status, tenantId, search, limit = 50, skip = 0 } = filters

            const where: any = {}

            if (status) where.status = status
            if (tenantId) where.tenantId = tenantId
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { city: { contains: search, mode: 'insensitive' } }
                ]
            }

            const [events, total] = await Promise.all([
                prisma.event.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        startsAt: true,
                        endsAt: true,
                        city: true,
                        venue: true,
                        bannerUrl: true,
                        priceInr: true,
                        expectedAttendees: true
                    },
                    orderBy: { startsAt: 'desc' },
                    take: limit,
                    skip
                }),
                prisma.event.count({ where })
            ])

            return { events, total }
        }, CacheTTL.SHORT)
    },

    /**
     * Get single event with all details
     */
    async getById(id: bigint) {
        const cacheKey = CacheKeys.events.detail(String(id))

        return cache.get(cacheKey, async () => {
            return prisma.event.findUnique({
                where: { id },
                include: {
                    speakers: {
                        select: {
                            id: true,
                            name: true,
                            title: true,
                            photoUrl: true
                        }
                    }
                }
            })
        }, CacheTTL.MEDIUM)
    },

    /**
     * Get events count by status (dashboard)
     */
    async getCountsByStatus(tenantId?: string) {
        const cacheKey = `events:counts:${tenantId || 'all'}`

        return cache.get(cacheKey, async () => {
            const where = tenantId ? { tenantId } : {}

            return prisma.event.groupBy({
                by: ['status'],
                where,
                _count: { status: true }
            })
        }, CacheTTL.SHORT)
    }
}

/**
 * Optimized Registrations Queries
 */
export const OptimizedRegistrations = {
    /**
     * Get registrations for an event (minimal fields)
     */
    async getByEvent(eventId: bigint, limit = 100, skip = 0) {
        const cacheKey = CacheKeys.registrations.list(String(eventId))

        return cache.get(cacheKey, async () => {
            const [registrations, total] = await Promise.all([
                prisma.registration.findMany({
                    where: { eventId },
                    select: {
                        id: true,
                        email: true,
                        dataJson: true,
                        status: true,
                        createdAt: true,
                        checkInStatus: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip
                }),
                prisma.registration.count({ where: { eventId } })
            ])

            return { registrations, total }
        }, CacheTTL.SHORT)
    },

    /**
     * Get registration counts by status
     */
    async getCountsByStatus(eventId: bigint) {
        const cacheKey = `registrations:counts:${eventId}`

        return cache.get(cacheKey, async () => {
            return prisma.registration.groupBy({
                by: ['status'],
                where: { eventId },
                _count: { status: true }
            })
        }, CacheTTL.SHORT)
    }
}

/**
 * Optimized Users Queries
 */
export const OptimizedUsers = {
    /**
     * Get users list (minimal fields)
     */
    async getList(filters: {
        role?: string
        search?: string
        limit?: number
        skip?: number
    } = {}) {
        const cacheKey = CacheKeys.users.list(filters)

        return cache.get(cacheKey, async () => {
            const { role, search, limit = 50, skip = 0 } = filters

            const where: any = {}

            if (role) where.role = role
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            }

            const [users, total] = await Promise.all([
                prisma.user.findMany({
                    where,
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    skip
                }),
                prisma.user.count({ where })
            ])

            return { users, total }
        }, CacheTTL.MEDIUM)
    }
}

/**
 * Cache invalidation helpers
 */
export const InvalidateCache = {
    events: {
        all: () => cache.invalidatePattern(CacheKeys.events.all()),
        byId: (id: string) => cache.invalidate(CacheKeys.events.detail(id)),
        lists: () => cache.invalidatePattern('events:list:*')
    },
    registrations: {
        byEvent: (eventId: string) => cache.invalidatePattern(CacheKeys.registrations.byEvent(eventId)),
        all: () => cache.invalidatePattern('registrations:*')
    },
    users: {
        all: () => cache.invalidatePattern(CacheKeys.users.all()),
        lists: () => cache.invalidatePattern('users:list:*')
    }
}
