import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)

    // Query real sessions from database for this specific event
    const sessions = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        title,
        description,
        start_time as "startTime",
        end_time as "endTime",
        track,
        created_at as "createdAt"
      FROM sessions 
      WHERE event_id = ${eventId}
      ORDER BY start_time ASC
    `

    // If no sessions found, return empty array (not mock data)
    if (!sessions || (sessions as any[]).length === 0) {
      return NextResponse.json([])
    }

    return NextResponse.json(sessions)
  } catch (error: any) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
