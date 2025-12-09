import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    
    const role = String(((session as any).user?.role) || '')
    if (!['SUPER_ADMIN', 'ADMIN'].includes(role)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')
    const period = searchParams.get('period') || '30' // days

    // Payment analytics query
    const paymentStats = await prisma.$queryRaw`
      SELECT 
        COUNT(*)::int as total_payments,
        SUM(CAST((data_json->>'priceInr')::numeric AS numeric))::int as total_revenue,
        AVG(CAST((data_json->>'priceInr')::numeric AS numeric))::int as avg_payment,
        COUNT(CASE WHEN data_json->'payment'->>'status' = 'completed' THEN 1 END)::int as successful_payments,
        COUNT(CASE WHEN data_json->'payment'->>'status' = 'failed' THEN 1 END)::int as failed_payments,
        COUNT(CASE WHEN type = 'VIP' THEN 1 END)::int as vip_registrations,
        COUNT(CASE WHEN type = 'GENERAL' THEN 1 END)::int as general_registrations
      FROM registrations 
      WHERE 
        created_at >= NOW() - INTERVAL '${period} days'
        ${eventId ? prisma.$queryRaw`AND event_id = ${parseInt(eventId)}` : prisma.$queryRaw``}
    `

    // Payment methods breakdown
    const paymentMethods = await prisma.$queryRaw`
      SELECT 
        data_json->'payment'->>'method' as payment_method,
        COUNT(*)::int as count,
        SUM(CAST((data_json->>'priceInr')::numeric AS numeric))::int as revenue
      FROM registrations 
      WHERE 
        data_json->'payment'->>'method' IS NOT NULL
        AND created_at >= NOW() - INTERVAL '${period} days'
        ${eventId ? prisma.$queryRaw`AND event_id = ${parseInt(eventId)}` : prisma.$queryRaw``}
      GROUP BY data_json->'payment'->>'method'
      ORDER BY count DESC
    `

    // Daily revenue trend
    const dailyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as registrations,
        SUM(CAST((data_json->>'priceInr')::numeric AS numeric))::int as revenue
      FROM registrations 
      WHERE 
        created_at >= NOW() - INTERVAL '${period} days'
        ${eventId ? prisma.$queryRaw`AND event_id = ${parseInt(eventId)}` : prisma.$queryRaw``}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `

    // Top events by revenue
    const topEvents = await prisma.$queryRaw`
      SELECT 
        r.event_id,
        COUNT(*)::int as registrations,
        SUM(CAST((r.data_json->>'priceInr')::numeric AS numeric))::int as revenue,
        e.name as event_name
      FROM registrations r
      LEFT JOIN events e ON e.id = r.event_id
      WHERE r.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY r.event_id, e.name
      ORDER BY revenue DESC
      LIMIT 10
    `

    // Promo code usage
    const promoUsage = await prisma.$queryRaw`
      SELECT 
        data_json->>'promoCode' as promo_code,
        COUNT(*)::int as usage_count,
        SUM(CAST((data_json->>'priceInr')::numeric AS numeric))::int as revenue_with_promo
      FROM registrations 
      WHERE 
        data_json->>'promoCode' IS NOT NULL
        AND data_json->>'promoCode' != ''
        AND created_at >= NOW() - INTERVAL '${period} days'
        ${eventId ? prisma.$queryRaw`AND event_id = ${parseInt(eventId)}` : prisma.$queryRaw``}
      GROUP BY data_json->>'promoCode'
      ORDER BY usage_count DESC
      LIMIT 10
    `

    return NextResponse.json({
      summary: (paymentStats as any)[0] || {},
      paymentMethods: paymentMethods || [],
      dailyRevenue: dailyRevenue || [],
      topEvents: topEvents || [],
      promoUsage: promoUsage || [],
      period: parseInt(period)
    })

  } catch (error: any) {
    console.error('Payment analytics error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
