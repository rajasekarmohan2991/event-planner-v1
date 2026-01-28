import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/payments - fetch payment history for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '50')
    const offset = page * size

    // We use params.id directly as string because Order.eventId is String in schema
    const eventIdStr = params.id

    // Check if Order table exists first
    const tableExists = await prisma.$queryRaw<any[]>`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'Order'
      ) as exists
    `
    
    if (!tableExists[0]?.exists) {
      return NextResponse.json({
        payments: [],
        pagination: { page, size, total: 0, totalPages: 0 }
      })
    }

    const [paymentsRaw, totalResult] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT 
          o."id"::text,
          o."meta"->>'registrationId' as "registrationId",
          o."eventId",
          o."userId"::text,
          o."totalInr" as amount_raw,
          'INR' as currency,
          'CARD' as "paymentMethod",
          o."paymentStatus" as status,
          o."meta" as "paymentDetails",
          '' as "stripePaymentIntentId",
          o."createdAt",
          o."updatedAt",
          r.email as "regEmail",
          o."email" as "orderEmail",
          r.data_json as "regDataJson"
        FROM "Order" o
        LEFT JOIN registrations r ON (o."meta"->>'registrationId')::text = r.id::text
        WHERE o."eventId" = ${eventIdStr}
        ORDER BY o."createdAt" DESC
        LIMIT ${size} OFFSET ${offset}
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count
        FROM "Order"
        WHERE "eventId" = ${eventIdStr}
      `
    ])

    const total = totalResult[0]?.count || 0

    // Process and parse in JS to avoid SQL JSON casting errors
    const formattedPayments = paymentsRaw.map(p => {
      // Parse registration data safely
      let regData: any = {}
      try {
        if (typeof p.regDataJson === 'string') {
          regData = JSON.parse(p.regDataJson)
        } else if (p.regDataJson && typeof p.regDataJson === 'object') {
          regData = p.regDataJson
        }
      } catch (e) {
        // ignore parse error
      }

      const firstName = regData.firstName || ''
      const lastName = regData.lastName || ''

      return {
        id: p.id,
        registrationId: p.registrationId,
        eventId: p.eventId,
        userId: p.userId,
        amount: Number(p.amount_raw) || 0,
        currency: p.currency,
        paymentMethod: p.paymentMethod,
        status: p.status,
        paymentDetails: p.paymentDetails || {},
        stripePaymentIntentId: p.stripePaymentIntentId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        firstName,
        lastName,
        email: p.regEmail || p.orderEmail || ''
      }
    })

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })
  } catch (e: any) {
    console.error('Error fetching payments:', e)
    
    // If table doesn't exist, return empty array
    if (e.message?.includes('does not exist') || e.code === 'P2021' || e.message?.includes('Order')) {
      return NextResponse.json({
        payments: [],
        pagination: { page: 0, size: 50, total: 0, totalPages: 0 }
      })
    }
    
    return NextResponse.json({
      payments: [],
      pagination: { page: 0, size: 50, total: 0, totalPages: 0 },
      error: e?.message || 'Failed to fetch payments'
    })
  }
}
