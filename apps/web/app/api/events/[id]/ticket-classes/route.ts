
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'
export const dynamic = 'force-dynamic'

// GET /api/events/[id]/ticket-classes - Get all ticket classes for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    // Determine if eventID is stored as String or BigInt in Ticket table
    // Schema says Ticket.eventId is String.

    const tickets = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id,
        "eventId",
        name,
        name as "ticketClass", -- Map name to ticketClass for FE compatibility
        "priceInr" as "priceInMinor",
        currency,
        capacity,
        sold,
        "min_quantity" as "minPurchase",
        "max_quantity" as "maxPurchase",
        "requires_approval" as "requiresApproval",
        status,
        "sales_start_at" as "salesStartAt",
        "sales_end_at" as "salesEndAt",
        "createdAt"
      FROM "Ticket"
      WHERE "eventId" = $1
      ORDER BY "priceInr" DESC
    `, eventId) // Pass String eventId

    const safeTickets = tickets.map(t => ({
      id: t.id, // String CUID
      eventId: t.eventId,
      name: t.name,
      ticketClass: t.ticketClass,
      isFree: (t.priceInMinor || 0) === 0,
      priceInMinor: t.priceInMinor || 0,
      priceInRupees: (t.priceInMinor || 0) / 100,
      currency: t.currency,
      quantity: t.quantity,
      sold: t.sold,
      available: (t.quantity || 0) - (t.sold || 0),
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

    const finalName = name || ticketClass
    if (!finalName || typeof quantity !== 'number') {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch Tenant ID (Raw SQL from events table)
    // Event.id is BigInt
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" 
      FROM events 
      WHERE id = ${BigInt(eventId)} 
      LIMIT 1
    ` as any[]

    if (events.length === 0) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    const tenantId = events[0].tenantId

    // 2. Insert Ticket (Into "Ticket" table)
    const priceInMinor = isFree ? 0 : Math.round((priceInRupees || 0) * 100)
    const newId = crypto.randomUUID()

    await prisma.$executeRawUnsafe(`
      INSERT INTO "Ticket" (
        id, "eventId", "tenantId", name, "priceInr", currency,
        capacity, "min_quantity", "max_quantity", "requires_approval",
        "sales_start_at", "sales_end_at", status, "updatedAt", "createdAt", sold
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 0
      )
    `,
      newId,
      eventId.toString(), // Store as String in Ticket table
      tenantId, // String
      finalName,
      priceInMinor,
      'INR',
      quantity,
      minPurchase || 1,
      maxPurchase || 10,
      requiresApproval || false,
      salesStartAt ? new Date(salesStartAt) : null,
      salesEndAt ? new Date(salesEndAt) : null,
      'ACTIVE'
    )

    const ticket = {
      id: newId,
      name: finalName,
      priceInMinor,
      quantity,
      status: 'ACTIVE'
    }

    return NextResponse.json({
      success: true,
      message: 'Ticket class created successfully',
      ticket: ticket
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

    const finalName = name || ticketClass
    const priceInMinor = isFree ? 0 : Math.round((priceInRupees || 0) * 100)

    await prisma.$queryRawUnsafe(`
      UPDATE "Ticket"
      SET 
        name = $1,
        "priceInr" = $2,
        capacity = $3,
        "min_quantity" = $4,
        "max_quantity" = $5,
        "requires_approval" = $6,
        status = $7,
        "updatedAt" = NOW()
      WHERE id = $8 AND "eventId" = $9
    `,
      finalName,
      priceInMinor,
      quantity,
      minPurchase || 1,
      maxPurchase || 10,
      requiresApproval || false,
      status || 'ACTIVE',
      ticketId,
      eventId.toString()
    )

    return NextResponse.json({ success: true, message: 'Ticket updated' })
  } catch (e: any) {
    console.error('Error updating ticket class:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to update ticket class'
    }, { status: 500 })
  }
}
