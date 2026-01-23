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

    // Ensure vendors table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        logo TEXT,
        cover_image TEXT,
        established_year INTEGER,
        operating_cities TEXT,
        service_capacity INTEGER,
        rating DOUBLE PRECISION DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        tenant_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    const vendors: any[] = await prisma.$queryRawUnsafe(`
      SELECT 
        id,
        name,
        category,
        description,
        email,
        phone,
        website,
        logo,
        cover_image as "coverImage",
        established_year as "establishedYear",
        operating_cities as "operatingCities",
        service_capacity as "serviceCapacity",
        rating,
        review_count as "reviewCount",
        tenant_id as "tenantId",
        created_at as "createdAt"
      FROM vendors
      ORDER BY created_at DESC
      LIMIT 200
    `)

    // Enrich with tenant name (if present)
    const result = [] as any[]
    for (const v of vendors) {
      let linkedCompany = null as any
      if (v.tenantId) {
        try {
          const t: any[] = await prisma.$queryRawUnsafe(`SELECT id, name, slug, logo FROM tenants WHERE id = $1 LIMIT 1`, v.tenantId)
          linkedCompany = t[0] || null
        } catch (e) {
          // Tenant might not exist, skip
        }
      }
      result.push({ ...v, linkedCompany })
    }

    return NextResponse.json({ vendors: result })
  } catch (error: any) {
    console.error('Error fetching vendors:', error)
    // Attempt global schema healing if relation missing
    if (String(error.message || '').includes('relation') || String(error.code || '').startsWith('42')) {
      try {
        await ensureSchema()
        return NextResponse.json({ error: 'System updated. Please retry.' }, { status: 503 })
      } catch { }
    }
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

    // Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS vendors (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        email TEXT,
        phone TEXT,
        website TEXT,
        logo TEXT,
        cover_image TEXT,
        established_year INTEGER,
        operating_cities TEXT,
        service_capacity INTEGER,
        rating DOUBLE PRECISION,
        review_count INTEGER,
        tenant_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    await prisma.$executeRawUnsafe(`
      INSERT INTO vendors (
        name, category, description, email, phone, website, logo, cover_image,
        established_year, operating_cities, service_capacity, tenant_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12
      )
    `,
      name,
      category,
      description || null,
      email || null,
      phone || null,
      website || null,
      logo || null,
      coverImage || null,
      establishedYear ? parseInt(establishedYear) : null,
      operatingCities || null,
      serviceCapacity ? parseInt(serviceCapacity) : null,
      tenantId || null,
    )

    return NextResponse.json({ success: true, message: 'Vendor created successfully' })
  } catch (error: any) {
    console.error('Error creating vendor:', error)
    if (String(error.message || '').includes('relation') || String(error.code || '').startsWith('42')) {
      try {
        await ensureSchema()
        return NextResponse.json({ error: 'System updated. Please retry.' }, { status: 503 })
      } catch { }
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
