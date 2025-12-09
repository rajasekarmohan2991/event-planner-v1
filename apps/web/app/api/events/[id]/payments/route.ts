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
    const tenantId = getTenantId()

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '50')
    const offset = page * size

    // Fetch payments using raw SQL to handle BigInt properly
    const [payments, totalResult] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT 
          p.id::text as id,
          p.registration_id::text as "registrationId",
          p.event_id::text as "eventId",
          p.user_id::text as "userId",
          COALESCE(p.amount_in_minor, 0)::numeric / 100 as amount,
          COALESCE(p.currency, 'INR') as currency,
          COALESCE(p.payment_method, 'CARD') as "paymentMethod",
          COALESCE(p.status, 'PENDING') as status,
          p.payment_details as "paymentDetails",
          p.stripe_payment_intent_id as "stripePaymentIntentId",
          p.created_at as "createdAt",
          p.updated_at as "updatedAt",
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
          COALESCE(r.email, '') as email
        FROM payments p
        LEFT JOIN registrations r ON p.registration_id = r.id
        WHERE p.event_id = ${eventId}
        ORDER BY p.created_at DESC
        LIMIT ${size} OFFSET ${offset}
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*)::int as count
        FROM payments
        WHERE event_id = ${eventId}
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
