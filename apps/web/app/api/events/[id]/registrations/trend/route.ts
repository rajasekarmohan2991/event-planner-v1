import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Get registrations using correct database schema
    const eventIdNum = parseInt(eventId)
    
    const registrations = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM registrations 
      WHERE event_id = ${eventIdNum} 
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `.catch(() => [])

    // Convert to expected format
    const trend = (registrations as any[]).map(row => ({
      date: row.date,
      count: row.count
    }))

    return NextResponse.json(trend)
  } catch (e: any) {
    console.error('Trend error:', e)
    return NextResponse.json([])
  }
}
