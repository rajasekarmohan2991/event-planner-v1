import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List vendors for the current company
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId || (session.user as any).currentTenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'No company context' }, { status: 400 })
    }

    // Check if module is enabled
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_vendor_management FROM tenants WHERE id = ${tenantId}
    `
    if (!tenant[0]?.module_vendor_management) {
      return NextResponse.json({ error: 'Vendor management not enabled' }, { status: 403 })
    }

    // Fetch vendors for this tenant
    const vendors = await prisma.$queryRaw<any[]>`
      SELECT 
        sp.id,
        sp.company_name,
        sp.email,
        sp.phone,
        sp.city,
        sp.country,
        sp.verification_status as status,
        sp.avg_rating,
        sp.total_reviews,
        sp.created_at,
        (SELECT COUNT(*) FROM provider_services WHERE provider_id = sp.id) as services_count,
        (SELECT COUNT(*) FROM vendor_bookings WHERE provider_id = sp.id) as total_bookings,
        (SELECT string_agg(DISTINCT pc.name, ', ') FROM provider_categories pc 
         JOIN provider_category_links pcl ON pc.id = pcl.category_id 
         WHERE pcl.provider_id = sp.id) as category
      FROM service_providers sp
      WHERE sp.tenant_id = ${tenantId} AND sp.provider_type = 'VENDOR'
      ORDER BY sp.created_at DESC
    `

    return NextResponse.json({ vendors })
  } catch (error: any) {
    console.error('Error fetching company vendors:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create vendor for the current company
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId || (session.user as any).currentTenantId
    if (!tenantId) {
      return NextResponse.json({ error: 'No company context' }, { status: 400 })
    }

    // Check if module is enabled
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_vendor_management FROM tenants WHERE id = ${tenantId}
    `
    if (!tenant[0]?.module_vendor_management) {
      return NextResponse.json({ error: 'Vendor management not enabled' }, { status: 403 })
    }

    const body = await req.json()
    const {
      company_name, email, phone, website, category, description,
      address, city, state, country, postal_code,
      tax_id, bank_name, account_number, account_holder_name, ifsc_code,
      commission_rate, services
    } = body

    if (!company_name || !email) {
      return NextResponse.json({ error: 'Company name and email are required' }, { status: 400 })
    }

    // Create vendor
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO service_providers (
        tenant_id, provider_type, company_name, email, phone, website,
        description, address, city, state, country, postal_code,
        tax_id, bank_name, account_number, account_holder_name, ifsc_code,
        commission_rate, verification_status, created_at, updated_at
      ) VALUES (
        ${tenantId}, 'VENDOR', ${company_name}, ${email}, ${phone || null}, ${website || null},
        ${description || null}, ${address || null}, ${city || null}, ${state || null}, 
        ${country || null}, ${postal_code || null}, ${tax_id || null},
        ${bank_name || null}, ${account_number || null}, ${account_holder_name || null},
        ${ifsc_code || null}, ${parseFloat(commission_rate) || 15},
        'PENDING', NOW(), NOW()
      )
      RETURNING id
    `

    const vendorId = result[0]?.id

    // Add category
    if (category && vendorId) {
      await prisma.$executeRaw`
        INSERT INTO provider_categories (name, provider_type, created_at)
        VALUES (${category}, 'VENDOR', NOW())
        ON CONFLICT (name, provider_type) DO NOTHING
      `
      await prisma.$executeRaw`
        INSERT INTO provider_category_links (provider_id, category_id)
        SELECT ${vendorId}, id FROM provider_categories 
        WHERE name = ${category} AND provider_type = 'VENDOR'
        ON CONFLICT DO NOTHING
      `
    }

    // Add services
    if (services && services.length > 0 && vendorId) {
      for (const service of services) {
        if (service.name) {
          await prisma.$executeRaw`
            INSERT INTO provider_services (
              provider_id, name, description, base_price, price_unit, is_active, created_at
            ) VALUES (
              ${vendorId}, ${service.name}, ${service.description || null},
              ${service.base_price || 0}, ${service.price_unit || 'per_event'}, true, NOW()
            )
          `
        }
      }
    }

    return NextResponse.json({ success: true, vendorId })
  } catch (error: any) {
    console.error('Error creating company vendor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
