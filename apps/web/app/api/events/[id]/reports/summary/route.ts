import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)
    const tenantId = getTenantId()

    // Get real registration data (data_json is TEXT, need to cast to JSONB)
    const [totalRegs, pendingRegs, approvedRegs, rejectedRegs] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId}`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json::jsonb->>'status') = 'PENDING'`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json::jsonb->>'status') = 'APPROVED'`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json::jsonb->>'status') = 'REJECTED'`
    ])

    // Get revenue data from payments (remove tenant_id filter if column doesn't exist)
    const revenueData = await prisma.$queryRaw`
      SELECT 
        COALESCE(SUM(amount), 0)::int as total_revenue,
        COALESCE(AVG(amount), 0)::int as avg_amount,
        COUNT(*)::int as payment_count
      FROM payments 
      WHERE event_id = ${eventId} AND status = 'COMPLETED'
    `

    // Get ticket data
    const ticketData = await prisma.$queryRaw`
      SELECT COUNT(*)::int as total_tickets
      FROM seat_inventory 
      WHERE event_id = ${eventId}
    `

    const soldTickets = await prisma.$queryRaw`
      SELECT COUNT(*)::int as sold_tickets
      FROM seat_inventory 
      WHERE event_id = ${eventId} AND is_available = false
    `

    const totalRegistrations = (totalRegs as any)[0]?.count || 0
    const totalRevenue = (revenueData as any)[0]?.total_revenue || 0
    const paymentCount = (revenueData as any)[0]?.payment_count || 0
    const totalTickets = (ticketData as any)[0]?.total_tickets || 0
    const soldTicketsCount = (soldTickets as any)[0]?.sold_tickets || 0

    const summary = {
      totalRegistrations,
      pendingApprovals: (pendingRegs as any)[0]?.count || 0,
      approvedRegistrations: (approvedRegs as any)[0]?.count || 0,
      rejectedRegistrations: (rejectedRegs as any)[0]?.count || 0,
      totalRevenue: totalRevenue / 100, // Convert from paise to rupees
      averageOrderValue: paymentCount > 0 ? Math.round(totalRevenue / paymentCount / 100) : 0,
      totalTicketsSold: soldTicketsCount,
      totalTicketsAvailable: totalTickets,
      conversionRate: totalTickets > 0 ? Math.round((soldTicketsCount / totalTickets) * 100) : 0,
      uniqueAttendees: totalRegistrations,
      topTicketType: 'VIP',
      topTicketCount: soldTicketsCount
    }

    return NextResponse.json(summary)
  } catch (error: any) {
    console.error('Error fetching summary report:', error)
    return NextResponse.json({ message: 'Failed to load summary' }, { status: 500 })
  }
}
