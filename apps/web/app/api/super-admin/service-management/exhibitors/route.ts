import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - List all exhibitors (platform-wide)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const exhibitors = await prisma.$queryRaw<any[]>`
      SELECT 
        sp.id,
        sp.company_name,
        sp.email,
        sp.phone,
        sp.city,
        sp.country,
        sp.verification_status as status,
        sp.total_revenue,
        sp.created_at,
        (SELECT COUNT(*) FROM exhibitor_bookings WHERE provider_id = sp.id) as total_bookings,
        COALESCE(sp.provider_settings->>'industry', 'General') as industry
      FROM service_providers sp
      WHERE sp.provider_type = 'EXHIBITOR'
      ORDER BY sp.created_at DESC
    `

    return NextResponse.json({ exhibitors })
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
      company_name, email, phone, website, description, industry,
      address, city, state, country, postal_code,
      tax_id, bank_name, account_number, account_holder_name, ifsc_code,
      commission_rate
    } = body

    if (!company_name || !email) {
      return NextResponse.json({ error: 'Company name and email are required' }, { status: 400 })
    }

    const providerSettings = JSON.stringify({ industry: industry || 'General' })

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO service_providers (
        tenant_id, provider_type, company_name, email, phone, website,
        description, address, city, state, country, postal_code,
        tax_id, bank_name, account_number, account_holder_name, ifsc_code,
        commission_rate, provider_settings, verification_status, created_at, updated_at
      ) VALUES (
        'platform', 'EXHIBITOR', ${company_name}, ${email}, ${phone || null}, ${website || null},
        ${description || null}, ${address || null}, ${city || null}, ${state || null}, 
        ${country || null}, ${postal_code || null}, ${tax_id || null},
        ${bank_name || null}, ${account_number || null}, ${account_holder_name || null},
        ${ifsc_code || null}, ${parseFloat(commission_rate) || 18},
        ${providerSettings}::jsonb, 'PENDING', NOW(), NOW()
      )
      RETURNING id
    `

    return NextResponse.json({ 
      success: true, 
      message: 'Exhibitor created successfully',
      exhibitorId: result[0]?.id 
    })
  } catch (error: any) {
    console.error('Error creating exhibitor:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
