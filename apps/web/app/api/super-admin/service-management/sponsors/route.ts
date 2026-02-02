import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

  // Polyfill for BigInt serialization
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }

// GET - List all sponsors (platform-wide)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch sponsors from Prisma model with event info
    try {
      const sponsors = await prisma.sponsor.findMany({
        include: {
          event: {
            select: {
              id: true,
              name: true,
              tenantId: true
            }
          },
          packages: {
            select: {
              id: true,
              name: true,
              price: true
            }
          },
          assets: {
            select: {
              id: true,
              type: true,
              status: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      // Get tenant info for each sponsor's event
      const sponsorsWithDetails = await Promise.all(
        sponsors.map(async (sponsor) => {
          let linkedCompany = null
          if (sponsor.event?.tenantId) {
            const tenant = await prisma.tenant.findUnique({
              where: { id: sponsor.event.tenantId },
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
          const packagesCount = sponsor.packages.length
          const totalValue = sponsor.packages.reduce((sum, p) => sum + Number(p.price || 0), 0)
          const assetsCount = sponsor.assets.length

          return {
            id: sponsor.id,
            name: sponsor.name,
            industry: sponsor.industry,
            website: sponsor.website,
            logo: sponsor.logo,
            description: sponsor.description,
            contactName: sponsor.contactName,
            contactEmail: sponsor.contactEmail,
            contactPhone: sponsor.contactPhone,
            status: sponsor.status,
            createdAt: sponsor.createdAt,
            // Event info
            eventId: sponsor.eventId?.toString(),
            eventName: sponsor.event?.name,
            // Stats
            packagesCount,
            totalValue,
            assetsCount,
            // Linked Event Management Company
            linkedCompany,
            // Packages preview
            packages: sponsor.packages.slice(0, 3)
          }
        })
      )

      return NextResponse.json({ sponsors: sponsorsWithDetails })
    } catch (schemaError: any) {
      // If Sponsor model doesn't exist in schema, return empty array
      console.log('Sponsor model not found in schema, returning empty array')
      return NextResponse.json({ sponsors: [] })
    }
  } catch (error: any) {
    console.error('Error fetching sponsors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new sponsor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      industry,
      website,
      logo,
      description,
      contactName,
      contactEmail,
      contactPhone,
      eventId // Required: Link to an event
    } = body

    if (!name || !eventId) {
      return NextResponse.json({ error: 'Name and Event are required' }, { status: 400 })
    }

    // Create sponsor using Prisma model
    const sponsor = await prisma.sponsor.create({
      data: {
        name,
        industry,
        website,
        logo,
        description,
        contactName,
        contactEmail,
        contactPhone,
        eventId: BigInt(eventId)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Sponsor created successfully',
      sponsor: { ...sponsor, id: sponsor.id, eventId: sponsor.eventId.toString() }
    })
  } catch (error: any) {
    console.error('Error creating sponsor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
