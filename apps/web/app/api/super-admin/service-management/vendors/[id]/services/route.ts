import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST - Add a new service to vendor
export async function POST(
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
    const {
      name,
      type,
      priceModel,
      basePrice,
      currency,
      minOrderQty,
      maxCapacity,
      prepTimeHours,
      staffCount,
      description,
      isPopular
    } = body

    if (!name || !type || !priceModel) {
      return NextResponse.json({ error: 'Name, type, and price model are required' }, { status: 400 })
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId }
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Create service
    const service = await prisma.vendorService.create({
      data: {
        vendorId,
        name,
        type,
        priceModel,
        basePrice: basePrice || 0,
        currency: currency || 'INR',
        minOrderQty: minOrderQty || 1,
        maxCapacity: maxCapacity || null,
        prepTimeHours: prepTimeHours || null,
        staffCount: staffCount || 0,
        description: description || null,
        isPopular: isPopular || false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      service
    })
  } catch (error: any) {
    console.error('Error creating service:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
