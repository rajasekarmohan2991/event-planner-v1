import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any

        if (!session?.user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const tenantId = session.user.currentTenantId

        // Create a sample event
        const event = await prisma.event.create({
            data: {
                name: 'Sample Conference 2025',
                description: 'A sample event created for testing purposes.',
                status: 'DRAFT',
                eventMode: 'IN_PERSON',
                startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
                endsAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),   // 1 week + 1 day
                venue: 'Sample Convention Center',
                city: 'Bangalore',
                address: '123 Tech Park, Whitefield',
                expectedAttendees: 500,
                priceInr: 1000,
                tenantId: tenantId || undefined,
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Sample event created successfully!',
            event: {
                id: String(event.id),
                name: event.name,
                status: event.status,
                tenantId: event.tenantId
            }
        })
    } catch (error: any) {
        console.error('Error creating sample event:', error)
        return NextResponse.json({
            error: error.message,
            details: error.toString()
        }, { status: 500 })
    }
}
