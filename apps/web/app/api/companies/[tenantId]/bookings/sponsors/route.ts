import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { calculateCommission } from '@/types/provider'

const createSponsorDealSchema = z.object({
  eventId: z.number(),
  sponsorId: z.number(),
  sponsorshipTier: z.enum(['TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'CUSTOM']),
  sponsorshipPackage: z.string().optional(),
  benefits: z.array(z.string()).default([]),
  deliverables: z.array(z.string()).default([]),
  sponsorshipAmount: z.number().positive()
})

function generateDealNumber(tenantId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `SD-${tenantId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`
}

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
    
    const eventId = searchParams.get('eventId')
    const sponsorId = searchParams.get('sponsorId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_sponsor_management FROM tenants WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_sponsor_management) {
      return NextResponse.json({
        error: 'Sponsor management module is not enabled'
      }, { status: 403 })
    }

    let whereConditions = [`sd.tenant_id = '${tenantId}'`]
    if (eventId) whereConditions.push(`sd.event_id = ${eventId}`)
    if (sponsorId) whereConditions.push(`sd.sponsor_id = ${sponsorId}`)
    if (status) whereConditions.push(`sd.status = '${status}'`)

    const whereClause = whereConditions.join(' AND ')

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total FROM sponsor_deals sd WHERE ${whereClause}
    `)
    const total = countResult[0]?.total || 0

    const deals = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        sd.*,
        json_build_object('id', e.id, 'name', e.name, 'start_date', e.start_date) as event,
        json_build_object('id', sp.id, 'company_name', sp.company_name, 'email', sp.email) as sponsor
      FROM sponsor_deals sd
      LEFT JOIN events e ON e.id = sd.event_id
      LEFT JOIN service_providers sp ON sp.id = sd.sponsor_id
      WHERE ${whereClause}
      ORDER BY sd.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const stats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*) as total_deals,
        COUNT(*) FILTER (WHERE status = 'PROPOSED') as proposed,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        SUM(sponsorship_amount) as total_amount,
        SUM(commission_amount) as total_commission
      FROM sponsor_deals WHERE ${whereClause}
    `)

    return NextResponse.json({
      deals,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statistics: stats[0] || {}
    })
  } catch (error: any) {
    console.error('Error fetching sponsor deals:', error)
    return NextResponse.json({
      error: 'Failed to fetch sponsor deals',
      details: error.message
    }, { status: 500 })
  }
}

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
    const validatedData = createSponsorDealSchema.parse(body)

    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_sponsor_management, provider_commission_rate
      FROM tenants WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_sponsor_management) {
      return NextResponse.json({
        error: 'Sponsor management module is not enabled'
      }, { status: 403 })
    }

    const event = await prisma.$queryRaw<any[]>`
      SELECT id FROM events 
      WHERE id = ${validatedData.eventId}::bigint AND tenant_id = ${tenantId}
    `

    if (!event[0]) {
      return NextResponse.json({
        error: 'Event not found'
      }, { status: 404 })
    }

    const sponsor = await prisma.$queryRaw<any[]>`
      SELECT id, commission_rate FROM service_providers 
      WHERE id = ${validatedData.sponsorId}::bigint 
      AND tenant_id = ${tenantId}
      AND provider_type = 'SPONSOR'
      AND is_active = true
    `

    if (!sponsor[0]) {
      return NextResponse.json({
        error: 'Sponsor not found or not active'
      }, { status: 404 })
    }

    const commissionRate = sponsor[0].commission_rate || tenant[0].provider_commission_rate || 10.00
    const commission = calculateCommission(validatedData.sponsorshipAmount, commissionRate)
    const dealNumber = generateDealNumber(tenantId)
    const userId = BigInt(session.user.id)

    const dealResult = await prisma.$queryRaw<any[]>`
      INSERT INTO sponsor_deals (
        deal_number, event_id, tenant_id, sponsor_id,
        sponsorship_tier, sponsorship_package, benefits, deliverables,
        sponsorship_amount, currency,
        commission_rate, commission_amount, sponsor_payout,
        status, payment_status, created_by, created_at, updated_at
      ) VALUES (
        ${dealNumber},
        ${validatedData.eventId}::bigint,
        ${tenantId},
        ${validatedData.sponsorId}::bigint,
        ${validatedData.sponsorshipTier},
        ${validatedData.sponsorshipPackage || null},
        ${JSON.stringify(validatedData.benefits)}::jsonb,
        ${JSON.stringify(validatedData.deliverables)}::jsonb,
        ${validatedData.sponsorshipAmount},
        'INR',
        ${commission.commissionRate},
        ${commission.commissionAmount},
        ${commission.providerPayout},
        'PROPOSED',
        'UNPAID',
        ${userId}::bigint,
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const dealId = dealResult[0]?.id
    const transactionNumber = `CT-${dealNumber}`

    await prisma.$executeRaw`
      INSERT INTO commission_transactions (
        transaction_number, provider_id, booking_id, booking_type,
        event_id, tenant_id, booking_amount, commission_rate,
        commission_amount, provider_payout, currency, status,
        created_at, updated_at
      ) VALUES (
        ${transactionNumber},
        ${validatedData.sponsorId}::bigint,
        ${dealId}::bigint,
        'SPONSOR',
        ${validatedData.eventId}::bigint,
        ${tenantId},
        ${commission.bookingAmount},
        ${commission.commissionRate},
        ${commission.commissionAmount},
        ${commission.providerPayout},
        'INR',
        'PENDING',
        NOW(),
        NOW()
      )
    `

    const deal = await prisma.$queryRaw<any[]>`
      SELECT 
        sd.*,
        json_build_object('id', e.id, 'name', e.name) as event,
        json_build_object('id', sp.id, 'company_name', sp.company_name) as sponsor
      FROM sponsor_deals sd
      LEFT JOIN events e ON e.id = sd.event_id
      LEFT JOIN service_providers sp ON sp.id = sd.sponsor_id
      WHERE sd.id = ${dealId}::bigint
    `

    return NextResponse.json({
      success: true,
      deal: deal[0],
      message: 'Sponsor deal created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Sponsor deal creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create sponsor deal',
      details: error.message
    }, { status: 500 })
  }
}
