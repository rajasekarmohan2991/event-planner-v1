import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // 1. Find or Create Tenant
        let tenant = await prisma.tenant.findFirst()
        if (!tenant) {
            tenant = await prisma.tenant.create({
                data: {
                    id: 'seed-tenant-' + Date.now(),
                    name: 'Event Masters Inc',
                    slug: 'event-masters',
                    email: 'admin@eventmasters.com',
                    // Add other required fields if any (usually optional or default)
                }
            })
        }

        // 2. Create Dummy Event
        const event = await prisma.event.create({
            data: {
                name: 'Grand Launch Event 2026',
                description: 'A spectacular event showcasing the future of event planning.',
                startsAt: new Date(Date.now() + 86400000), // Tomorrow
                endsAt: new Date(Date.now() + 172800000), // Day after tomorrow
                venue: 'Grand Convention Center',
                city: 'New York',
                status: 'PUBLISHED',
                category: 'Technology',
                eventMode: 'OFFLINE',
                expectedAttendees: 500,
                priceInr: 999,
                tenantId: tenant.id
            }
        })

        return NextResponse.json({
            status: 'success',
            message: 'Seeded 1 event',
            event
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message
        }, { status: 500 })
    }
}
