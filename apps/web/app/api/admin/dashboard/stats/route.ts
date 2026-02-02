import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma, { Prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Helper to enforce timeouts on promises
function timeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      timer = setTimeout(() => {
        resolve(fallback)
      }, ms)
    })
  ]).finally(() => {
    if (timer) clearTimeout(timer)
  })
}

export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check (Fast)
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { user } = session as any
    const userRole = user.role as string

    if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get current date for upcoming events
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get tenant ID from session
    const tenantId = user.currentTenantId
    const isSuperAdmin = userRole === 'SUPER_ADMIN'

    // 2. Prepare Queries
    const whereTenant = isSuperAdmin
      ? Prisma.sql`1=1`
      : Prisma.sql`tenant_id = ${tenantId || 'default-tenant'}`

    const whereTenantORM = isSuperAdmin
      ? {}
      : { tenantId: tenantId || 'default-tenant' }


    // 3. Execute Parallel Fail-Safe Queries (Max 3s timeout)
    const [
      totalEvents,
      upcomingEvents,
      totalUsers,
      recentRegistrations,
      totalTickets,
      totalCompanies,
      rsvpStats
    ] = await Promise.all([
      // Total Events
      timeout(
        prisma.event.count({ where: whereTenantORM }).catch(() => 0),
        3000, 0
      ),
      // Upcoming Events
      timeout(
        prisma.event.count({
          where: { ...whereTenantORM, startsAt: { gte: now } }
        }).catch(() => 0),
        3000, 0
      ),
      // Users (Super Admin views all, others view tenant members)
      timeout(
        isSuperAdmin
          ? prisma.user.count().catch(() => 0)
          : prisma.tenantMember.count({ where: { tenantId } }).catch(() => 0),
        3000, 0
      ),
      // Recent Registrations
      timeout(
        prisma.$queryRaw`
                SELECT COUNT(*)::int as count 
                FROM registrations 
                WHERE created_at >= ${sevenDaysAgo} 
                AND ${isSuperAdmin ? Prisma.sql`1=1` : Prisma.sql`tenant_id = ${tenantId}`}
            `.then((res: any) => res[0]?.count || 0).catch(() => 0),
        3000, 0
      ),
      // Total Tickets
      timeout(
        prisma.$queryRaw`
                SELECT COALESCE(SUM(quantity), 0)::int as count 
                FROM tickets 
                WHERE ${isSuperAdmin ? Prisma.sql`1=1` : Prisma.sql`tenant_id = ${tenantId}`}
            `.then((res: any) => res[0]?.count || 0).catch(() => 0),
        3000, 0
      ),
      // Total Companies (Super Admin only)
      timeout(
        isSuperAdmin
          ? prisma.tenant.count().then(c => Math.max(0, c - 1)).catch(() => 0)
          : Promise.resolve(0),
        3000, 0
      ),
      // RSVP Stats
      timeout(
        prisma.rSVP.groupBy({
          by: ['status'],
          _count: { status: true },
          where: whereTenantORM
        }).then(groups => ({
          total: groups.reduce((acc, curr) => acc + curr._count.status, 0),
          going: groups.find(g => g.status === 'GOING')?._count.status || 0,
          interested: groups.find(g => g.status === 'INTERESTED')?._count.status || 0,
          notGoing: groups.find(g => g.status === 'NOT_GOING')?._count.status || 0,
        })).catch(() => ({ total: 0, going: 0, interested: 0, notGoing: 0 })),
        3000, { total: 0, going: 0, interested: 0, notGoing: 0 }
      )
    ])

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      totalUsers,
      recentRegistrations: Number(recentRegistrations),
      totalTickets,
      totalCompanies,
      rsvpStats
    })

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({
      totalEvents: 0,
      upcomingEvents: 0,
      totalUsers: 0,
      recentRegistrations: 0,
      totalTickets: 0,
      totalCompanies: 0,
      rsvpStats: { total: 0, going: 0, interested: 0, notGoing: 0 }
    })
  }
}
