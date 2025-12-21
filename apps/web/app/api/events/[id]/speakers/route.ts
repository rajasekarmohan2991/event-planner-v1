import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// After migration: speakers will have event_id (bigint) column

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
        updated_at as "updatedAt"
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

    // Get tenant from event
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const tenantId = events[0].tenantId

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

    return NextResponse.json(speakerResult[0])

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({
      message: error.message,
      hint: 'Run POST /api/debug/create-tables to add event_id column'
    }, { status: 500 })
  }
}
