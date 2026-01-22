import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { calculateCommission } from '@/types/provider'

const createVendorBookingSchema = z.object({
  eventId: z.number(),
  providerId: z.number(),
  serviceId: z.number().optional(),
  serviceDateFrom: z.string(),
  serviceDateTo: z.string(),
  attendeeCount: z.number().optional(),
  quotedAmount: z.number().positive(),
  specialRequirements: z.string().optional()
})

// Generate booking number
function generateBookingNumber(tenantId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `VB-${tenantId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`
}

// GET - List vendor bookings for a company
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
    const providerId = searchParams.get('providerId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Check module access
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_vendor_management FROM tenants WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_vendor_management) {
      return NextResponse.json({
        error: 'Vendor management module is not enabled',
        message: 'Please contact your administrator to enable this feature'
      }, { status: 403 })
    }

    // Build WHERE clause
    let whereConditions = [`vb.tenant_id = '${tenantId}'`]
    
    if (eventId) whereConditions.push(`vb.event_id = ${eventId}`)
    if (providerId) whereConditions.push(`vb.provider_id = ${providerId}`)
    if (status) whereConditions.push(`vb.status = '${status}'`)

    const whereClause = whereConditions.join(' AND ')

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total
      FROM vendor_bookings vb
      WHERE ${whereClause}
    `)
    const total = countResult[0]?.total || 0

    // Get bookings with related data
    const bookings = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        vb.*,
        json_build_object(
          'id', e.id,
          'name', e.name,
          'start_date', e.start_date,
          'end_date', e.end_date
        ) as event,
        json_build_object(
          'id', sp.id,
          'company_name', sp.company_name,
          'email', sp.email,
          'phone', sp.phone,
          'rating', sp.rating
        ) as provider,
        json_build_object(
          'id', ps.id,
          'service_name', ps.service_name,
          'pricing_model', ps.pricing_model
        ) as service
      FROM vendor_bookings vb
      LEFT JOIN events e ON e.id = vb.event_id
      LEFT JOIN service_providers sp ON sp.id = vb.provider_id
      LEFT JOIN provider_services ps ON ps.id = vb.service_id
      WHERE ${whereClause}
      ORDER BY vb.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    // Get summary statistics
    const stats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed,
        SUM(final_amount) as total_amount,
        SUM(commission_amount) as total_commission
      FROM vendor_bookings
      WHERE ${whereClause}
    `)

    return NextResponse.json({
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      statistics: stats[0] || {}
    })

  } catch (error: any) {
    console.error('Error fetching vendor bookings:', error)
    return NextResponse.json({
      error: 'Failed to fetch vendor bookings',
      details: error.message
    }, { status: 500 })
  }
}

// POST - Create a new vendor booking
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
    const validatedData = createVendorBookingSchema.parse(body)

    // Check module access
    const tenant = await prisma.$queryRaw<any[]>`
      SELECT 
        module_vendor_management,
        provider_commission_rate
      FROM tenants 
      WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_vendor_management) {
      return NextResponse.json({
        error: 'Vendor management module is not enabled'
      }, { status: 403 })
    }

    // Verify event belongs to this tenant
    const event = await prisma.$queryRaw<any[]>`
      SELECT id FROM events 
      WHERE id = ${validatedData.eventId}::bigint 
      AND tenant_id = ${tenantId}
    `

    if (!event[0]) {
      return NextResponse.json({
        error: 'Event not found or does not belong to this company'
      }, { status: 404 })
    }

    // Verify provider belongs to this tenant
    const provider = await prisma.$queryRaw<any[]>`
      SELECT id, commission_rate FROM service_providers 
      WHERE id = ${validatedData.providerId}::bigint 
      AND tenant_id = ${tenantId}
      AND provider_type = 'VENDOR'
      AND is_active = true
    `

    if (!provider[0]) {
      return NextResponse.json({
        error: 'Vendor not found or not active'
      }, { status: 404 })
    }

    // Calculate commission
    const commissionRate = provider[0].commission_rate || tenant[0].provider_commission_rate || 15.00
    const commission = calculateCommission(validatedData.quotedAmount, commissionRate)

    // Generate booking number
    const bookingNumber = generateBookingNumber(tenantId)

    // Create booking
    const userId = BigInt(session.user.id)
    const bookingResult = await prisma.$queryRaw<any[]>`
      INSERT INTO vendor_bookings (
        booking_number, event_id, tenant_id, provider_id, service_id,
        booking_date, service_date_from, service_date_to, attendee_count,
        quoted_amount, final_amount, currency,
        commission_rate, commission_amount, provider_payout,
        status, payment_status, special_requirements,
        created_by, created_at, updated_at
      ) VALUES (
        ${bookingNumber},
        ${validatedData.eventId}::bigint,
        ${tenantId},
        ${validatedData.providerId}::bigint,
        ${validatedData.serviceId ? validatedData.serviceId.toString() : null}::bigint,
        CURRENT_DATE,
        ${validatedData.serviceDateFrom}::date,
        ${validatedData.serviceDateTo}::date,
        ${validatedData.attendeeCount || null},
        ${validatedData.quotedAmount},
        ${commission.bookingAmount},
        'INR',
        ${commission.commissionRate},
        ${commission.commissionAmount},
        ${commission.providerPayout},
        'PENDING',
        'UNPAID',
        ${validatedData.specialRequirements || null},
        ${userId}::bigint,
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const bookingId = bookingResult[0]?.id

    // Create commission transaction record
    const transactionNumber = `CT-${bookingNumber}`
    await prisma.$executeRaw`
      INSERT INTO commission_transactions (
        transaction_number, provider_id, booking_id, booking_type,
        event_id, tenant_id, booking_amount, commission_rate,
        commission_amount, provider_payout, currency, status,
        created_at, updated_at
      ) VALUES (
        ${transactionNumber},
        ${validatedData.providerId}::bigint,
        ${bookingId}::bigint,
        'VENDOR',
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

    // Fetch the created booking with related data
    const booking = await prisma.$queryRaw<any[]>`
      SELECT 
        vb.*,
        json_build_object(
          'id', e.id,
          'name', e.name
        ) as event,
        json_build_object(
          'id', sp.id,
          'company_name', sp.company_name,
          'email', sp.email
        ) as provider
      FROM vendor_bookings vb
      LEFT JOIN events e ON e.id = vb.event_id
      LEFT JOIN service_providers sp ON sp.id = vb.provider_id
      WHERE vb.id = ${bookingId}::bigint
    `

    return NextResponse.json({
      success: true,
      booking: booking[0],
      message: 'Vendor booking created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Vendor booking creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create vendor booking',
      details: error.message
    }, { status: 500 })
  }
}
