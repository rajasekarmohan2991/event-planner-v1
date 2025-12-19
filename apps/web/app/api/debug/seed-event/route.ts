import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Find a valid tenant to assign the event to
        const tenant = await prisma.tenant.findFirst()

        if (!tenant) {
            return NextResponse.json({ error: 'No tenants found. Cannot create event.' }, { status: 400 })
        }

        // 2. Create a demo event
        const demoEvent = await prisma.event.create({
            data: {
                name: "🚀 Super Admin Demo Event",
                slug: `demo-event-${Date.now()}`,
                status: "PUBLISHED",
                eventMode: "HYBRID",
                description: "This is a test event created to verify Super Admin visibility.",
                startsAt: new Date(Date.now() + 86400000), // Tomorrow
                endsAt: new Date(Date.now() + 172800000), // Day after tomorrow
                timeZone: "UTC",
                city: "New York",
                venue: "Tech Plaza",
                address: "123 Innovation Way",
                currency: "USD",
                tenantId: tenant.id,
                visibility: "PUBLIC",
                maxCapacity: 100,
                expectedAttendees: 50,
                priceInr: 0,
            }
        })

        return NextResponse.json({
            message: '✅ Demo Event Created Successfully!',
            event: demoEvent,
            assignedToTenant: {
                id: tenant.id,
                name: tenant.name
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: 'Failed to create demo event',
            details: error.message
        }, { status: 500 })
    }
}
