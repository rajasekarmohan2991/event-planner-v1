
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Universal query that tries ALL possible column name variations
async function querySpeakers(eventId: bigint, size: number, offset: number) {
  const variations = [
    // Variation 1: event_id (snake_case, bigint)
    () => prisma.$queryRaw`
      SELECT 
        id::text as id, name, title, bio,
        photo_url as "photoUrl", email, linkedin, twitter, website,
        event_id::text as "eventId", tenant_id as "tenantId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM speakers
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}
    `,
    // Variation 2: eventId (camelCase quoted, bigint)
    () => prisma.$queryRaw`
      SELECT 
        id::text as id, name, title, bio,
        photo_url as "photoUrl", email, linkedin, twitter, website,
        "eventId"::text as "eventId", tenant_id as "tenantId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM speakers
      WHERE "eventId" = ${eventId}
      ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}
    `,
    // Variation 3: eventId (camelCase unquoted, bigint)
    () => prisma.$queryRaw`
      SELECT 
        id::text as id, name, title, bio,
        photo_url as "photoUrl", email, linkedin, twitter, website,
        eventId::text as "eventId", tenant_id as "tenantId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM speakers
      WHERE eventId = ${eventId}
      ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}
    `,
    // Variation 4: event_id as string
    () => prisma.$queryRaw`
      SELECT 
        id::text as id, name, title, bio,
        photo_url as "photoUrl", email, linkedin, twitter, website,
        event_id as "eventId", tenant_id as "tenantId",
        created_at as "createdAt", updated_at as "updatedAt"
      FROM speakers
      WHERE event_id = ${eventId.toString()}
      ORDER BY created_at DESC LIMIT ${size} OFFSET ${offset}
    `
  ]

  for (let i = 0; i < variations.length; i++) {
    try {
      const result = await variations[i]() as any[]
      console.log(`✅ Speakers query succeeded with variation ${i + 1}`)
      return result
    } catch (e: any) {
      console.log(`❌ Variation ${i + 1} failed:`, e.message)
      if (i === variations.length - 1) {
        throw new Error(`All query variations failed. Last error: ${e.message}`)
      }
    }
  }
  return []
}

async function countSpeakers(eventId: bigint) {
  const variations = [
    () => prisma.$queryRaw`SELECT COUNT(*) as count FROM speakers WHERE event_id = ${eventId}`,
    () => prisma.$queryRaw`SELECT COUNT(*) as count FROM speakers WHERE "eventId" = ${eventId}`,
    () => prisma.$queryRaw`SELECT COUNT(*) as count FROM speakers WHERE eventId = ${eventId}`,
    () => prisma.$queryRaw`SELECT COUNT(*) as count FROM speakers WHERE event_id = ${eventId.toString()}`
  ]

  for (const variation of variations) {
    try {
      const result = await variation() as any[]
      return Number(result[0]?.count || 0)
    } catch (e) {
      continue
    }
  }
  return 0
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

    console.log(`🔍 Querying speakers for event ${eventId}`)

    const [speakers, total] = await Promise.all([
      querySpeakers(eventId, size, offset),
      countSpeakers(eventId)
    ])

    return NextResponse.json({
      data: speakers || [],
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    })
  } catch (e: any) {
    console.error('❌ Failed to load speakers:', e.message)
    return NextResponse.json({
      message: 'Failed to load speakers',
      error: e.message,
      hint: 'Check Vercel logs for which query variation worked'
    }, { status: 500 })
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
      FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }
    const tenantId = events[0].tenantId

    // Try multiple INSERT variations
    const insertVariations = [
      () => prisma.$queryRaw`
        INSERT INTO speakers (name, title, bio, photo_url, email, linkedin, twitter, website, event_id, tenant_id, created_at, updated_at)
        VALUES (${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
          ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
          ${eventId}, ${tenantId}, NOW(), NOW())
        RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
      `,
      () => prisma.$queryRaw`
        INSERT INTO speakers (name, title, bio, photo_url, email, linkedin, twitter, website, "eventId", tenant_id, created_at, updated_at)
        VALUES (${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
          ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
          ${eventId}, ${tenantId}, NOW(), NOW())
        RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
      `,
      () => prisma.$queryRaw`
        INSERT INTO speakers (name, title, bio, photo_url, email, linkedin, twitter, website, eventId, tenant_id, created_at, updated_at)
        VALUES (${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
          ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
          ${eventId}, ${tenantId}, NOW(), NOW())
        RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
      `
    ]

    for (const variation of insertVariations) {
      try {
        const result = await variation() as any[]
        return NextResponse.json(result[0])
      } catch (e: any) {
        console.log('Insert variation failed:', e.message)
        continue
      }
    }

    throw new Error('All INSERT variations failed')

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({ message: error.message || 'Create speaker failed' }, { status: 500 })
  }
}
