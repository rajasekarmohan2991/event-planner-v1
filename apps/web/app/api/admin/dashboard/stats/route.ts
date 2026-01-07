import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization - SUPER_ADMIN, ADMIN, and EVENT_MANAGER
    const userRole = (session as any).user.role as string
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
    const tenantId = (session as any).user.currentTenantId

    console.log(`Fetching Dashboard Stats for Role=${userRole}, Tenant=${tenantId}`)

    let totalEvents = 0
    let upcomingEvents = 0
    let totalUsers = 0
    let recentRegistrations = 0
    let totalCompanies = 0

    if (userRole === 'SUPER_ADMIN') {
      // SUPER_ADMIN gets global stats
      // Use raw SQL for more reliable counts
      const [
        eventsResult,
        upcomingResult,
        usersCount,
        tenantsCount,
        regResult
      ] = await Promise.all([
        prisma.$queryRaw`SELECT COUNT(*)::int as count FROM events`.catch(() => [{count: 0}]),
        prisma.$queryRaw`SELECT COUNT(*)::int as count FROM events WHERE starts_at >= ${now}`.catch(() => [{count: 0}]),
        prisma.user.count().catch(() => 0),
        prisma.tenant.count().catch(() => 0),
        prisma.$queryRaw`
          SELECT COUNT(*)::int as count 
          FROM registrations 
          WHERE created_at >= ${sevenDaysAgo}
        `.catch(() => [{count: 0}])
      ]) as any[]

      const regCount = (regResult[0]?.count || 0)

      totalEvents = eventsResult[0]?.count || 0
      upcomingEvents = upcomingResult[0]?.count || 0
      totalUsers = usersCount
      recentRegistrations = Number(regCount)

      // Exclude self (Super Admin tenant) if count > 0
      totalCompanies = Math.max(0, tenantsCount - 1)

    } else {
      // Others get tenant-scoped stats
      const targetTenantId = tenantId || 'default-tenant'

      const [
        eventsCount,
        upcomingCount,
        usersCount,
        regResult
      ] = await Promise.all([
        prisma.event.count({ where: { tenantId: targetTenantId } }),
        prisma.event.count({ where: { tenantId: targetTenantId, startsAt: { gte: now } } }),
        prisma.tenantMember.count({ where: { tenantId: targetTenantId } }),
        prisma.$queryRaw`
          SELECT COUNT(*)::int as count 
          FROM registrations 
          WHERE tenant_id = ${targetTenantId} AND created_at >= ${sevenDaysAgo}
        `
      ])

      const regCount = (regResult as any)[0]?.count || 0

      totalEvents = eventsCount
      upcomingEvents = upcomingCount
      totalUsers = usersCount
      recentRegistrations = Number(regCount)
      totalCompanies = 0 // Regular admins don't manage companies
    }

    // Fetch RSVP stats (Global or Tenant scoped)
    const rsvpWhere = userRole === 'SUPER_ADMIN' ? {} : { tenantId: tenantId || 'default-tenant' }
    const rsvpGroups = await prisma.rSVP.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      where: rsvpWhere
    })

    const rsvpStats = {
      total: rsvpGroups.reduce((acc: number, curr: any) => acc + curr._count.status, 0),
      going: rsvpGroups.find((g: any) => g.status === 'GOING')?._count.status || 0,
      interested: rsvpGroups.find((g: any) => g.status === 'INTERESTED')?._count.status || 0,
      notGoing: rsvpGroups.find((g: any) => g.status === 'NOT_GOING')?._count.status || 0,
    }

    console.log('Stats computed:', {
      totalEvents,
      upcomingEvents,
      totalUsers,
      totalCompanies,
      rsvpStats
    })

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      totalUsers,
      recentRegistrations,
      totalTickets: 0, // Will implement when tickets table is properly set up
      totalCompanies, // Added for super admin dashboard
      rsvpStats
    })

  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error)

    // Return safe defaults on error
    return NextResponse.json({
      totalEvents: 0,
      upcomingEvents: 0,
      totalUsers: 0,
      recentRegistrations: 0,
      totalTickets: 0,
    })
  }
}
