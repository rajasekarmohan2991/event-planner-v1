// Diagnostic API endpoint to check sessions for event 2
// Visit: http://localhost:3000/api/debug/check-sessions-event-2

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        console.log('🔍 Checking sessions for event ID 2...')

        // Check if sessions table exists
        const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sessions'
      ) as exists
    ` as any[]

        console.log('📋 Sessions table exists:', tableCheck[0]?.exists)

        if (!tableCheck[0]?.exists) {
            return NextResponse.json({
                error: 'Sessions table does not exist',
                solution: 'The table will be created automatically on first session creation'
            })
        }

        // Get all sessions for event 2
        const sessions = await prisma.$queryRaw`
      SELECT 
        id,
        title,
        description,
        start_time,
        end_time,
        room,
        track,
        created_at
      FROM sessions
      WHERE event_id = 2
      ORDER BY created_at DESC
    ` as any[]

        console.log(`✅ Found ${sessions.length} sessions for event 2`)

        // Get total sessions count
        const totalSessions = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sessions
    ` as any[]

        return NextResponse.json({
            eventId: 2,
            sessionsFound: sessions.length,
            totalSessionsInDb: totalSessions[0]?.count?.toString() || '0',
            sessions: sessions.map(s => ({
                id: s.id.toString(),
                title: s.title,
                description: s.description,
                startTime: s.start_time,
                endTime: s.end_time,
                room: s.room,
                track: s.track,
                createdAt: s.created_at
            })),
            message: sessions.length > 0
                ? `Found ${sessions.length} session(s) for event 2`
                : 'No sessions found for event 2. They may not have been created successfully.'
        })

    } catch (error: any) {
        console.error('❌ Error checking sessions:', error)
        return NextResponse.json({
            error: error.message,
            details: 'Failed to check sessions. See server logs for details.'
        }, { status: 500 })
    }
}
