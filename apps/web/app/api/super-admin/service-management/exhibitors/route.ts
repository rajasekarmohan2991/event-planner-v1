import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all exhibitors (platform-wide using existing Exhibitor model)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch exhibitors from existing Prisma Exhibitor model
    const exhibitors = await prisma.exhibitor.findMany({
      include: {
        booths: {
          select: {
            id: true,
            boothNumber: true,
            type: true,
            status: true,
            priceInr: true
          }
        },
        products: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get tenant info for each exhibitor's event
    const exhibitorsWithDetails = await Promise.all(
      exhibitors.map(async (exhibitor) => {
        let linkedCompany = null
        if (exhibitor.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: exhibitor.tenantId },
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true
            }
          })
          linkedCompany = tenant
        }

        // Calculate stats
        const boothsCount = exhibitor.booths.length
        const productsCount = exhibitor.products.length
        const totalRevenue = exhibitor.booths.reduce((sum, b) => sum + (b.priceInr || 0), 0)

        return {
          id: exhibitor.id,
          name: exhibitor.name,
          company: exhibitor.company,
          contactName: exhibitor.contactName,
          contactEmail: exhibitor.contactEmail,
          contactPhone: exhibitor.contactPhone,
          website: exhibitor.website,
          companyDescription: exhibitor.companyDescription,
          status: exhibitor.status,
          paymentStatus: exhibitor.paymentStatus,
          boothNumber: exhibitor.boothNumber,
          boothType: exhibitor.boothType,
          createdAt: exhibitor.createdAt,
          // Event info
          eventId: exhibitor.eventId,
          // Stats
          boothsCount,
          productsCount,
          totalRevenue,
          // Linked Event Management Company
          linkedCompany,
          // Products preview
          products: exhibitor.products.slice(0, 3)
        }
      })
    )

    return NextResponse.json({ exhibitors: exhibitorsWithDetails })
  } catch (error: any) {
    console.error('Error fetching exhibitors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new exhibitor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      company,
      contactName,
      contactEmail,
      contactPhone,
      website,
      companyDescription,
      productsServices,
      boothType,
      eventId, // Required: Link to an event
      tenantId // Optional: Link to a tenant/company
    } = body

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Name and Event are required' }, { status: 400 })
    }

    // Create exhibitor using Prisma model
    const exhibitor = await prisma.exhibitor.create({
      data: {
        name,
        company,
        contactName,
        contactEmail,
        contactPhone,
        website,
        companyDescription,
        productsServices,
        boothType,
        eventId,
        tenantId: tenantId || null,
        status: 'PENDING_CONFIRMATION'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Exhibitor created successfully',
      exhibitor
    })
  } catch (error: any) {
    console.error('Error creating exhibitor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
