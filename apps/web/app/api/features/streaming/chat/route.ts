import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * POST /api/features/streaming/chat
 * Send a chat message during live stream
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { streamId, message, type = 'message' } = body

    if (!streamId || !message) {
      return NextResponse.json({ message: 'Stream ID and message required' }, { status: 400 })
    }

    console.log('[STREAMING CHAT] New message in stream:', streamId)

    // Validate stream is live
    const stream = await prisma.$queryRaw`
      SELECT id, status
      FROM live_streams
      WHERE id = ${streamId}
      LIMIT 1
    ` as any[]

    if (!stream.length) {
      return NextResponse.json({ message: 'Stream not found' }, { status: 404 })
    }

    if (stream[0].status !== 'live') {
      return NextResponse.json({ message: 'Stream is not live' }, { status: 400 })
    }

    // Get user info
    const userId = BigInt((session.user as any).id)
    const userName = (session.user as any).name || 'Anonymous'
    const userAvatar = (session.user as any).image || null

    // Insert message
    const messageId = crypto.randomUUID()
    await prisma.$executeRaw`
      INSERT INTO stream_chat (
        id, stream_id, user_id, message, type, user_name, user_avatar
      ) VALUES (
        ${messageId},
        ${streamId},
        ${userId},
        ${message},
        ${type},
        ${userName},
        ${userAvatar}
      )
    `

    // Update viewer message count
    await prisma.$executeRaw`
      UPDATE stream_viewers
      SET messages_sent = messages_sent + 1
      WHERE stream_id = ${streamId} AND user_id = ${userId} AND is_active = true
    `

    return NextResponse.json({
      message: 'Message sent',
      messageId
    })

  } catch (error: any) {
    console.error('[STREAMING CHAT] Error:', error)
    return NextResponse.json({
      message: 'Failed to send message',
      error: error.message
    }, { status: 500 })
  }
}

/**
 * GET /api/features/streaming/chat?streamId=xxx&limit=50
 * Get chat messages for a stream
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const streamId = searchParams.get('streamId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before') // for pagination

    if (!streamId) {
      return NextResponse.json({ message: 'Stream ID required' }, { status: 400 })
    }

    let messages: any[]

    if (before) {
      messages = await prisma.$queryRaw`
        SELECT 
          id, user_id as "userId", user_name as "userName", user_avatar as "userAvatar",
          message, type, is_moderator as "isModerator", is_speaker as "isSpeaker",
          reactions, created_at as "createdAt"
        FROM stream_chat
        WHERE stream_id = ${streamId} 
          AND is_deleted = false
          AND created_at < ${new Date(before)}
        ORDER BY created_at DESC
        LIMIT ${limit}
      ` as any[]
    } else {
      messages = await prisma.$queryRaw`
        SELECT 
          id, user_id as "userId", user_name as "userName", user_avatar as "userAvatar",
          message, type, is_moderator as "isModerator", is_speaker as "isSpeaker",
          reactions, created_at as "createdAt"
        FROM stream_chat
        WHERE stream_id = ${streamId} AND is_deleted = false
        ORDER BY created_at DESC
        LIMIT ${limit}
      ` as any[]
    }

    // Reverse to show oldest first
    messages.reverse()

    return NextResponse.json({
      messages: messages.map(m => ({
        ...m,
        userId: m.userId ? m.userId.toString() : null
      }))
    })

  } catch (error: any) {
    console.error('[STREAMING CHAT GET] Error:', error)
    return NextResponse.json({
      message: 'Failed to get messages',
      error: error.message
    }, { status: 500 })
  }
}

/**
 * DELETE /api/features/streaming/chat?messageId=xxx
 * Delete a chat message (moderator only)
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const messageId = searchParams.get('messageId')

    if (!messageId) {
      return NextResponse.json({ message: 'Message ID required' }, { status: 400 })
    }

    // TODO: Check if user is moderator/organizer

    const userId = BigInt((session.user as any).id)

    await prisma.$executeRaw`
      UPDATE stream_chat
      SET 
        is_deleted = true,
        deleted_by = ${userId},
        deleted_at = NOW()
      WHERE id = ${messageId}
    `

    return NextResponse.json({
      message: 'Message deleted'
    })

  } catch (error: any) {
    console.error('[STREAMING CHAT DELETE] Error:', error)
    return NextResponse.json({
      message: 'Failed to delete message',
      error: error.message
    }, { status: 500 })
  }
}
