import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

  // Polyfill for BigInt serialization
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }

// GET - List all vendors (platform-wide)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch vendors from new Prisma model with tenant (Event Management Company) info
    const vendors = await prisma.vendor.findMany({
      include: {
        services: {
          select: {
            id: true,
            name: true,
            type: true,
            basePrice: true
          }
        },
        bookings: {
          select: {
            id: true,
            status: true,
            totalAmount: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Get tenant info for each vendor
    const vendorsWithTenant = await Promise.all(
      vendors.map(async (vendor) => {
        let linkedCompany = null
        if (vendor.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: vendor.tenantId },
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
        const totalBookings = vendor.bookings.length
        const totalRevenue = vendor.bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
        const servicesCount = vendor.services.length

        return {
          id: vendor.id,
          name: vendor.name,
          category: vendor.category,
          description: vendor.description,
          email: vendor.email,
          phone: vendor.phone,
          website: vendor.website,
          logo: vendor.logo,
          coverImage: vendor.coverImage,
          establishedYear: vendor.establishedYear,
          operatingCities: vendor.operatingCities,
          serviceCapacity: vendor.serviceCapacity,
          rating: vendor.rating,
          reviewCount: vendor.reviewCount,
          createdAt: vendor.createdAt,
          // Stats
          servicesCount,
          totalBookings,
          totalRevenue,
          // Linked Event Management Company
          linkedCompany,
          // Services preview
          services: vendor.services.slice(0, 3)
        }
      })
    )

    return NextResponse.json({ vendors: vendorsWithTenant })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create new vendor
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      category,
      description,
      email,
      phone,
      website,
      logo,
      coverImage,
      establishedYear,
      operatingCities,
      serviceCapacity,
      licenses,
      tenantId // Optional: Link to Event Management Company
    } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

    // Create vendor using Prisma model
    const vendor = await prisma.vendor.create({
      data: {
        name,
        category,
        description,
        email,
        phone,
        website,
        logo,
        coverImage,
        establishedYear: establishedYear ? parseInt(establishedYear) : null,
        operatingCities: operatingCities || null,
        serviceCapacity: serviceCapacity ? parseInt(serviceCapacity) : null,
        licenses: licenses || null,
        tenantId: tenantId || null
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Vendor created successfully',
      vendor
    })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
