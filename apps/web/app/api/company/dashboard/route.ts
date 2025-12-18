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

    // Fetch real company data
    const company = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch company events directly from DB (bypassing legacy Java API)
    const events = await prisma.event.findMany({
      where: {
        tenantId: tenantId
      },
      orderBy: {
        startsAt: 'desc'
      },
      take: 5
    })

    // Fetch company members count
    const membersCount = await prisma.tenantMember.count({
      where: {
        tenantId: tenantId,
        status: 'ACTIVE'
      }
    })

    // Fetch registration counts per event (top 5) and total
    const eventIds = events.map((e: any) => e.id)
    let totalRegistrations = 0
    let registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      try {
        const counts = await prisma.registration.groupBy({
          by: ['eventId'],
          where: {
            eventId: {
              in: eventIds
            }
          },
          _count: {
            _all: true
          }
        })

        registrationCounts = counts.reduce((acc: any, c: any) => {
          acc[String(c.eventId)] = c._count._all
          return acc
        }, {})

        // Get total for ALL events (for stats)
        totalRegistrations = await prisma.registration.count({
          where: {
            // We can't easily filter by tenantId on registration if it's not populated, 
            // but we can filter by events belonging to tenant.
            eventId: {
              in: (await prisma.event.findMany({
                where: { tenantId: tenantId },
                select: { id: true }
              })).map(e => e.id)
            }
          }
        })
      } catch (e) {
        console.error('Error fetching registration stats:', e)
        registrationCounts = {}
        totalRegistrations = 0
      }
    }

    const dashboard = {
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan,
        status: company.status
      },
      events: events.map((e: any) => ({
        id: String(e.id),
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
        totalEvents: events.length,
        totalMembers: membersCount,
        totalRegistrations: totalRegistrations
      }
    }

    return NextResponse.json(dashboard)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}
