import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

    // Polyfill for BigInt serialization
    (BigInt.prototype as any).toJSON = function () {
        return this.toString()
    }

// GET - List all events (platform-wide for super admin)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all events with tenant info
        const events = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                startsAt: true,
                endsAt: true,
                status: true,
                tenantId: true
            },
            orderBy: {
                startsAt: 'desc'
            },
            take: 100 // Limit to 100 most recent events
        })

        // Get tenant names for each event
        const eventsWithTenant = await Promise.all(
            events.map(async (event) => {
                let tenantName = null
                if (event.tenantId) {
                    const tenant = await prisma.tenant.findUnique({
                        where: { id: event.tenantId },
                        select: { name: true }
                    })
                    tenantName = tenant?.name
                }

                return {
                    id: event.id.toString(),
                    name: event.name,
                    startsAt: event.startsAt,
                    endsAt: event.endsAt,
                    status: event.status,
                    tenantId: event.tenantId,
                    tenantName
                }
            })
        )

        return NextResponse.json({ events: eventsWithTenant })
    } catch (error: any) {
        console.error('Error fetching events:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
