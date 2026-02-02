import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const eventId = params.id

    // Get registration trend for the last 14 days
    const trend = await prisma.$queryRaw<Array<{ date: string; count: number }>>`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count
      FROM registrations
      WHERE event_id = ${eventId}::bigint
        AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `

    // Fill in missing dates with zero counts
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      return date.toISOString().split('T')[0]
    })

    const trendMap = new Map(trend.map(t => [t.date, t.count]))
    const completeTrend = last14Days.map(date => ({
      date,
      count: trendMap.get(date) || 0
    }))

    return NextResponse.json(completeTrend)

  } catch (error: any) {
    console.error('Registration trend API error:', error)

    // If table doesn't exist, return empty trend data
    if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (13 - i))
        return { date: date.toISOString().split('T')[0], count: 0 }
      })
      return NextResponse.json(last14Days)
    }

    return NextResponse.json({
      error: 'Failed to fetch registration trend',
      details: error.message
    }, { status: 500 })
  }
}
