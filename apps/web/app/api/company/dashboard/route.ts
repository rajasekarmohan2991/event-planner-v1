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

    // Fetch company events from Java API
    const eventsRes = await fetch(`${process.env.INTERNAL_API_BASE_URL || 'http://localhost:8081'}/api/events`, {
      headers: {
        'x-tenant-id': tenantId,
      }
    })
    
    const eventsData = eventsRes.ok ? await eventsRes.json() : []
    const events = (eventsData.content || eventsData || []).slice(0, 5)

    // Fetch company members count
    const membersCount = await prisma.tenantMember.count({
      where: {
        tenantId: tenantId,
        status: 'ACTIVE'
      }
    })

    // Fetch registration counts per event (top 5) and total
    const eventIds = events.map((e: any) => parseInt(e.id)).filter((id: number) => !isNaN(id))
    let totalRegistrations = 0
    let registrationCounts: Record<number, number> = {}
    
    if (eventIds.length > 0) {
      try {
        const rows = await prisma.$queryRaw<any[]>`
          SELECT event_id, COUNT(*)::int as count
          FROM registrations
          WHERE event_id = ANY(${eventIds}::bigint[])
          GROUP BY event_id
        `
        registrationCounts = rows.reduce((acc: any, r: any) => {
          acc[Number(r.event_id)] = Number(r.count) || 0
          return acc
        }, {})
        totalRegistrations = Object.values(registrationCounts).reduce((a, b) => a + b, 0)
      } catch (e) {
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
        id: e.id,
        name: e.name,
        start_date: e.startsAt || e.startDate,
        end_date: e.endsAt || e.endDate,
        status: e.status,
        location: e.location || e.city || 'Online',
        priceInr: e.priceInr || e.price_inr || 0,
        capacity: e.expectedAttendees || e.capacity || e.seats || e.maxCapacity || 0,
        _count: { registrations: registrationCounts[parseInt(e.id)] || 0 }
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
