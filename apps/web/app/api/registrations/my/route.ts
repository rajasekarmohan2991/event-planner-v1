import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

// GET /api/registrations/my - Get current user's registrations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    if (!session || !(session as any)?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userEmail = (session as any).user.email
    const userId = (session as any).user.id
    const tenantId = getTenantId()

    console.log('📋 Fetching registrations for user:', userEmail, userId, 'tenant:', tenantId)

    // Fetch registrations from database - tenant filter is optional
    const registrations = await prisma.$queryRaw`
      SELECT 
        r.id::text,
        r.event_id::text as "eventId",
        r.email,
        r.data_json as "dataJson",
        r.type,
        r.created_at as "createdAt",
        e.name as "eventName",
        e.starts_at as "eventDate",
        e.venue,
        e.city,
        e.status as "eventStatus"
      FROM registrations r
      LEFT JOIN events e ON r.event_id = e.id
      WHERE r.email = ${userEmail}
      ORDER BY r.created_at DESC
    `

    const formattedRegistrations = (registrations as any[]).map(reg => {
      let data: any = {}
      try {
        data = reg.dataJson ? JSON.parse(reg.dataJson) : {}
      } catch (e) {
        console.error('Failed to parse data_json:', e)
      }

      return {
        id: reg.id,
        eventId: reg.eventId,
        eventName: reg.eventName || 'Event',
        status: data.status || 'PENDING',
        registeredAt: reg.createdAt,
        eventDate: reg.eventDate,
        venue: reg.venue,
        city: reg.city,
        eventStatus: reg.eventStatus,
        ticketType: reg.type || 'GENERAL',
        numberOfAttendees: parseInt(data.numberOfAttendees || '1'),
        priceInr: parseFloat(data.priceInr || data.totalPrice || '0'),
        paymentStatus: data.paymentStatus || 'PENDING',
        paymentMethod: data.paymentMethod || 'ONLINE',
        email: reg.email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone || ''
      }
    })

    console.log('✅ Found', formattedRegistrations.length, 'registrations')

    return NextResponse.json({
      success: true,
      registrations: formattedRegistrations,
      totalCount: formattedRegistrations.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching user registrations:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch registrations',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
