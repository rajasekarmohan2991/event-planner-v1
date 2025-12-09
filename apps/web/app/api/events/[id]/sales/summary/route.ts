import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/sales/summary - Get real sales data
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    // Get total registrations
    const registrationsResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM registrations
      WHERE event_id = ${eventId}
    ` as any[]
    const totalRegistrations = registrationsResult[0]?.count || 0

    // Get total revenue from payments
    const revenueResult = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount_in_minor), 0)::bigint as total_minor,
        COUNT(*)::int as payment_count
      FROM payments
      WHERE event_id = ${eventId}
        AND status IN ('SUCCEEDED', 'COMPLETED', 'PAID')
    ` as any[]
    
    const totalRevenue = Number(revenueResult[0]?.total_minor || 0) / 100 // Convert from minor units
    const paidCount = revenueResult[0]?.payment_count || 0

    // Get event capacity
    const eventResult = await prisma.$queryRaw`
      SELECT capacity
      FROM events
      WHERE id = ${eventId}
    ` as any[]
    const capacity = eventResult[0]?.capacity || 0

    // Calculate conversion rate
    const conversionRate = capacity > 0 ? (totalRegistrations / capacity) * 100 : 0

    // Calculate average order value
    const avgOrderValue = paidCount > 0 ? totalRevenue / paidCount : 0

    // Get ticket sales by type (from seat reservations)
    const ticketSales = await prisma.$queryRaw`
      SELECT 
        si.seat_type as type,
        COUNT(*)::int as sold,
        SUM(sr.price_paid)::decimal as revenue
      FROM seat_reservations sr
      JOIN seat_inventory si ON sr.seat_id = si.id
      WHERE sr.event_id = ${eventId}
        AND sr.status IN ('CONFIRMED', 'RESERVED')
      GROUP BY si.seat_type
      ORDER BY revenue DESC
    ` as any[]

    // Get top performing ticket type
    const topTicket = ticketSales.length > 0 ? {
      type: ticketSales[0].type,
      sold: Number(ticketSales[0].sold),
      revenue: Number(ticketSales[0].revenue || 0)
    } : {
      type: 'VIP Pass',
      sold: 0,
      revenue: 0
    }

    // Get tickets available
    const availableSeats = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM seat_inventory
      WHERE event_id = ${eventId}
        AND is_available = true
    ` as any[]
    const ticketsAvailable = availableSeats[0]?.count || 0

    const ticketsSold = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM seat_reservations
      WHERE event_id = ${eventId}
        AND status IN ('CONFIRMED', 'RESERVED')
    ` as any[]
    const soldCount = ticketsSold[0]?.count || 0

    return NextResponse.json({
      overview: {
        totalRegistrations,
        totalRevenue: totalRevenue.toFixed(2),
        conversionRate: conversionRate.toFixed(1),
        avgOrderValue: avgOrderValue.toFixed(2)
      },
      topPerformingTicket: topTicket,
      salesOverview: {
        ticketsSold: soldCount,
        ticketsAvailable,
        revenue: totalRevenue.toFixed(2)
      },
      ticketSales: ticketSales.map(t => ({
        type: t.type,
        sold: Number(t.sold),
        revenue: Number(t.revenue || 0).toFixed(2)
      }))
    })
  } catch (error: any) {
    console.error('Sales summary error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales summary' },
      { status: 500 }
    )
  }
}
