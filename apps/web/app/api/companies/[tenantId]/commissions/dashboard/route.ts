import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { tenantId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { tenantId } = params
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30' // days

    // Get overall statistics
    const overallStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(booking_amount) as total_bookings_value,
        SUM(commission_amount) as total_commission,
        SUM(provider_payout) as total_payouts,
        AVG(commission_rate) as avg_commission_rate,
        COUNT(*) FILTER (WHERE status = 'PAID') as paid_count,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
        SUM(commission_amount) FILTER (WHERE status = 'PAID') as paid_commission,
        SUM(commission_amount) FILTER (WHERE status = 'PENDING') as pending_commission
      FROM commission_transactions
      WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '${period} days'
    `

    // Get breakdown by provider type
    const byProviderType = await prisma.$queryRaw<any[]>`
      SELECT 
        booking_type,
        COUNT(*) as count,
        SUM(booking_amount) as total_amount,
        SUM(commission_amount) as commission,
        AVG(commission_rate) as avg_rate
      FROM commission_transactions
      WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY booking_type
      ORDER BY commission DESC
    `

    // Get monthly trend (last 6 months)
    const monthlyTrend = await prisma.$queryRaw<any[]>`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        DATE_TRUNC('month', created_at) as month_date,
        COUNT(*) as transactions,
        SUM(booking_amount) as bookings_value,
        SUM(commission_amount) as commission
      FROM commission_transactions
      WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY month, month_date
      ORDER BY month_date ASC
    `

    // Get top providers by commission
    const topProviders = await prisma.$queryRaw<any[]>`
      SELECT 
        sp.id,
        sp.company_name,
        sp.provider_type,
        COUNT(ct.id) as transaction_count,
        SUM(ct.commission_amount) as total_commission,
        SUM(ct.booking_amount) as total_bookings
      FROM commission_transactions ct
      JOIN service_providers sp ON sp.id = ct.provider_id
      WHERE ct.tenant_id = ${tenantId}
      AND ct.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY sp.id, sp.company_name, sp.provider_type
      ORDER BY total_commission DESC
      LIMIT 10
    `

    // Get recent transactions
    const recentTransactions = await prisma.$queryRaw<any[]>`
      SELECT 
        ct.*,
        json_build_object(
          'id', sp.id,
          'company_name', sp.company_name,
          'provider_type', sp.provider_type
        ) as provider,
        json_build_object(
          'id', e.id,
          'name', e.name
        ) as event
      FROM commission_transactions ct
      LEFT JOIN service_providers sp ON sp.id = ct.provider_id
      LEFT JOIN events e ON e.id = ct.event_id
      WHERE ct.tenant_id = ${tenantId}
      ORDER BY ct.created_at DESC
      LIMIT 20
    `

    // Get payment status breakdown
    const paymentStatus = await prisma.$queryRaw<any[]>`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(commission_amount) as amount
      FROM commission_transactions
      WHERE tenant_id = ${tenantId}
      AND created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY status
    `

    return NextResponse.json({
      overview: overallStats[0] || {},
      byProviderType,
      monthlyTrend,
      topProviders,
      recentTransactions,
      paymentStatus,
      period: parseInt(period)
    })

  } catch (error: any) {
    console.error('Error fetching commission dashboard:', error)
    return NextResponse.json({
      error: 'Failed to fetch commission dashboard',
      details: error.message
    }, { status: 500 })
  }
}
