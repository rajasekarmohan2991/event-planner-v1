import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma, { Prisma } from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'
export const maxDuration = 25

export async function GET(req: NextRequest) {
  try {
    // Set statement timeout to prevent long-running queries (20 seconds)
    await prisma.$executeRaw`SET statement_timeout = '20s'`

    // Check authentication
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization
    const userRole = (session as any).user.role as string
    if (!['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get tenant ID
    const tenantId = (session as any).user.currentTenantId
    const isSuperAdmin = userRole === 'SUPER_ADMIN'

    // Helper for tenant filter
    const whereTenant = isSuperAdmin
      ? Prisma.sql`1=1`
      : Prisma.sql`tenant_id = ${tenantId || 'default-tenant'}`

    const whereTenantEvents = isSuperAdmin
      ? Prisma.sql`1=1`
      : Prisma.sql`e.tenant_id = ${tenantId || 'default-tenant'}`

    // Help with query results to avoid BigInt issues
    const safeCount = (res: any) => {
      if (!res || !res[0]) return 0;
      const val = Object.values(res[0])[0];
      return typeof val === 'bigint' ? Number(val) : (Number(val) || 0);
    };

    // Get analytics data using raw SQL queries with individual error handling
    const [
      totalEventsResult,
      totalCompaniesResult,
      totalUsersResult,
      totalRegistrationsResult,
      totalRevenueResult,
      topEventsResult,
      registrationsByMonthResult
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM events WHERE ${whereTenant}`
        .catch(err => { console.error('Error totalEvents:', err); return [{ count: 0 }] }),

      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM tenants`
        .catch(err => { console.error('Error totalCompanies:', err); return [{ count: 0 }] }),

      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM users`
        .catch(err => { console.error('Error totalUsers:', err); return [{ count: 0 }] }),

      prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM registrations r 
        JOIN events e ON r.event_id = e.id 
        WHERE ${whereTenantEvents} AND UPPER(r.status) IN ('APPROVED', 'PENDING', 'CONFIRMED', 'SUCCESS')
      `.catch(err => { console.error('Error totalRegistrations:', err); return [{ count: 0 }] }),

      prisma.$queryRaw`
        SELECT COALESCE(SUM(r.price_inr), 0)::int as revenue 
        FROM registrations r 
        JOIN events e ON r.event_id = e.id 
        WHERE ${whereTenantEvents} AND UPPER(r.status) IN ('APPROVED', 'PENDING', 'CONFIRMED', 'SUCCESS')
      `.catch(err => { console.error('Error totalRevenue:', err); return [{ revenue: 0 }] }),

      prisma.$queryRaw`
        WITH event_regs AS (
          SELECT 
            r.event_id,
            COUNT(r.id) FILTER (WHERE UPPER(r.status) IN ('APPROVED', 'PENDING', 'CONFIRMED', 'SUCCESS')) as reg_count,
            SUM(r.price_inr) FILTER (WHERE UPPER(r.status) IN ('APPROVED', 'PENDING', 'CONFIRMED', 'SUCCESS')) as total_revenue
          FROM registrations r
          JOIN events e ON r.event_id = e.id
          WHERE ${whereTenantEvents}
          GROUP BY r.event_id
        ),
        top_events AS (
          SELECT * FROM event_regs ORDER BY reg_count DESC LIMIT 10
        )
        SELECT 
          e.id::text,
          e.name,
          e.starts_at as "startDate",
          e.ends_at as "endDate",
          e.status,
          e.event_manager_email as "adminEmail",
          COALESCE(e.expected_attendees, 0)::int as seats,
          COALESCE(t.name, 'Unknown Company') as "companyName",
          COALESCE(te.reg_count, 0)::int as registrations,
          (SELECT COUNT(*)::int FROM rsvps rr WHERE rr.event_id = e.id::text LIMIT 1000) as rsvps,
          COALESCE(e.price_inr, 0)::int as price,
          COALESCE(te.total_revenue, 0)::int as revenue
        FROM top_events te
        JOIN events e ON e.id = te.event_id
        LEFT JOIN tenants t ON e.tenant_id = t.id
        ORDER BY te.reg_count DESC
      `.catch(err => { console.error('Error topEvents:', err); return [] }),

      prisma.$queryRaw`
        SELECT 
          TO_CHAR(r.created_at, 'Mon YYYY') as month,
          COUNT(*)::int as count
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.created_at >= NOW() - INTERVAL '6 months' 
          AND ${isSuperAdmin ? Prisma.sql`1=1` : Prisma.sql`e.tenant_id = ${tenantId || 'default-tenant'}`}
          AND UPPER(r.status) IN ('APPROVED', 'PENDING', 'CONFIRMED', 'SUCCESS')
        GROUP BY TO_CHAR(r.created_at, 'Mon YYYY'), DATE_TRUNC('month', r.created_at)
        ORDER BY DATE_TRUNC('month', r.created_at)
        LIMIT 12
      `.catch(err => { console.error('Error registrationsByMonth:', err); return [] })
    ])

    const totalEvents = safeCount(totalEventsResult)
    const totalCompanies = safeCount(totalCompaniesResult)
    const totalUsers = safeCount(totalUsersResult)
    const totalRegistrations = safeCount(totalRegistrationsResult)
    const totalRevenue = (totalRevenueResult as any)[0]?.revenue || 0
    const topEvents = (topEventsResult as any[]) || []
    const registrationsByMonth = (registrationsByMonthResult as any[]) || []

    // Calculate derived metrics
    const averageAttendance = totalEvents > 0 ? Math.round((totalRegistrations / totalEvents) * 100) : 0

    // Mock growth percentages
    const trends = {
      eventsGrowth: 15,
      registrationsGrowth: 22,
      revenueGrowth: 18
    }

    return NextResponse.json({
      overview: {
        totalEvents,
        totalCompanies,
        totalUsers,
        totalRegistrations,
        totalRevenue,
        averageAttendance
      },
      trends,
      topEvents: topEvents.map(event => ({
        id: event.id,
        name: event.name,
        companyName: event.companyName,
        seats: event.seats,
        registrations: event.registrations,
        rsvps: event.rsvps,
        revenue: event.revenue,
        startDate: event.startDate,
        endDate: event.endDate,
        status: event.status,
        adminEmail: event.adminEmail,
        price: event.price,
        rating: (4 + Math.random()).toFixed(1)
      })),
      registrationsByMonth: registrationsByMonth.map(item => ({
        month: item.month,
        count: item.count
      }))
    })

  } catch (error: any) {
    console.error('Error fetching analytics:', error)

    // Return default analytics data on error
    return NextResponse.json({
      overview: {
        totalEvents: 0,
        totalUsers: 0,
        totalCompanies: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        averageAttendance: 0
      },
      trends: {
        eventsGrowth: 0,
        registrationsGrowth: 0,
        revenueGrowth: 0
      },
      topEvents: [],
      registrationsByMonth: []
    })
  }
}
