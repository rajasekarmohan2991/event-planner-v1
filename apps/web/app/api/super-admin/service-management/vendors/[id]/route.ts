import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

  // Polyfill for BigInt serialization
  (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }

// GET - Get vendor details with services, menu, packages, bookings
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id

    // Fetch vendor with all relations
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        services: {
          include: {
            categories: {
              include: {
                items: true
              }
            },
            packages: true
          }
        },
        bookings: {
          orderBy: { bookingDate: 'desc' },
          take: 20
        }
      }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Get linked tenant info
    let linkedCompany = null
    if (vendor.tenantId) {
      linkedCompany = await prisma.tenant.findUnique({
        where: { id: vendor.tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true
        }
      })
    }

    // Calculate stats
    const totalServices = vendor.services.length
    const totalBookings = vendor.bookings.length
    const totalRevenue = vendor.bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0)
    const totalCategories = vendor.services.reduce((sum, s) => sum + s.categories.length, 0)
    const totalMenuItems = vendor.services.reduce((sum, s) =>
      sum + s.categories.reduce((catSum, c) => catSum + c.items.length, 0), 0
    )
    const totalPackages = vendor.services.reduce((sum, s) => sum + s.packages.length, 0)

    return NextResponse.json({
      vendor: {
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
        licenses: vendor.licenses,
        rating: vendor.rating,
        reviewCount: vendor.reviewCount,
        tenantId: vendor.tenantId,
        createdAt: vendor.createdAt,
        updatedAt: vendor.updatedAt,
        // Related data
        services: vendor.services.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          priceModel: s.priceModel,
          basePrice: Number(s.basePrice),
          currency: s.currency,
          minOrderQty: s.minOrderQty,
          maxCapacity: s.maxCapacity,
          prepTimeHours: s.prepTimeHours,
          staffCount: s.staffCount,
          description: s.description,
          isPopular: s.isPopular,
          // Menu categories with items
          categories: s.categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description,
            sortOrder: c.sortOrder,
            items: c.items.map(i => ({
              id: i.id,
              name: i.name,
              type: i.type,
              cuisine: i.cuisine,
              description: i.description,
              imageUrls: i.imageUrls,
              allergens: i.allergens,
              priceImpact: Number(i.priceImpact),
              isCustomizable: i.isCustomizable
            }))
          })),
          // Meal packages
          packages: s.packages.map(p => ({
            id: p.id,
            name: p.name,
            type: p.type,
            pricePerPlate: Number(p.pricePerPlate),
            minGuests: p.minGuests,
            maxGuests: p.maxGuests,
            description: p.description,
            includedItems: p.includedItems
          }))
        })),
        bookings: vendor.bookings.map(b => ({
          id: b.id,
          bookingDate: b.bookingDate,
          guestCount: b.guestCount,
          status: b.status,
          baseAmount: Number(b.baseAmount),
          taxAmount: Number(b.taxAmount),
          totalAmount: Number(b.totalAmount),
          advancePaid: Number(b.advancePaid),
          notes: b.notes
        })),
        // Linked company
        linkedCompany,
        // Stats
        stats: {
          totalServices,
          totalBookings,
          totalRevenue,
          totalCategories,
          totalMenuItems,
          totalPackages
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching vendor details:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Update vendor details
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendorId = params.id
    const body = await req.json()

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name: body.name,
        category: body.category,
        description: body.description,
        email: body.email,
        phone: body.phone,
        website: body.website,
        logo: body.logo,
        coverImage: body.coverImage,
        establishedYear: body.establishedYear ? parseInt(body.establishedYear) : null,
        operatingCities: body.operatingCities,
        serviceCapacity: body.serviceCapacity ? parseInt(body.serviceCapacity) : null,
        licenses: body.licenses,
        tenantId: body.tenantId || null
      }
    })

    return NextResponse.json({ success: true, message: 'Vendor updated successfully', vendor })
  } catch (error: any) {
    console.error('Error updating vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete vendor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete vendor (cascade will handle related records)
    await prisma.vendor.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Vendor deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
