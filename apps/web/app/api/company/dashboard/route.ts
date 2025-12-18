import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const tenantId = (session.user as any).currentTenantId

    if (!tenantId) {
      return NextResponse.json({ error: 'No company associated with this user' }, { status: 400 })
    }

    // Parallel fetching for efficiency
    const [company, latestEvents, totalEvents, membersCount, totalRegistrations] = await Promise.all([
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          plan: true,
          status: true,
        }
      }),
      prisma.event.findMany({
        where: { tenantId: tenantId },
        orderBy: { startsAt: 'desc' },
        take: 5
      }),
      prisma.event.count({ where: { tenantId: tenantId } }),
      prisma.tenantMember.count({ where: { tenantId: tenantId, status: 'ACTIVE' } }),
      prisma.registration.count({ where: { tenantId: tenantId } }) // Optimized: count direct tenant registrations
    ])

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Get counts for the top 5 events only to save DB load
    const eventIds = latestEvents.map(e => e.id)
    const registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const counts = await prisma.registration.groupBy({
        by: ['eventId'],
        where: { eventId: { in: eventIds } },
        _count: { eventId: true }
      })
      counts.forEach(c => {
        registrationCounts[String(c.eventId)] = c._count.eventId
      })
    }

    const dashboard = {
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan,
        status: company.status
      },
      events: latestEvents.map((e) => ({
        id: String(e.id), // String ID for frontend
        name: e.name,
        start_date: e.startsAt,
        end_date: e.endsAt,
        status: e.status,
        location: e.venue || e.city || 'Online',
        priceInr: e.priceInr || 0,
        capacity: e.expectedAttendees || 0,
        _count: { registrations: registrationCounts[String(e.id)] || 0 }
      })),
      stats: {
        totalEvents,
        totalMembers: membersCount,
        totalRegistrations
      }
    }

    return NextResponse.json(dashboard)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
