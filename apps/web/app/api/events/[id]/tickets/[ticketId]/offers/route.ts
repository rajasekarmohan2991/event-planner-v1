import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'
export const dynamic = 'force-dynamic'

// GET /api/events/[id]/tickets/[ticketId]/offers - Get all offers for a ticket
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> | { id: string; ticketId: string } }
) {
  const params = 'then' in context.params ? await context.params : context.params

  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const eventId = BigInt(params.id)
    const ticketId = BigInt(params.ticketId)

    const offers = await prisma.$queryRaw`
      SELECT 
        id, ticket_id as "ticketId", event_id as "eventId",
        offer_name as "offerName", offer_type as "offerType", 
        offer_amount as "offerAmount",
        min_quantity as "minQuantity", max_quantity as "maxQuantity",
        valid_from as "validFrom", valid_until as "validUntil",
        is_active as "isActive", usage_count as "usageCount",
        max_usage as "maxUsage",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM ticket_class_offers
      WHERE ticket_id = ${ticketId} AND event_id = ${eventId}
      ORDER BY created_at DESC
    ` as any[]

    return NextResponse.json({ offers })
  } catch (error: any) {
    console.error('Error fetching ticket offers:', error)
    return NextResponse.json({ message: 'Failed to fetch offers' }, { status: 500 })
  }
}

// POST /api/events/[id]/tickets/[ticketId]/offers - Create a new offer
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string; ticketId: string }> | { id: string; ticketId: string } }
) {
  const params = 'then' in context.params ? await context.params : context.params

  try {
    const session = await getServerSession(authOptions as any)
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const {
      offerName,
      offerType,
      offerAmount,
      minQuantity,
      maxQuantity,
      validFrom,
      validUntil,
      maxUsage
    } = body

    // Validation
    if (!offerName || !offerType || offerAmount === undefined) {
      return NextResponse.json({
        message: 'Offer name, type, and amount are required'
      }, { status: 400 })
    }

    if (offerType !== 'PERCENTAGE' && offerType !== 'FIXED') {
      return NextResponse.json({
        message: 'Offer type must be PERCENTAGE or FIXED'
      }, { status: 400 })
    }

    // Ensure schema exists
    try {
      await ensureSchema()
    } catch (e) {
      console.warn('Schema check failed:', e)
    }

    const eventId = BigInt(params.id)
    const ticketId = BigInt(params.ticketId)
    const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Get tenant ID from event
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (events.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const tenantId = events[0].tenantId

    await prisma.$executeRaw`
      INSERT INTO ticket_class_offers (
        id, ticket_id, event_id, tenant_id,
        offer_name, offer_type, offer_amount,
        min_quantity, max_quantity,
        valid_from, valid_until,
        is_active, usage_count, max_usage,
        created_at, updated_at
      ) VALUES (
        ${offerId}, ${ticketId}, ${eventId}, ${tenantId},
        ${offerName}, ${offerType}, ${offerAmount},
        ${minQuantity || 1}, ${maxQuantity || null},
        ${validFrom ? new Date(validFrom) : null}, ${validUntil ? new Date(validUntil) : null},
        true, 0, ${maxUsage || null},
        NOW(), NOW()
      )
    `

    return NextResponse.json({
      message: 'Offer created successfully',
      offerId
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating ticket offer:', error)
    return NextResponse.json({
      message: 'Failed to create offer',
      details: error.message
    }, { status: 500 })
  }
}
