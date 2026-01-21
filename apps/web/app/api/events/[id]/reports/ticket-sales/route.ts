import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    // Get real ticket sales data from seat_inventory grouped by section
    const ticketSales = await prisma.$queryRaw`
      SELECT 
        section as "ticketName",
        seat_type as "ticketType",
        base_price as "priceInMinor",
        COUNT(*)::int as "quantityAvailable",
        COUNT(*) FILTER (WHERE is_available = false)::int as "quantitySold",
        COALESCE(SUM(CASE WHEN is_available = false THEN base_price ELSE 0 END), 0)::int as revenue
      FROM seat_inventory
      WHERE event_id = ${eventId}::bigint
      GROUP BY section, seat_type, base_price
      ORDER BY section
    `

    const formattedSales = (ticketSales as any[]).map((ticket, index) => {
      const quantitySold = ticket.quantitySold || 0
      const quantityAvailable = ticket.quantityAvailable || 0
      const percentageSold = quantityAvailable > 0 ? Math.round((quantitySold / quantityAvailable) * 100) : 0

      return {
        ticketId: index + 1,
        ticketName: ticket.ticketName || 'General',
        ticketType: ticket.ticketType || 'Standard',
        priceInMinor: ticket.priceInMinor || 5000,
        currency: 'INR',
        quantitySold,
        quantityAvailable,
        revenue: ticket.revenue || 0,
        percentageSold,
        status: percentageSold >= 100 ? 'Sold Out' : 'Open'
      }
    })

    return NextResponse.json(formattedSales)
  } catch (error: any) {
    console.error('Error fetching ticket sales report:', error)
    return NextResponse.json({ message: 'Failed to load ticket sales' }, { status: 500 })
  }
}
