
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')
    const offset = page * size

    // Validate ID
    const eventIdString = params.id
    if (!eventIdString || isNaN(Number(eventIdString))) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }
    const eventId = BigInt(eventIdString)

    // Raw SQL Fetch with explicit BigInt to String conversion
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
        updated_at as "updatedAt"
      FROM speakers
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT ${size}
      OFFSET ${offset}
    ` as any[]

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM speakers 
      WHERE event_id = ${eventId}
    ` as any[]

    const total = Number(countResult[0]?.count || 0)

    // Return directly - IDs already converted to strings
    return NextResponse.json({
      data: speakers || [],
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })
  } catch (e: any) {
    console.error('❌ Failed to load speakers:', e)
    return NextResponse.json({ message: 'Failed to load speakers', error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)

    // 1. Find Event (Raw SQL)
    const events = await prisma.$queryRaw`
      SELECT id, name, tenant_id as "tenantId", starts_at as "startsAt"
      FROM events 
      WHERE id = ${eventId}
      LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    const event = events[0]
    const tenantId = event.tenantId

    // 2. Insert Speaker (Raw SQL)
    // Table: speakers (lowercase)
    const speakerResult = await prisma.$queryRaw`
      INSERT INTO speakers (
        name, title, bio, photo_url, email, linkedin, twitter, website, event_id, tenant_id, created_at, updated_at
      ) VALUES (
        ${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
        ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
        ${eventId}, ${tenantId}, NOW(), NOW()
      )
      RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email, linkedin, twitter, website, event_id::text as "eventId", tenant_id as "tenantId"
    ` as any[]

    const speaker = speakerResult[0]

    // 3. Create Default Session (Raw SQL)
    // Table: sessions (lowercase)
    const startTime = event.startsAt ? new Date(event.startsAt) : new Date()
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
    const sessionTitle = raw.sessionTitle || `Keynote: ${speaker.name}`
    const sessionDesc = raw.sessionDescription || `Session by ${speaker.name}`

    const sessionResult = await prisma.$queryRaw`
      INSERT INTO sessions (
        event_id, tenant_id, title, description, start_time, end_time, created_at, updated_at
      ) VALUES (
        ${eventId}, ${tenantId}, ${sessionTitle}, ${sessionDesc}, 
        ${startTime}, ${endTime}, NOW(), NOW()
      )
      RETURNING id
    ` as any[]

    const sessionId = sessionResult[0]?.id

    // 4. Link (session_speakers)
    if (sessionId && speaker.id) {
      await prisma.$executeRawUnsafe(`
            INSERT INTO session_speakers (session_id, speaker_id) VALUES ($1, $2)
        `, sessionId, speaker.id)
    }

    return NextResponse.json(speaker)

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({ message: error.message || 'Create speaker failed' }, { status: 500 })
  }
}
