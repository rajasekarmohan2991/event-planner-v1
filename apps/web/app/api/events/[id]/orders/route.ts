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
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build where conditions
    let whereConditions = [`r.event_id = ${eventId}`]
    
    if (q.trim()) {
      whereConditions.push(`(
        LOWER(r.email) LIKE LOWER('%${q.trim()}%') OR 
        LOWER((r.data_json->>'firstName')::text) LIKE LOWER('%${q.trim()}%') OR
        LOWER((r.data_json->>'lastName')::text) LIKE LOWER('%${q.trim()}%') OR
        r.id::text LIKE '%${q.trim()}%'
      )`)
    }
    
    if (status) {
      whereConditions.push(`(r.data_json->>'paymentStatus')::text = '${status}'`)
    }

    const whereClause = whereConditions.join(' AND ')

    // Get orders from registrations table
    const orders = await prisma.$queryRaw`
      SELECT 
        r.id::text as "orderId",
        r.id::text as "registrationId", 
        r.email as "buyerEmail",
        r.data_json->>'firstName' as "firstName",
        r.data_json->>'lastName' as "lastName",
        r.data_json->>'phone' as "phone",
        r.type as "ticketType",
        COALESCE((r.data_json->>'priceInr')::numeric, 0) as "totalInr",
        COALESCE(r.data_json->>'paymentStatus', 'PENDING') as "paymentStatus",
        COALESCE(r.data_json->>'paymentMethod', 'Unknown') as "paymentMethod",
        r.data_json->>'promoCode' as "promoCode",
        r.created_at as "createdAt",
        r.data_json->>'qrData' as "qrCode"
      FROM registrations r
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `

    // Get total count
    const totalResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM registrations r  
      WHERE ${whereClause}
    `
    
    const total = Number((totalResult as any[])[0]?.count || 0)

    // Format the response to match expected structure
    const formattedOrders = (orders as any[]).map(order => ({
      id: order.orderId,
      orderId: order.orderId,
      registrationId: order.registrationId,
      attendeeName: `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'Unknown',
      buyerEmail: order.buyerEmail,
      attendeeEmail: order.buyerEmail,
      attendeePhone: order.phone,
      ticketType: order.ticketType,
      totalInr: Number(order.totalInr || 0),
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      promoCode: order.promoCode,
      createdAt: order.createdAt,
      qrCode: order.qrCode
    }))

    return NextResponse.json({
      items: formattedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error: any) {
    console.error('Orders API error:', error)
    return NextResponse.json({ 
      message: error?.message || 'Failed to fetch orders',
      items: []
    }, { status: 500 })
  }
}
