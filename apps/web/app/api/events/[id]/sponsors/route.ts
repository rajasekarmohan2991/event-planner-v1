import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PRODUCTION SCHEMA: sponsors has event_id (bigint)
// Columns: id, created_at, logo_url, name, tier, updated_at, website, event_id

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '50')
    const offset = page * size

    const eventId = BigInt(params.id)

    const sponsors = await prisma.$queryRaw`
      SELECT 
        id::text as id,
        event_id::text as "eventId",
        name,
        tier,
        logo_url as "logoUrl",
        website,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM sponsors
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT ${size}
      OFFSET ${offset}
    ` as any[]

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM sponsors WHERE event_id = ${eventId}
    ` as any[]

    const total = Number(countResult[0]?.count || 0)

    return NextResponse.json({
      data: sponsors || [],
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    })
  } catch (e: any) {
    console.error('❌ Sponsors error:', e.message)
    return NextResponse.json({ message: 'Failed to load sponsors', error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)

    const result = await prisma.$queryRaw`
      INSERT INTO sponsors (
        event_id, name, tier, logo_url, website, created_at, updated_at
      ) VALUES (
        ${eventId}, ${raw.name}, ${raw.tier || 'BRONZE'}, ${raw.logoUrl || null}, ${raw.website || null}, NOW(), NOW()
      )
      RETURNING id::text as id, name, tier, logo_url as "logoUrl", website
    ` as any[]

    return NextResponse.json(result[0])

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
