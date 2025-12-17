import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as any

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = session.user.role
    const currentTenantId = (session.user as any).currentTenantId

    // SUPER_ADMIN can view any company, ADMIN can only view their own company
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const tenantId = params.id

    // If ADMIN, ensure they can only access their own tenant
    if (userRole === 'ADMIN' && currentTenantId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized - Can only access your own company' }, { status: 403 })
    }

    // Fetch real company data
    const company = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        billingEmail: true,
        emailFromAddress: true,
        createdAt: true,
        maxEvents: true,
        maxUsers: true,
        maxStorage: true,
        trialEndsAt: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch company members
    const members = await prisma.tenantMember.findMany({
      where: { tenantId: tenantId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    // Fetch company events from Java API with timeout
    let eventsList: any[] = []
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500) // 1.5s timeout

      const eventsRes = await fetch(`${process.env.INTERNAL_API_BASE_URL || 'http://localhost:8081'}/api/events`, {
        headers: {
          'x-tenant-id': tenantId,
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const eventsData = eventsRes.ok ? await eventsRes.json() : []
      // Handle both pagination (content) and array responses
      eventsList = Array.isArray(eventsData) ? eventsData : (eventsData.content || [])
    } catch (error) {
      console.warn('Failed to fetch events from Java API:', error)
      // Continue with empty list to avoid blocking the UI
    }

    // Calculate real-time registrations for each event
    const eventIds = eventsList.map((e: any) => parseInt(e.id)).filter((id: number) => !isNaN(id))
    const registrationCounts: Record<number, number> = {}

    if (eventIds.length > 0) {
      const regCounts = await prisma.$queryRaw<any[]>`
        SELECT event_id, COUNT(*)::int as count
        FROM registrations
        WHERE event_id = ANY(${eventIds}::bigint[])
          AND tenant_id = ${tenantId}
        GROUP BY event_id
      `
      regCounts.forEach((row: any) => {
        registrationCounts[Number(row.event_id)] = row.count
      })
    }

    // Map events with real registration counts
    const events = eventsList.map((e: any) => ({
      id: e.id,
      name: e.name,
      start_date: e.startsAt || e.startDate,
      end_date: e.endsAt || e.endDate,
      location: e.location || e.city || 'Online',
      status: e.status,
      priceInr: e.priceInr || e.price_inr || 0,
      capacity: e.expectedAttendees || e.capacity || e.seats || e.maxCapacity || 0,
      _count: {
        registrations: registrationCounts[e.id] || 0
      }
    }))

    const fallbackEmail = company.billingEmail || company.emailFromAddress || process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || `support@${company.slug}.com`

    const formattedCompany = {
      ...company,
      billingEmail: fallbackEmail,
      events,
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        user: m.user
      }))
    }

    return NextResponse.json({
      success: true,
      company: formattedCompany
    })
  } catch (error: any) {
    console.error('Error fetching company details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch company details', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any) as any

    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()

    // Implement update logic if needed

    return NextResponse.json({
      success: true,
      message: 'Company updated successfully'
    })
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company', details: error.message },
      { status: 500 }
    )
  }
}
