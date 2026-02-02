import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateStreamCredentials, generateAgoraToken } from '@/features/live-streaming/lib/agora-client'

export const dynamic = 'force-dynamic'

/**
 * POST /api/features/streaming/setup
 * Create or update streaming session for a session
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, eventId, title, description, accessLevel, recordingEnabled } = body

    console.log('[STREAMING SETUP] Creating stream for session:', sessionId)

    // Validate session exists
    const sessionData = await prisma.$queryRaw`
      SELECT id, title, event_id as "eventId"
      FROM sessions
      WHERE id = ${BigInt(sessionId)}
      LIMIT 1
    ` as any[]

    if (!sessionData.length) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    // Get Agora credentials from environment
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''

    if (!appId) {
      return NextResponse.json({ 
        message: 'Streaming not configured. Please add AGORA_APP_ID to environment variables.' 
      }, { status: 500 })
    }

    // Generate streaming credentials
    const credentials = generateStreamCredentials(eventId, sessionId, appId)

    // Check if stream already exists
    const existingStream = await prisma.$queryRaw`
      SELECT id, channel_name as "channelName", stream_key as "streamKey", rtmp_url as "rtmpUrl"
      FROM live_streams
      WHERE session_id = ${BigInt(sessionId)}
      LIMIT 1
    ` as any[]

    let streamId: string

    if (existingStream.length > 0) {
      // Update existing stream
      streamId = existingStream[0].id
      await prisma.$executeRaw`
        UPDATE live_streams
        SET 
          title = ${title || sessionData[0].title},
          description = ${description || ''},
          access_level = ${accessLevel || 'ticket_holders'},
          recording_enabled = ${recordingEnabled !== false},
          status = 'scheduled',
          updated_at = NOW()
        WHERE id = ${streamId}
      `
      console.log('[STREAMING SETUP] Updated existing stream:', streamId)
    } else {
      // Create new stream
      streamId = crypto.randomUUID()
      await prisma.$executeRaw`
        INSERT INTO live_streams (
          id, session_id, event_id, channel_name, stream_key, rtmp_url,
          title, description, access_level, recording_enabled, status
        ) VALUES (
          ${streamId},
          ${BigInt(sessionId)},
          ${BigInt(eventId)},
          ${credentials.channelName},
          ${credentials.streamKey},
          ${credentials.rtmpUrl},
          ${title || sessionData[0].title},
          ${description || ''},
          ${accessLevel || 'ticket_holders'},
          ${recordingEnabled !== false},
          'scheduled'
        )
      `
      console.log('[STREAMING SETUP] Created new stream:', streamId)
    }

    // Generate token for organizer (publisher role)
    const token = appCertificate 
      ? generateAgoraToken(appId, appCertificate, credentials.channelName, credentials.uid, 'publisher', 3600)
      : ''

    return NextResponse.json({
      message: 'Stream setup successful',
      stream: {
        id: streamId,
        channelName: credentials.channelName,
        rtmpUrl: credentials.rtmpUrl,
        streamKey: credentials.streamKey,
        token,
        appId,
        playbackUrl: `${process.env.NEXTAUTH_URL}/events/${eventId}/stream/${sessionId}/watch`
      }
    })

  } catch (error: any) {
    console.error('[STREAMING SETUP] Error:', error)
    return NextResponse.json({
      message: 'Failed to setup stream',
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/features/streaming/setup?sessionId=123
 * Get streaming credentials for a session
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID required' }, { status: 400 })
    }

    const stream = await prisma.$queryRaw`
      SELECT 
        id, session_id as "sessionId", event_id as "eventId",
        channel_name as "channelName", stream_key as "streamKey", 
        rtmp_url as "rtmpUrl", playback_url as "playbackUrl",
        title, description, status, access_level as "accessLevel",
        recording_enabled as "recordingEnabled",
        viewer_count as "viewerCount", peak_viewers as "peakViewers",
        started_at as "startedAt", ended_at as "endedAt",
        recording_url as "recordingUrl"
      FROM live_streams
      WHERE session_id = ${BigInt(sessionId)}
      LIMIT 1
    ` as any[]

    if (!stream.length) {
      return NextResponse.json({ message: 'Stream not found' }, { status: 404 })
    }

    const streamData = stream[0]
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID || ''
    const appCertificate = process.env.AGORA_APP_CERTIFICATE || ''

    // Generate fresh token
    const uid = Math.floor(Math.random() * 1000000)
    const token = appCertificate
      ? generateAgoraToken(appId, appCertificate, streamData.channelName, uid, 'publisher', 3600)
      : ''

    return NextResponse.json({
      stream: {
        ...streamData,
        sessionId: streamData.sessionId.toString(),
        eventId: streamData.eventId.toString(),
        token,
        appId
      }
    })

  } catch (error: any) {
    console.error('[STREAMING GET] Error:', error)
    return NextResponse.json({
      message: 'Failed to get stream',
      error: error.message
    }, { status: 500 })
  }
}
