import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Debug endpoint to check database state
 * GET /api/debug/events
 */
export async function GET() {
    try {
        // Count total events
        const totalEvents = await prisma.event.count()

        // Get events by status
        const eventsByStatus = await prisma.event.groupBy({
            by: ['status'],
            _count: { status: true }
        })

        // Get sample events
        const sampleEvents = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                tenantId: true,
                createdAt: true
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        })

        // Get tenants
        const tenants = await prisma.tenant.findMany({
            select: {
                id: true,
                name: true,
                slug: true
            },
            take: 5
        })

        return NextResponse.json({
            totalEvents,
            eventsByStatus,
            sampleEvents: sampleEvents.map(e => ({
                ...e,
                id: String(e.id)
            })),
            tenants,
            message: totalEvents === 0
                ? '⚠️ No events in database. Create one to test!'
                : `✅ Found ${totalEvents} events`
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            message: '❌ Database query failed'
        }, { status: 500 })
    }
}
