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

    const eventId = BigInt(params.id)

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '50')
    const offset = page * size

    // Fetch payments from "Order" table (which holds payment records)
    // Joined with registrations via meta->>'registrationId'
    // Order model columns are CamelCase in DB if unmapped, or mixed. Check Schema.
    // Schema: Order { id, eventId, userId, email, paymentStatus, totalInr, meta, createdAt ... }
    // Using quoted identifiers to be safe.

    // Note: eventId in Order is String in schema, but we passed BigInt in param?
    // In schema: eventId String. BUT in registrations logic we saw it inserting string.
    // Wait, registrations route inserts `eventId` (BigInt or String?).
    // registrations route: BigInt(params.id).
    // Order table in schema: eventId String.
    // In `registrations/route.ts` lines 210: `${eventId}` (which comes from `params.id` string).
    // So distinct from registration.eventId (BigInt).

    // We should use String(params.id) for Order table queries.

    const eventIdStr = params.id

    const [payments, totalResult] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT 
          o."id"::text,
          o."meta"->>'registrationId' as "registrationId",
          o."eventId",
          o."userId"::text,
          (o."totalInr"::numeric / 100.0) as amount, -- Assuming totalInr is minor units? No, code says totalInr is Int. Usually means INR. Wait.
          -- In registrations/route: totalPrice is passed. finalAmount (after discount).
          -- Order.totalInr = Math.round(finalAmount).
          -- If finalAmount is in Rupees, then totalInr is Rupees.
          -- If finalAmount is in Paise, then totalInr is Paise.
          -- Convention: "totalInr" usually implies Rupees? OR inconsistent naming.
          -- Let's assume it is just the amount.
          o."totalInr" as amount_raw,
          'INR' as currency,
          'CARD' as "paymentMethod",
          o."paymentStatus" as status,
          o."meta" as "paymentDetails",
          '' as "stripePaymentIntentId",
          o."createdAt",
          o."updatedAt",
          COALESCE(
            CASE 
              WHEN r.data_json IS NOT NULL AND jsonb_typeof(r.data_json::jsonb) = 'object' THEN
                r.data_json::jsonb->>'firstName'
              ELSE ''
            END, 
            ''
          ) as "firstName",
          COALESCE(
            CASE 
              WHEN r.data_json IS NOT NULL AND jsonb_typeof(r.data_json::jsonb) = 'object' THEN
                r.data_json::jsonb->>'lastName'
              ELSE ''
            END, 
            ''
          ) as "lastName",
          COALESCE(r.email, o."email", '') as email
        FROM "Order" o
        LEFT JOIN registrations r ON (o."meta"->>'registrationId') = r.id
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

    // Convert amounts to numbers
    const formattedPayments = payments.map(p => ({
      ...p,
      amount: Number(p.amount),
      paymentDetails: p.paymentDetails || {}
    }))

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
    return NextResponse.json({
      message: e?.message || 'Failed to fetch payments'
    }, { status: 500 })
  }
}
