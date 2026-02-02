import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/refunds - Get all refunds (Admin/Super Admin only)
export async function GET(req: NextRequest) {
  try {
    // Check permission - only Admin and Super Admin can view refunds
    const permissionCheck = await checkPermissionInRoute(['payments.refund', 'admin.dashboard'], 'View Refunds')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '50')
    const offset = page * size

    // Build where clause
    let whereClause = 'WHERE 1=1'
    if (status) {
      whereClause += ` AND status = '${status}'`
    }

    // Fetch refunds with registration details
    const [refunds, totalResult] = await Promise.all([
      prisma.$queryRawUnsafe(`
        SELECT 
          r.id::text as id,
          r.registration_id::text as "registrationId",
          r.event_id::text as "eventId",
          r.amount,
          r.refund_type as "refundType",
          r.reason,
          r.status,
          r.payment_gateway as "paymentGateway",
          r.gateway_refund_id as "gatewayRefundId",
          r.processed_by::text as "processedBy",
          r.processed_at as "processedAt",
          r.created_at as "createdAt",
          reg.data_json as "registrationData"
        FROM refunds r
        LEFT JOIN registrations reg ON r.registration_id = reg.id
        ${whereClause}
        ORDER BY r.created_at DESC
        LIMIT ${size} OFFSET ${offset}
      `),
      prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count 
        FROM refunds r
        ${whereClause}
      `)
    ])

    const total = (totalResult as any)[0]?.count || 0

    const enhancedRefunds = (refunds as any[]).map(refund => ({
      ...refund,
      userName: refund.registrationData?.firstName + ' ' + refund.registrationData?.lastName || 'N/A',
      userEmail: refund.registrationData?.email || 'N/A'
    }))

    return NextResponse.json({
      refunds: enhancedRefunds,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })

  } catch (error: any) {
    console.error('Error fetching refunds:', error)
    return NextResponse.json({ error: 'Failed to fetch refunds' }, { status: 500 })
  }
}

// POST /api/admin/refunds - Create a new refund (Admin/Super Admin only)
export async function POST(req: NextRequest) {
  try {
    // Check permission - only Admin and Super Admin can process refunds
    const permissionCheck = await checkPermissionInRoute('payments.refund', 'Process Refund')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.registrationId || !body.amount || !body.refundType || !body.reason) {
      return NextResponse.json({
        error: 'Missing required fields: registrationId, amount, refundType, reason'
      }, { status: 400 })
    }

    // Validate refund type
    if (!['FULL', 'PARTIAL'].includes(body.refundType)) {
      return NextResponse.json({
        error: 'Invalid refund type. Must be FULL or PARTIAL'
      }, { status: 400 })
    }

    // Get registration details to validate refund amount
    const registration = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        event_id,
        data_json
      FROM registrations
      WHERE id = ${BigInt(body.registrationId)}
    `

    if (!(registration as any[])[0]) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    const reg = (registration as any[])[0]
    const paidAmount = reg.data_json?.finalAmount || 0

    // Validate refund amount
    if (body.amount > paidAmount) {
      return NextResponse.json({
        error: `Refund amount (₹${body.amount / 100}) cannot exceed paid amount (₹${paidAmount / 100})`
      }, { status: 400 })
    }

    // Check if refund already exists for this registration
    const existingRefund = await prisma.$queryRaw`
      SELECT id 
      FROM refunds 
      WHERE registration_id = ${BigInt(body.registrationId)}
      AND status IN ('PENDING', 'PROCESSING', 'COMPLETED')
      LIMIT 1
    `

    if ((existingRefund as any[]).length > 0) {
      return NextResponse.json({
        error: 'A refund request already exists for this registration'
      }, { status: 400 })
    }

    // Create refund record
    const refund = await prisma.$queryRaw`
      INSERT INTO refunds (
        registration_id,
        event_id,
        amount,
        refund_type,
        reason,
        status,
        payment_gateway,
        processed_by,
        created_at
      ) VALUES (
        ${BigInt(body.registrationId)},
        ${BigInt(reg.event_id)},
        ${body.amount},
        ${body.refundType},
        ${body.reason},
        'PENDING',
        ${body.paymentGateway || 'DUMMY'},
        ${BigInt((session.user as any).id)},
        NOW()
      )
      RETURNING 
        id::text as id,
        registration_id::text as "registrationId",
        amount,
        refund_type as "refundType",
        status,
        created_at as "createdAt"
    `

    const createdRefund = (refund as any[])[0]

    // Log refund creation
    console.log(`✅ Refund created: ${createdRefund.id} for registration ${body.registrationId}`)

    // TODO: Process actual refund with payment gateway
    // For demo purposes, we'll mark it as completed
    if (body.paymentGateway === 'DUMMY') {
      await prisma.$queryRaw`
        UPDATE refunds
        SET status = 'COMPLETED',
            processed_at = NOW(),
            gateway_refund_id = ${`REFUND-${Date.now()}`}
        WHERE id = ${BigInt(createdRefund.id)}
      `
    }

    return NextResponse.json({
      ...createdRefund,
      message: 'Refund request created successfully'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating refund:', error)
    return NextResponse.json({
      error: 'Failed to create refund',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
