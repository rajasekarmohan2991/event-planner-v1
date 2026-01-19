import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/tickets - List all active ticket classes for an event
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a Promise (Next.js 15+)
    const params = 'then' in context.params ? await context.params : context.params
    const eventId = BigInt(params.id)

    // Fetch all active ticket classes for this event
    const tickets = await prisma.$queryRaw`
      SELECT 
        id::text,
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
      WHERE event_id = ${eventId}
        AND status = 'ACTIVE'
      ORDER BY price_in_minor DESC
    ` as any[]

    // Calculate availability for each ticket
    const ticketsWithAvailability = tickets.map(ticket => ({
      ...ticket,
      available: Number(ticket.quantity) - Number(ticket.sold),
      priceInRupees: Number(ticket.priceInMinor) / 100,
      isSoldOut: Number(ticket.sold) >= Number(ticket.quantity)
    }))

    return NextResponse.json({
      tickets: ticketsWithAvailability,
      total: tickets.length
    })
  } catch (error: any) {
    console.error('Error fetching ticket classes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket classes', details: error.message },
      { status: 500 }
    )
  }
}
