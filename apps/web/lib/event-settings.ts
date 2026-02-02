import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'

export async function getEventSettings(eventId: string, key: string) {
    try {
        // Ensure schema exists first?? No, performance.
        // We'll rely on global ensureSchema calls or manual fixes.
        // Or we catch error and retry.

        // Note: BigInt handling
        const eventIdBig = BigInt(eventId)

        // PostgreSQL JSONB extraction: settings->'key'
        const result = await prisma.$queryRawUnsafe(`
      SELECT settings->'${key}' as data FROM events WHERE id = $1
    `, Number(eventId)) as any[]

        return result[0]?.data || {}
    } catch (e: any) {
        console.error(`Failed to get settings [${key}]:`, e.message)
        if (e.message.includes('column')) {
            await ensureSchema()
            return {} // Return empty on first fail, next load will work
        }
        return {}
    }
}

export async function updateEventSettings(eventId: string, key: string, data: any) {
    try {
        // Postgres jsonb_set(target, path, new_value, create_missing)
        // path is text[]: array['general']

        await prisma.$executeRawUnsafe(`
      UPDATE events 
      SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), ARRAY[$1], $2::jsonb, true)
      WHERE id = $3
    `, key, JSON.stringify(data), Number(eventId))

        return true
    } catch (e: any) {
        console.error(`Failed to save settings [${key}]:`, e.message)
        if (e.message.includes('column')) {
            await ensureSchema()
            // Retry once
            try {
                await prisma.$executeRawUnsafe(`
                UPDATE events 
                SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), ARRAY[$1], $2::jsonb, true)
                WHERE id = $3
            `, key, JSON.stringify(data), Number(eventId))
                return true
            } catch (retryE) {
                console.error('Retry failed:', retryE)
                return false
            }
        }
        return false
    }
}
