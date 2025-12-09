import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/events/[id]/ticket-classes - Get all ticket classes for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const tickets = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id,
        event_id as "eventId",
        name,
        ticket_class as "ticketClass",
        is_free as "isFree",
        price_in_minor as "priceInMinor",
        currency,
        quantity,
        sold,
        min_purchase as "minPurchase",
        max_purchase as "maxPurchase",
        requires_approval as "requiresApproval",
        status,
        sales_start_at as "salesStartAt",
        sales_end_at as "salesEndAt",
        created_at as "createdAt"
      FROM tickets
      WHERE event_id = $1
      ORDER BY price_in_minor DESC
    `, BigInt(eventId))

    // Convert BigInt to Number for JSON serialization
    const safeTickets = tickets.map(t => ({
      id: Number(t.id),
      eventId: Number(t.eventId),
      name: t.name,
      ticketClass: t.ticketClass,
      isFree: t.isFree,
      priceInMinor: t.priceInMinor,
      priceInRupees: t.priceInMinor / 100, // Convert paise to rupees
      currency: t.currency,
      quantity: t.quantity,
      sold: t.sold,
      available: t.quantity - t.sold,
      minPurchase: t.minPurchase,
      maxPurchase: t.maxPurchase,
      requiresApproval: t.requiresApproval,
      status: t.status,
      salesStartAt: t.salesStartAt,
      salesEndAt: t.salesEndAt,
      createdAt: t.createdAt
    }))

    return NextResponse.json(safeTickets)
  } catch (e: any) {
    console.error('Error fetching ticket classes:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to load ticket classes',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

// POST /api/events/[id]/ticket-classes - Create a new ticket class
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { 
      name, 
      ticketClass, 
      isFree, 
      priceInRupees, 
      quantity, 
      minPurchase, 
      maxPurchase,
      requiresApproval,
      salesStartAt,
      salesEndAt
    } = body

    if (!name || !ticketClass || typeof quantity !== 'number') {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // Convert rupees to paise for storage
    const priceInMinor = isFree ? 0 : Math.round((priceInRupees || 0) * 100)

    const result = await prisma.$queryRawUnsafe(`
      INSERT INTO tickets (
        event_id, name, ticket_class, is_free, price_in_minor, currency,
        quantity, min_purchase, max_purchase, requires_approval,
        sales_start_at, sales_end_at, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING id, name, ticket_class as "ticketClass", price_in_minor as "priceInMinor"
    `, 
      BigInt(eventId),
      name,
      ticketClass,
      isFree || false,
      priceInMinor,
      'INR',
      quantity,
      minPurchase || 1,
      maxPurchase || 10,
      requiresApproval || false,
      salesStartAt ? new Date(salesStartAt) : null,
      salesEndAt ? new Date(salesEndAt) : null,
      'Open'
    )

    return NextResponse.json({
      success: true,
      message: 'Ticket class created successfully',
      ticket: result
    }, { status: 201 })
  } catch (e: any) {
    console.error('Error creating ticket class:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to create ticket class',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

// PUT /api/events/[id]/ticket-classes - Update a ticket class
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { 
      ticketId,
      name, 
      ticketClass, 
      isFree, 
      priceInRupees, 
      quantity, 
      minPurchase, 
      maxPurchase,
      requiresApproval,
      status
    } = body

    if (!ticketId) {
      return NextResponse.json({ message: 'Ticket ID required' }, { status: 400 })
    }

    const priceInMinor = isFree ? 0 : Math.round((priceInRupees || 0) * 100)

    await prisma.$queryRawUnsafe(`
      UPDATE tickets
      SET 
        name = $1,
        ticket_class = $2,
        is_free = $3,
        price_in_minor = $4,
        quantity = $5,
        min_purchase = $6,
        max_purchase = $7,
        requires_approval = $8,
        status = $9,
        updated_at = NOW()
      WHERE id = $10 AND event_id = $11
    `,
      name,
      ticketClass,
      isFree,
      priceInMinor,
      quantity,
      minPurchase,
      maxPurchase,
      requiresApproval,
      status,
      BigInt(ticketId),
      BigInt(eventId)
    )

    return NextResponse.json({
      success: true,
      message: 'Ticket class updated successfully'
    })
  } catch (e: any) {
    console.error('Error updating ticket class:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to update ticket class',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}
