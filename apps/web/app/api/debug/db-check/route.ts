import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Count all events
        const totalEvents = await prisma.event.count()

        // 2. Get first 5 events with minimal fields, ignoring all filters/tenants
        const sampleEvents = await prisma.event.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                tenantId: true,
                status: true,
                eventMode: true
            }
        })

        // 3. Check what tenants exist
        const tenants = await prisma.tenant.findMany({
            select: { id: true, name: true, slug: true }
        })

        return NextResponse.json({
            message: 'Direct DB Check',
            totalEventsInDb: totalEvents,
            sampleEvents,
            tenants
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
