/**
 * Universal Database Query Helper
 * 
 * This handles the schema inconsistency between production and local databases.
 * Production uses camelCase columns, local uses snake_case.
 */

import prisma from '@/lib/prisma'

/**
 * Execute a query with automatic fallback for column name variations
 */
export async function executeWithFallback<T = any>(
    primaryQuery: () => Promise<T>,
    fallbackQuery: () => Promise<T>,
    errorKeyword: string = 'does not exist'
): Promise<T> {
    try {
        return await primaryQuery()
    } catch (e: any) {
        if (e.message?.includes(errorKeyword)) {
            return await fallbackQuery()
        }
        throw e
    }
}

/**
 * Get event by ID - handles both id types (BigInt and String)
 */
export async function getEvent(eventId: string | bigint) {
    const id = typeof eventId === 'string' ? BigInt(eventId) : eventId

    const events = await prisma.$queryRaw`
    SELECT 
      id::text as id,
      name,
      tenant_id as "tenantId",
      starts_at as "startsAt",
      ends_at as "endsAt"
    FROM events 
    WHERE id = ${id}
    LIMIT 1
  ` as any[]

    return events[0] || null
}

/**
 * Serialize BigInt values to strings for JSON
 */
export function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) return obj
    if (typeof obj === 'bigint') return obj.toString()
    if (Array.isArray(obj)) return obj.map(serializeBigInt)
    if (typeof obj === 'object') {
        const serialized: any = {}
        for (const key in obj) {
            serialized[key] = serializeBigInt(obj[key])
        }
        return serialized
    }
    return obj
}
