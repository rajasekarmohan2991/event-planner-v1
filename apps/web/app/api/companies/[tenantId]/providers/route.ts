import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'

const createProviderSchema = z.object({
  providerType: z.enum(['VENDOR', 'SPONSOR', 'EXHIBITOR']),
  companyName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  description: z.string().optional(),
  yearEstablished: z.number().optional(),
  categories: z.array(z.object({
    category: z.string(),
    subcategory: z.string().optional(),
    isPrimary: z.boolean().optional()
  })).min(1)
})

// GET - List all providers for a company
export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = params
    const { searchParams } = new URL(req.url)
    
    const providerType = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Check if company has provider module enabled
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT 
        module_vendor_management,
        module_sponsor_management,
        module_exhibitor_management
      FROM tenants 
      WHERE id = ${tenantId}
    `

    if (!tenant[0]) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Build WHERE clause
    let whereConditions = [`sp.tenant_id = '${tenantId}'`]
    
    if (providerType) {
      whereConditions.push(`sp.provider_type = '${providerType}'`)
    }
    
    if (status) {
      whereConditions.push(`sp.verification_status = '${status}'`)
    }
    
    if (search) {
      whereConditions.push(`(
        sp.company_name ILIKE '%${search}%' OR
        sp.email ILIKE '%${search}%' OR
        sp.description ILIKE '%${search}%'
      )`)
    }

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total
      FROM service_providers sp
      WHERE ${whereClause}
    `)
    const total = countResult[0]?.total || 0

    // Get providers with categories
    const providers = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        sp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pc.id,
              'category', pc.category,
              'subcategory', pc.subcategory,
              'isPrimary', pc.is_primary
            )
          ) FILTER (WHERE pc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM service_providers sp
      LEFT JOIN provider_categories pc ON pc.provider_id = sp.id
      WHERE ${whereClause}
      GROUP BY sp.id
      ORDER BY sp.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    return NextResponse.json({
      providers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      modules: {
        vendorManagement: tenant[0].module_vendor_management,
        sponsorManagement: tenant[0].module_sponsor_management,
        exhibitorManagement: tenant[0].module_exhibitor_management
      }
    })

  } catch (error: any) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({
      error: 'Failed to fetch providers',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create a new provider
export async function POST(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = params
    const body = await req.json()
    const validatedData = createProviderSchema.parse(body)

    // Check if company has the required module enabled
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT 
        module_vendor_management,
        module_sponsor_management,
        module_exhibitor_management,
        provider_commission_rate
      FROM tenants 
      WHERE id = ${tenantId}
    `

    if (!tenant[0]) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Check module access
    const moduleEnabled = 
      (validatedData.providerType === 'VENDOR' && tenant[0].module_vendor_management) ||
      (validatedData.providerType === 'SPONSOR' && tenant[0].module_sponsor_management) ||
      (validatedData.providerType === 'EXHIBITOR' && tenant[0].module_exhibitor_management)

    if (!moduleEnabled) {
      return NextResponse.json({
        error: `${validatedData.providerType} management module is not enabled for this company`,
        message: 'Please upgrade to Enterprise plan to access this feature'
      }, { status: 403 })
    }

    // Check if provider with this email already exists in this tenant
    const existingProvider = await prisma.$queryRaw<any[]>`
      SELECT id FROM service_providers 
      WHERE tenant_id = ${tenantId} AND email = ${validatedData.email}
    `

    if (existingProvider.length > 0) {
      return NextResponse.json({
        error: 'A provider with this email already exists in your company'
      }, { status: 400 })
    }

    // Create the provider
    const commissionRate = tenant[0].provider_commission_rate || 15.00

    const providerResult = await prisma.$queryRaw<any[]>`
      INSERT INTO service_providers (
        tenant_id, provider_type, company_name, email, phone, website,
        city, state, country, description, year_established,
        commission_rate, verification_status, is_active, created_at, updated_at
      ) VALUES (
        ${tenantId},
        ${validatedData.providerType},
        ${validatedData.companyName},
        ${validatedData.email},
        ${validatedData.phone || null},
        ${validatedData.website || null},
        ${validatedData.city || null},
        ${validatedData.state || null},
        ${validatedData.country},
        ${validatedData.description || null},
        ${validatedData.yearEstablished || null},
        ${commissionRate},
        'PENDING',
        true,
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const providerId = providerResult[0]?.id

    if (!providerId) {
      throw new Error('Failed to create provider')
    }

    // Add categories
    for (const category of validatedData.categories) {
      await prisma.$executeRaw`
        INSERT INTO provider_categories (
          provider_id, category, subcategory, is_primary, created_at
        ) VALUES (
          ${providerId}::bigint,
          ${category.category},
          ${category.subcategory || null},
          ${category.isPrimary || false},
          NOW()
        )
      `
    }

    // Fetch the created provider with categories
    const provider = await prisma.$queryRaw<any[]>`
      SELECT 
        sp.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', pc.id,
              'category', pc.category,
              'subcategory', pc.subcategory,
              'isPrimary', pc.is_primary
            )
          ) FILTER (WHERE pc.id IS NOT NULL),
          '[]'
        ) as categories
      FROM service_providers sp
      LEFT JOIN provider_categories pc ON pc.provider_id = sp.id
      WHERE sp.id = ${providerId}::bigint
      GROUP BY sp.id
    `

    return NextResponse.json({
      success: true,
      provider: provider[0],
      message: 'Provider added successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Provider creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create provider',
      details: error.message
    }, { status: 500 })
  }
}
