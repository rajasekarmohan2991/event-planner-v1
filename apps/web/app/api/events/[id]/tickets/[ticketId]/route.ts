import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/tickets/[ticketId] - Get single ticket class details
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string, ticketId: string }> | { id: string, ticketId: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const params = 'then' in context.params ? await context.params : context.params
    const eventId = BigInt(params.id)
    const ticketId = BigInt(params.ticketId)

    // Fetch ticket class details
    const tickets = await prisma.$queryRaw`
      SELECT 
        id::text,
        event_id::text as "eventId",
        name,
        description,
        price_in_minor as "priceInMinor",
        quantity,
        sold,
        status,
        min_purchase as "minPurchase",
        max_purchase as "maxPurchase",
        sales_start_date as "salesStartDate",
        sales_end_date as "salesEndDate",
        requires_approval as "requiresApproval"
      FROM tickets
      WHERE id = ${ticketId}
        AND event_id = ${eventId}
      LIMIT 1
    ` as any[]

    if (tickets.length === 0) {
      return NextResponse.json(
        { error: 'Ticket class not found' },
        { status: 404 }
      )
    }

    const ticket = tickets[0]

    // Add computed fields
    const ticketWithDetails = {
      ...ticket,
      available: Number(ticket.quantity) - Number(ticket.sold),
      priceInRupees: Number(ticket.priceInMinor) / 100,
      isSoldOut: Number(ticket.sold) >= Number(ticket.quantity),
      isActive: ticket.status === 'ACTIVE'
    }

    return NextResponse.json(ticketWithDetails)
  } catch (error: any) {
    console.error('Error fetching ticket class:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket class', details: error.message },
      { status: 500 }
    )
  }
}
