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
      // Use Prisma Client methods where possible for better reliability
      const [
        eventsCount, 
        upcomingCount, 
        usersCount, 
        tenantsCount
      ] = await Promise.all([
        prisma.event.count(),
        prisma.event.count({ where: { startsAt: { gte: now } } }),
        prisma.user.count(),
        prisma.tenant.count()
      ])
      
      // Use raw query for registrations since we want to be safe with table/model names
      const regResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM registrations 
        WHERE created_at >= ${sevenDaysAgo}
      `
      const regCount = (regResult as any)[0]?.count || 0

      totalEvents = eventsCount
      upcomingEvents = upcomingCount
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
        usersCount
      ] = await Promise.all([
        prisma.event.count({ where: { tenantId: targetTenantId } }),
        prisma.event.count({ where: { tenantId: targetTenantId, startsAt: { gte: now } } }),
        prisma.tenantMember.count({ where: { tenantId: targetTenantId } })
      ])
      
      const regResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count 
        FROM registrations 
        WHERE tenant_id = ${targetTenantId} AND created_at >= ${sevenDaysAgo}
      `
      const regCount = (regResult as any)[0]?.count || 0
      
      totalEvents = eventsCount
      upcomingEvents = upcomingCount
      totalUsers = usersCount
      recentRegistrations = Number(regCount)
      totalCompanies = 0 // Regular admins don't manage companies
    }

    console.log('Stats computed:', { 
      totalEvents, 
      upcomingEvents, 
      totalUsers, 
      totalCompanies 
    })

    return NextResponse.json({
      totalEvents,
      upcomingEvents,
      totalUsers,
      recentRegistrations,
      totalTickets: 0, // Will implement when tickets table is properly set up
      totalCompanies // Added for super admin dashboard
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
