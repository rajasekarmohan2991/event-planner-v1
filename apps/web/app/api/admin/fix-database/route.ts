import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST() {
    try {
        console.log('🔧 [FIX-DATABASE] Starting database check and fix...')

        // 1. Test database connection
        let connectionTest
        try {
            connectionTest = await prisma.$queryRaw`SELECT 1 as test`
            console.log('✅ [FIX-DATABASE] Database connection: OK')
        } catch (connError: any) {
            console.error('❌ [FIX-DATABASE] Database connection FAILED:', connError.message)
            return NextResponse.json({
                success: false,
                error: 'Database connection failed',
                details: connError.message
            }, { status: 500 })
        }

        // 2. Check events table
        const eventsCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM events
    `
        const totalEvents = eventsCount[0]?.count || 0
        console.log(`📊 [FIX-DATABASE] Total events in database: ${totalEvents}`)

        // 3. Check published events
        const publishedCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM events WHERE status = 'PUBLISHED'
    `
        const totalPublished = publishedCount[0]?.count || 0
        console.log(`📊 [FIX-DATABASE] Published events: ${totalPublished}`)

        // 4. Check tenants
        const tenantsCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM tenants
    `
        const totalTenants = tenantsCount[0]?.count || 0
        console.log(`📊 [FIX-DATABASE] Total tenants: ${totalTenants}`)

        // 5. If database is empty, seed it
        let seeded = false
        if (totalEvents === 0) {
            console.log('🌱 [FIX-DATABASE] Database is empty. Seeding...')

            // Create or find tenant
            let tenant = await prisma.tenant.findFirst()
            if (!tenant) {
                tenant = await prisma.tenant.create({
                    data: {
                        id: 'seed-tenant-' + Date.now(),
                        name: 'Event Masters Inc',
                        slug: 'event-masters',
                        email: 'admin@eventmasters.com',
                    }
                })
                console.log('✅ [FIX-DATABASE] Created tenant:', tenant.name)
            }

            // Create sample event
            const sampleEvent = await prisma.event.create({
                data: {
                    name: 'Grand Launch Event 2026',
                    description: 'A spectacular event showcasing the future of event planning.',
                    startsAt: new Date(Date.now() + 86400000), // Tomorrow
                    endsAt: new Date(Date.now() + 172800000), // Day after tomorrow
                    venue: 'Grand Convention Center',
                    city: 'Chennai',
                    status: 'PUBLISHED',
                    category: 'Technology',
                    eventMode: 'OFFLINE',
                    expectedAttendees: 500,
                    priceInr: 999,
                    tenantId: tenant.id
                }
            })
            console.log('✅ [FIX-DATABASE] Created sample event:', sampleEvent.name)
            seeded = true
        }

        // 6. Get sample events for verification
        const sampleEvents = await prisma.$queryRaw<any[]>`
      SELECT id, name, status, city 
      FROM events 
      ORDER BY created_at DESC 
      LIMIT 5
    `

        return NextResponse.json({
            success: true,
            message: 'Database check completed',
            stats: {
                totalEvents,
                publishedEvents: totalPublished,
                totalTenants,
                seeded,
                connectionStatus: 'OK'
            },
            sampleEvents: sampleEvents.map(e => ({
                id: e.id,
                name: e.name,
                status: e.status,
                city: e.city
            }))
        })
    } catch (error: any) {
        console.error('❌ [FIX-DATABASE] Error:', error)
        return NextResponse.json({
            success: false,
            error: 'Database fix failed',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}
