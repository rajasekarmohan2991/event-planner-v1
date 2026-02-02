import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateAgoraToken } from '@/features/live-streaming/lib/agora-client'

export const dynamic = 'force-dynamic'

/**
 * GET /api/features/streaming/token?streamId=xxx&role=subscriber
 * Generate viewing token for attendees
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    const { searchParams } = new URL(req.url)
    const streamId = searchParams.get('streamId')
    const role = searchParams.get('role') || 'subscriber'

    if (!streamId) {
      return NextResponse.json({ message: 'Stream ID required' }, { status: 400 })
    }

    // Get stream details
    const stream = await prisma.$queryRaw`
      SELECT 
        id, channel_name as "channelName", status, access_level as "accessLevel",
        event_id as "eventId", session_id as "sessionId"
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    ` as any[]

    if (!stream.length) {
      return NextResponse.json({ message: 'Stream not found' }, { status: 404 })
    }

    const streamData = stream[0]

    // Check access control
    if (streamData.accessLevel !== 'public' && !session) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 })
    }

    // TODO: Implement ticket-based access control
    // For now, allow all authenticated users

    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''

    if (!appId) {
      return NextResponse.json({ 
        message: 'Streaming not configured' 
      }, { status: 500 })
    }

    // Generate unique UID for this viewer
    const uid = Math.floor(Math.random() * 1000000)

    // Generate token
    const token = appCertificate
      ? generateAgoraToken(
          appId, 
          appCertificate, 
          streamData.channelName, 
          uid, 
          role as 'publisher' | 'subscriber', 
          3600
        )
      : ''

    // Track viewer
    if (session?.user?.id) {
      const viewerId = crypto.randomUUID()
      const sessionToken = crypto.randomBytes(32).toString('hex')

      try {
        await prisma.$executeRaw`
          INSERT INTO stream_viewers (
            id, stream_id, user_id, session_token, is_active
          ) VALUES (
            ${viewerId},
            ${streamId},
            ${BigInt((session.user as any).id)},
            ${sessionToken},
            true
          )
        `
      } catch (e) {
        console.warn('[STREAMING TOKEN] Failed to track viewer:', e)
      }
    }

    return NextResponse.json({
      token,
      uid,
      channelName: streamData.channelName,
      appId,
      role
    })

  } catch (error: any) {
    console.error('[STREAMING TOKEN] Error:', error)
    return NextResponse.json({
      message: 'Failed to generate token',
      error: error.message
    }, { status: 500 })
  }
}
