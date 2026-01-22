import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { z } from 'zod'
import { calculateCommission } from '@/types/provider'

const createExhibitorBookingSchema = z.object({
  eventId: z.number(),
  exhibitorId: z.number(),
  boothNumber: z.string().optional(),
  boothSize: z.string().optional(),
  boothType: z.enum(['STANDARD', 'PREMIUM', 'CORNER', 'ISLAND', 'CUSTOM']),
  boothLocation: z.string().optional(),
  boothRentalFee: z.number().positive(),
  additionalServices: z.array(z.object({
    name: z.string(),
    price: z.number()
  })).default([]),
  specialRequirements: z.string().optional()
})

function generateBookingNumber(tenantId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `EB-${tenantId.substring(0, 4).toUpperCase()}-${timestamp}-${random}`
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
    const exhibitorId = searchParams.get('exhibitorId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_exhibitor_management FROM tenants WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_exhibitor_management) {
      return NextResponse.json({
        error: 'Exhibitor management module is not enabled'
      }, { status: 403 })
    }

    let whereConditions = [`eb.tenant_id = '${tenantId}'`]
    if (eventId) whereConditions.push(`eb.event_id = ${eventId}`)
    if (exhibitorId) whereConditions.push(`eb.exhibitor_id = ${exhibitorId}`)
    if (status) whereConditions.push(`eb.status = '${status}'`)

    const whereClause = whereConditions.join(' AND ')

    const countResult = await prisma.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*)::int as total FROM exhibitor_bookings eb WHERE ${whereClause}
    `)
    const total = countResult[0]?.total || 0

    const bookings = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        eb.*,
        json_build_object('id', e.id, 'name', e.name, 'start_date', e.start_date) as event,
        json_build_object('id', sp.id, 'company_name', sp.company_name, 'email', sp.email) as exhibitor
      FROM exhibitor_bookings eb
      LEFT JOIN events e ON e.id = eb.event_id
      LEFT JOIN service_providers sp ON sp.id = eb.exhibitor_id
      WHERE ${whereClause}
      ORDER BY eb.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `)

    const stats = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        SUM(total_amount) as total_amount,
        SUM(commission_amount) as total_commission
      FROM exhibitor_bookings WHERE ${whereClause}
    `)

    return NextResponse.json({
      bookings,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      statistics: stats[0] || {}
    })
  } catch (error: any) {
    console.error('Error fetching exhibitor bookings:', error)
    return NextResponse.json({
      error: 'Failed to fetch exhibitor bookings',
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
    const validatedData = createExhibitorBookingSchema.parse(body)

    const tenant = await prisma.$queryRaw<any[]>`
      SELECT module_exhibitor_management, provider_commission_rate
      FROM tenants WHERE id = ${tenantId}
    `

    if (!tenant[0]?.module_exhibitor_management) {
      return NextResponse.json({
        error: 'Exhibitor management module is not enabled'
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

    const exhibitor = await prisma.$queryRaw<any[]>`
      SELECT id, commission_rate FROM service_providers 
      WHERE id = ${validatedData.exhibitorId}::bigint 
      AND tenant_id = ${tenantId}
      AND provider_type = 'EXHIBITOR'
      AND is_active = true
    `

    if (!exhibitor[0]) {
      return NextResponse.json({
        error: 'Exhibitor not found or not active'
      }, { status: 404 })
    }

    // Calculate total amount including additional services
    const additionalServicesTotal = validatedData.additionalServices.reduce(
      (sum, service) => sum + service.price, 
      0
    )
    const totalAmount = validatedData.boothRentalFee + additionalServicesTotal

    const commissionRate = exhibitor[0].commission_rate || tenant[0].provider_commission_rate || 18.00
    const commission = calculateCommission(totalAmount, commissionRate)
    const bookingNumber = generateBookingNumber(tenantId)

    const bookingResult = await prisma.$queryRaw<any[]>`
      INSERT INTO exhibitor_bookings (
        booking_number, event_id, tenant_id, exhibitor_id,
        booth_number, booth_size, booth_type, booth_location,
        booth_rental_fee, additional_services, total_amount, currency,
        commission_rate, commission_amount, exhibitor_payout,
        status, payment_status, special_requirements,
        created_at, updated_at
      ) VALUES (
        ${bookingNumber},
        ${validatedData.eventId}::bigint,
        ${tenantId},
        ${validatedData.exhibitorId}::bigint,
        ${validatedData.boothNumber || null},
        ${validatedData.boothSize || null},
        ${validatedData.boothType},
        ${validatedData.boothLocation || null},
        ${validatedData.boothRentalFee},
        ${JSON.stringify(validatedData.additionalServices)}::jsonb,
        ${totalAmount},
        'INR',
        ${commission.commissionRate},
        ${commission.commissionAmount},
        ${commission.providerPayout},
        'PENDING',
        'UNPAID',
        ${validatedData.specialRequirements || null},
        NOW(),
        NOW()
      )
      RETURNING id
    `

    const bookingId = bookingResult[0]?.id
    const transactionNumber = `CT-${bookingNumber}`

    await prisma.$executeRaw`
      INSERT INTO commission_transactions (
        transaction_number, provider_id, booking_id, booking_type,
        event_id, tenant_id, booking_amount, commission_rate,
        commission_amount, provider_payout, currency, status,
        created_at, updated_at
      ) VALUES (
        ${transactionNumber},
        ${validatedData.exhibitorId}::bigint,
        ${bookingId}::bigint,
        'EXHIBITOR',
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

    const booking = await prisma.$queryRaw<any[]>`
      SELECT 
        eb.*,
        json_build_object('id', e.id, 'name', e.name) as event,
        json_build_object('id', sp.id, 'company_name', sp.company_name) as exhibitor
      FROM exhibitor_bookings eb
      LEFT JOIN events e ON e.id = eb.event_id
      LEFT JOIN service_providers sp ON sp.id = eb.exhibitor_id
      WHERE eb.id = ${bookingId}::bigint
    `

    return NextResponse.json({
      success: true,
      booking: booking[0],
      message: 'Exhibitor booking created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Exhibitor booking creation error:', error)

    if (error.name === 'ZodError') {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      error: 'Failed to create exhibitor booking',
      details: error.message
    }, { status: 500 })
  }
}
