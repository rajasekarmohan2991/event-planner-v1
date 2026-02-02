import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/features/streaming/status
 * Update stream status (start, stop, error)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { streamId, status, viewerCount, recordingUrl } = body

    console.log('[STREAMING STATUS] Updating stream:', streamId, 'to status:', status)

    // Validate stream exists
    const stream = await prisma.$queryRaw`
      SELECT id, status as "currentStatus", peak_viewers as "peakViewers"
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    ` as any[]

    if (!stream.length) {
      return NextResponse.json({ message: 'Stream not found' }, { status: 404 })
    }

    const currentData = stream[0]

    // Update stream based on status
    if (status === 'live') {
      await prisma.$executeRaw`
        UPDATE live_streams
        SET 
          status = 'live',
          started_at = COALESCE(started_at, NOW()),
          viewer_count = ${viewerCount || 0},
          peak_viewers = GREATEST(peak_viewers, ${viewerCount || 0}),
          updated_at = NOW()
        WHERE id = ${streamId}
      `
    } else if (status === 'ended') {
      await prisma.$executeRaw`
        UPDATE live_streams
        SET 
          status = 'ended',
          ended_at = NOW(),
          viewer_count = 0,
          recording_url = ${recordingUrl || null},
          updated_at = NOW()
        WHERE id = ${streamId}
      `

      // Mark all viewers as inactive
      await prisma.$executeRaw`
        UPDATE stream_viewers
        SET 
          is_active = false,
          left_at = NOW(),
          updated_at = NOW()
        WHERE stream_id = ${streamId} AND is_active = true
      `
    } else if (status === 'error') {
      await prisma.$executeRaw`
        UPDATE live_streams
        SET 
          status = 'error',
          updated_at = NOW()
        WHERE id = ${streamId}
      `
    }

    // Create analytics snapshot
    try {
      const snapshotId = crypto.randomUUID()
      await prisma.$executeRaw`
        INSERT INTO stream_analytics (
          id, stream_id, viewer_count, snapshot_at
        ) VALUES (
          ${snapshotId},
          ${streamId},
          ${viewerCount || 0},
          NOW()
        )
      `
    } catch (e) {
      console.warn('[STREAMING STATUS] Failed to create analytics snapshot:', e)
    }

    return NextResponse.json({
      message: 'Stream status updated',
      status
    })

  } catch (error: any) {
    console.error('[STREAMING STATUS] Error:', error)
    return NextResponse.json({
      message: 'Failed to update stream status',
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/features/streaming/status?streamId=xxx
 * Get current stream status and analytics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const streamId = searchParams.get('streamId')

    if (!streamId) {
      return NextResponse.json({ message: 'Stream ID required' }, { status: 400 })
    }

    // Get stream status
    const stream = await prisma.$queryRaw`
      SELECT 
        id, status, viewer_count as "viewerCount", peak_viewers as "peakViewers",
        started_at as "startedAt", ended_at as "endedAt",
        recording_url as "recordingUrl", title
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    ` as any[]

    if (!stream.length) {
      return NextResponse.json({ message: 'Stream not found' }, { status: 404 })
    }

    const streamData = stream[0]

    // Get active viewer count
    const activeViewers = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM stream_viewers
      WHERE stream_id = ${streamId} AND is_active = true
    ` as any[]

    // Get total messages count
    const messageCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM stream_chat
      WHERE stream_id = ${streamId} AND is_deleted = false
    ` as any[]

    // Calculate stream duration
    let duration = 0
    if (streamData.startedAt) {
      const endTime = streamData.endedAt || new Date()
      duration = Math.floor((endTime.getTime() - streamData.startedAt.getTime()) / 1000)
    }

    return NextResponse.json({
      stream: {
        ...streamData,
        activeViewers: activeViewers[0]?.count || 0,
        totalMessages: messageCount[0]?.count || 0,
        duration,
        isLive: streamData.status === 'live'
      }
    })

  } catch (error: any) {
    console.error('[STREAMING STATUS GET] Error:', error)
    return NextResponse.json({
      message: 'Failed to get stream status',
      error: error.message
    }, { status: 500 })
  }
}
