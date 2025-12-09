import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    
    console.log(`📊 Fetching live check-in stats for event ${eventId}`)

    // Get live check-in statistics
    const [
      totalRegistrations,
      checkedInCount,
      recentCheckins
    ] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId}`,
      prisma.$queryRaw`SELECT COUNT(*)::int as count FROM registrations WHERE event_id = ${eventId} AND (data_json->>'checkedIn')::boolean = true`,
      prisma.$queryRaw`
        SELECT 
          id::text as id,
          data_json,
          created_at as "createdAt"
        FROM registrations 
        WHERE event_id = ${eventId} 
          AND (data_json->>'checkedIn')::boolean = true
        ORDER BY (data_json->>'checkedInAt')::timestamp DESC
        LIMIT 10
      `
    ])

    const total = (totalRegistrations as any)[0]?.count || 0
    const checkedIn = (checkedInCount as any)[0]?.count || 0
    const recent = (recentCheckins as any[]).map(item => {
      const data = item.data_json || {}
      return {
        id: item.id,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        email: data.email || '',
        checkedInAt: data.checkedInAt || null,
        checkedInBy: data.checkedInBy || null
      }
    })

    return NextResponse.json({
      total,
      checkedIn,
      remaining: total - checkedIn,
      percentage: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
      recentCheckins: recent,
      lastUpdated: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Live check-in stats error:', error)
    return NextResponse.json({ 
      message: error?.message || 'Failed to fetch live check-in stats',
      error: error.code || 'UNKNOWN_ERROR'
    }, { status: 500 })
  }
}
