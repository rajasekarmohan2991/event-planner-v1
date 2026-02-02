import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'

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

    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200
    })

    // Enrich with tenant name (if present)
    const result = [] as any[]
    for (const v of vendors) {
      let linkedCompany = null;
      if (v.tenantId) {
        try {
          linkedCompany = await prisma.tenant.findUnique({
            where: { id: v.tenantId },
            select: { id: true, name: true, slug: true, logo: true }
          })
        } catch (e) {
          // Tenant might not exist, skip
        }
      }
      result.push({ ...v, linkedCompany })
    }

    return NextResponse.json({ vendors: result })
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
      tenantId
    } = body

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category are required' }, { status: 400 })
    }

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
        operatingCities: operatingCities ? (typeof operatingCities === 'string' ? JSON.parse(operatingCities) : operatingCities) : undefined, // Ensure JSON format
        serviceCapacity: serviceCapacity ? parseInt(serviceCapacity) : null,
        tenantId: tenantId || null,
      }
    })

    return NextResponse.json({ success: true, message: 'Vendor created successfully', result: vendor })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
