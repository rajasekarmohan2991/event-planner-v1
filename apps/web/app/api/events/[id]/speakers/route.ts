
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Universal query helper that tries both column name formats
async function querySpeakers(eventId: bigint, size: number, offset: number) {
  try {
    // Try event_id first (snake_case)
    return await prisma.$queryRaw`
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
  } catch (e: any) {
    if (e.message?.includes('event_id') && e.message?.includes('does not exist')) {
      // Fallback to eventId (camelCase)
      return await prisma.$queryRaw`
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
          "eventId"::text as "eventId",
          tenant_id as "tenantId",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM speakers
        WHERE "eventId" = ${eventId}
        ORDER BY created_at DESC
        LIMIT ${size}
        OFFSET ${offset}
      ` as any[]
    }
    throw e
  }
}

async function countSpeakers(eventId: bigint) {
  try {
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM speakers WHERE event_id = ${eventId}
    ` as any[]
    return Number(result[0]?.count || 0)
  } catch (e: any) {
    if (e.message?.includes('event_id') && e.message?.includes('does not exist')) {
      const result = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM speakers WHERE "eventId" = ${eventId}
      ` as any[]
      return Number(result[0]?.count || 0)
    }
    throw e
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')
    const offset = page * size

    const eventIdString = params.id
    if (!eventIdString || isNaN(Number(eventIdString))) {
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }
    const eventId = BigInt(eventIdString)

    const [speakers, total] = await Promise.all([
      querySpeakers(eventId, size, offset),
      countSpeakers(eventId)
    ])

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

    // Try event_id first, fallback to eventId
    let speakerResult: any[]
    try {
      speakerResult = await prisma.$queryRaw`
        INSERT INTO speakers (
          name, title, bio, photo_url, email, linkedin, twitter, website, event_id, tenant_id, created_at, updated_at
        ) VALUES (
          ${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
          ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
          ${eventId}, ${tenantId}, NOW(), NOW()
        )
        RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
      ` as any[]
    } catch (e: any) {
      if (e.message?.includes('event_id') && e.message?.includes('does not exist')) {
        speakerResult = await prisma.$queryRaw`
          INSERT INTO speakers (
            name, title, bio, photo_url, email, linkedin, twitter, website, "eventId", tenant_id, created_at, updated_at
          ) VALUES (
            ${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
            ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
            ${eventId}, ${tenantId}, NOW(), NOW()
          )
          RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
        ` as any[]
      } else {
        throw e
      }
    }

    return NextResponse.json(speakerResult[0])

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({ message: error.message || 'Create speaker failed' }, { status: 500 })
  }
}
