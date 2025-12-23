import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// After migration: speakers will have event_id (bigint) column
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')
    const offset = page * size

    const eventId = BigInt(params.id)

    const speakers = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        name,
        title,
        bio,
        photo_url as "photoUrl",
        email,
        linkedin,
        twitter,
        website,
        event_id::text as "eventId",
        tenant_id as "tenantId",
        created_at as "createdAt",
        updated_at as "updatedAt",
        (
          SELECT json_agg(json_build_object(
            'id', s.id::text,
            'title', s.title,
            'startTime', s.start_time,
            'endTime', s.end_time,
            'room', s.room,
            'track', s.track,
            'totalAttendees', COALESCE(s.capacity, 0)
          ))
          FROM session_speakers ss
          JOIN sessions s ON s.id = ss.session_id
          WHERE ss.speaker_id = speakers.id
        ) as sessions
      FROM speakers
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT ${size}
      OFFSET ${offset}
    ` as any[]

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM speakers WHERE event_id = ${eventId}
    ` as any[]

    const total = Number(countResult[0]?.count || 0)

    return NextResponse.json({
      data: speakers || [],
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    })
  } catch (e: any) {
    console.error('❌ Speakers error:', e.message)
    return NextResponse.json({
      message: 'Failed to load speakers',
      error: e.message,
      hint: 'Run POST /api/debug/create-tables to add event_id column'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)

    // Get event details including start time
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId", starts_at as "startsAt", name as "eventName" 
      FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const event = events[0]
    const tenantId = event.tenantId

    // Insert speaker WITH event_id
    const speakerResult = await prisma.$queryRaw`
      INSERT INTO speakers (
        name, title, bio, photo_url, email, linkedin, twitter, website, event_id, tenant_id, created_at, updated_at
      ) VALUES (
        ${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
        ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
        ${eventId}, ${tenantId}, NOW(), NOW()
      )
      RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
    ` as any[]

    const speaker = speakerResult[0]

    let sessionId = raw.sessionId
    let sessionTitle = raw.sessionTitle

    if (!sessionId) {
      // Create a default session for this speaker
      sessionTitle = sessionTitle || `Session by ${speaker.name}`
      const sessionDescription = raw.sessionDescription || `${speaker.title || 'Speaker'} session at ${event.eventName}`

      // Set session time (use event start time or default to now + 1 day)
      const startTime = event.startsAt ? new Date(event.startsAt) : new Date(Date.now() + 24 * 60 * 60 * 1000)
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour session

      const sessionResult = await prisma.$queryRaw`
        INSERT INTO sessions (
          event_id, tenant_id, title, description, start_time, end_time, created_at, updated_at
        ) VALUES (
          ${eventId}, ${tenantId}, ${sessionTitle}, ${sessionDescription},
          ${startTime}, ${endTime}, NOW(), NOW()
        )
        RETURNING id
      ` as any[]

      sessionId = sessionResult[0]?.id
    }

    // Link speaker to session
    if (sessionId && speaker.id) {
      try {
        await prisma.$executeRawUnsafe(`
          INSERT INTO session_speakers (session_id, speaker_id) 
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, String(sessionId), String(speaker.id))
      } catch (linkError) {
        console.error('⚠️ Failed to link speaker to session:', linkError)
      }
    }

    return NextResponse.json({
      ...speaker,
      sessionId: sessionId ? sessionId.toString() : null,
      sessionTitle
    })

  } catch (error: any) {
    console.error('❌ Create speaker failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    })

    // Check if it's the missing column error
    if (error.message?.includes('event_id') || error.code === '42703') {
      return NextResponse.json({
        message: 'Database migration required',
        error: 'The event_id column does not exist in speakers table',
        solution: 'Run POST /api/debug/create-tables to add the missing column',
        technicalError: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      message: error.message,
      hint: 'Check server logs for details'
    }, { status: 500 })
  }
}
