import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma, { Prisma } from '@/lib/prisma'

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

    // Get analytics data using raw SQL queries
    const [
      totalEventsResult,
      totalCompaniesResult,
      totalUsersResult,
      totalRegistrationsResult,
      totalRevenueResult,
      topEventsResult,
      registrationsByMonthResult
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM events WHERE ${whereTenant}`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM tenants`, // Tenants count is global usually, or restricted? Keep global for now or 1 for tenant.
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM users`, // Users count might be global
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations r JOIN events e ON r.event_id = e.id WHERE ${whereTenantEvents} AND r.status = 'APPROVED'`,
      prisma.$queryRaw`
        SELECT COALESCE(SUM(r.price_inr), 0)::int as revenue 
        FROM registrations r 
        JOIN events e ON r.event_id = e.id 
        WHERE ${whereTenantEvents} AND r.status = 'APPROVED'
      `,
      prisma.$queryRaw`
        SELECT 
          e.id::text,
          e.name,
          e.starts_at as "startDate",
          e.ends_at as "endDate",
          e.status,
          e.event_manager_email as "adminEmail",
          COALESCE(e.expected_attendees, 0)::int as seats,
          COALESCE(t.name, 'Unknown Company') as "companyName",
          (SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'APPROVED') as registrations,
          (SELECT COUNT(*)::int FROM rsvp_responses rr WHERE rr.event_id = e.id) as rsvps,
          COALESCE(e.price_inr, 0)::int as price,
          (SELECT COALESCE(SUM(r.price_inr), 0)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'APPROVED') as revenue
        FROM events e
        LEFT JOIN tenants t ON e.tenant_id = t.id
        WHERE ${whereTenantEvents}
        ORDER BY (SELECT COUNT(*)::int FROM registrations r WHERE r.event_id = e.id AND r.status = 'APPROVED') DESC
        LIMIT 10
      `,
      prisma.$queryRaw`
        SELECT 
          TO_CHAR(r.created_at, 'Mon YYYY') as month,
          COUNT(*)::int as count
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE r.created_at >= NOW() - INTERVAL '6 months' 
          AND ${whereTenantEvents} 
          AND r.status = 'APPROVED'
        GROUP BY TO_CHAR(r.created_at, 'Mon YYYY'), DATE_TRUNC('month', r.created_at)
        ORDER BY DATE_TRUNC('month', r.created_at)
      `
    ])

    const totalEvents = (totalEventsResult as any)[0]?.count || 0
    const totalCompanies = (totalCompaniesResult as any)[0]?.count || 0
    const totalUsers = (totalUsersResult as any)[0]?.count || 0
    const totalRegistrations = (totalRegistrationsResult as any)[0]?.count || 0
    const totalRevenue = (totalRevenueResult as any)[0]?.revenue || 0
    const topEvents = topEventsResult as any[]
    const registrationsByMonth = registrationsByMonthResult as any[]

    // Calculate some derived metrics
    // const totalRevenue = topEvents.reduce((sum, event) => sum + (event.revenue || 0), 0) // Removed incorrect sum
    const averageAttendance = totalEvents > 0 ? Math.round((totalRegistrations / totalEvents) * 100) : 0

    // Mock growth percentages (in a real app, you'd calculate these from historical data)
    const trends = {
      eventsGrowth: Math.floor(Math.random() * 20) + 5, // 5-25%
      registrationsGrowth: Math.floor(Math.random() * 30) + 10, // 10-40%
      revenueGrowth: Math.floor(Math.random() * 25) + 5 // 5-30%
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
        rating: (4 + Math.random()).toFixed(1) // Mock rating as per request since no table exists
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
