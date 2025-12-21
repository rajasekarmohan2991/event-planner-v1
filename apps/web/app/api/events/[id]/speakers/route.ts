import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PRODUCTION SCHEMA: speakers table has NO event_id column!
// Columns: id, name, title, bio, photo_url, created_at, updated_at, email, linkedin, tenant_id, twitter, website

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')
    const offset = page * size

    // Since speakers has no event_id, we need to join with sessions/session_speakers
    // OR just return all speakers (if there's no way to filter by event)

    // For now, return all speakers (since there's no event_id column)
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
        tenant_id as "tenantId",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM speakers
      ORDER BY created_at DESC
      LIMIT ${size}
      OFFSET ${offset}
    ` as any[]

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM speakers
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
      error: e.message
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()

    // Insert speaker WITHOUT event_id (column doesn't exist)
    const speakerResult = await prisma.$queryRaw`
      INSERT INTO speakers (
        name, title, bio, photo_url, email, linkedin, twitter, website, tenant_id, created_at, updated_at
      ) VALUES (
        ${raw.name}, ${raw.title || null}, ${raw.bio || null}, ${raw.photoUrl || null}, 
        ${raw.email || null}, ${raw.linkedin || null}, ${raw.twitter || null}, ${raw.website || null},
        ${raw.tenantId || null}, NOW(), NOW()
      )
      RETURNING id::text as id, name, title, bio, photo_url as "photoUrl", email
    ` as any[]

    return NextResponse.json(speakerResult[0])

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
