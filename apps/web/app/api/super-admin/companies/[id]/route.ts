import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Polyfill for BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

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

    // Fetch company events directly from Prisma
    let eventsList: any[] = []
    try {
      eventsList = await prisma.event.findMany({
        where: { tenantId: tenantId },
        orderBy: { startsAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to fetch events from Prisma:', error)
      eventsList = []
    }

    // Calculate real-time registrations for each event
    // Convert BigInt IDs to numbers/strings safely
    const eventIds = eventsList.map((e: any) => e.id)
    const registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      // Prisma groupBy is safer for aggregations
      const regCounts = await prisma.registration.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventIds },
          tenantId: tenantId
        },
        _count: { eventId: true }
      })
      regCounts.forEach((row) => {
        registrationCounts[String(row.eventId)] = row._count.eventId
      })
    }

    // Map events with real registration counts
    const events = eventsList.map((e: any) => ({
      id: String(e.id),
      name: e.name,
      start_date: e.startsAt,
      end_date: e.endsAt,
      location: e.city || e.venue || 'Online',
      status: e.status,
      priceInr: e.priceInr || 0,
      capacity: e.expectedAttendees || 0,
      _count: {
        registrations: registrationCounts[String(e.id)] || 0
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

    // Only allow updating specific fields
    const { plan, status } = body

    // Validate if plan exists (optional but good practice)
    // For now we just update the string

    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(plan && { plan }),
        ...(status && { status })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Company plan updated successfully',
      company: updatedTenant
    })
  } catch (error: any) {
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Failed to update company', details: error.message },
      { status: 500 }
    )
  }
}
