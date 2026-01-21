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

    // Fallback: Check for unassigned registrations (orphaned from seats)
    const regRes = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId}::bigint`
    const totalRegs = regRes[0]?.count || 0
    const totalSeatsSold = formattedSales.reduce((acc, t) => acc + t.quantitySold, 0)

    if (totalRegs > totalSeatsSold) {
      const orphans = totalRegs - totalSeatsSold
      // Try to approximate revenue from Orders for these orphans
      // We know total revenue from Overview (~4620). We know seat revenue (~0).
      // So orphan revenue is likely Total Order Revenue - Total Seat Revenue.
      const orderRevRes = await prisma.$queryRaw<any[]>`SELECT COALESCE(SUM("totalInr"), 0)::int as revenue FROM "Order" WHERE "eventId" = ${String(eventId)} AND "paymentStatus" = 'COMPLETED'`
      const totalOrderRev = orderRevRes[0]?.revenue || 0
      const totalSeatRev = formattedSales.reduce((acc, t) => acc + t.revenue, 0)
      const orphanRevenue = Math.max(0, totalOrderRev - totalSeatRev)

      formattedSales.push({
        ticketId: 999, // Virtual ID
        ticketName: 'General / Unassigned',
        ticketType: 'General',
        priceInMinor: 0,
        currency: 'INR',
        quantitySold: orphans,
        quantityAvailable: orphans, // Assume flexible
        revenue: orphanRevenue,
        percentageSold: 100,
        status: 'Sold Only'
      })
    }

    return NextResponse.json(formattedSales)
  } catch (error: any) {
    console.error('Error fetching ticket sales report:', error)
    return NextResponse.json({ message: 'Failed to load ticket sales' }, { status: 500 })
  }
}
