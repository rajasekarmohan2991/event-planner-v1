import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Ensure sponsors table exists
async function ensureSponsorsTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        tenant_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        tier VARCHAR(50) DEFAULT 'BRONZE',
        logo_url TEXT,
        website TEXT,
        description TEXT,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_sponsors_event ON sponsors(event_id)`)
  } catch (e) {
    // Table might already exist
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await ensureSponsorsTable()

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')
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
        description,
        contact_name as "contactName",
        contact_email as "contactEmail",
        contact_phone as "contactPhone",
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
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size)
      }
    })
  } catch (e: any) {
    console.error('❌ Failed to load sponsors:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to load sponsors',
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    await ensureSponsorsTable()

    const raw = await req.json()
    const eventId = BigInt(params.id)

    // Fetch event tenant
    const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

    if (!events.length) {
      return NextResponse.json({ message: 'Event not found' }, { status: 404 })
    }

    const tenantId = events[0].tenantId

    // Insert sponsor
    const result = await prisma.$queryRaw`
      INSERT INTO sponsors (
        event_id, tenant_id, name, tier, logo_url, website, description,
        contact_name, contact_email, contact_phone, created_at, updated_at
      ) VALUES (
        ${eventId}, ${tenantId}, ${raw.name}, ${raw.tier || 'BRONZE'},
        ${raw.logoUrl || null}, ${raw.website || null}, ${raw.description || null},
        ${raw.contactName || null}, ${raw.contactEmail || null}, ${raw.contactPhone || null},
        NOW(), NOW()
      )
      RETURNING id::text as id, name, tier
    ` as any[]

    return NextResponse.json(result[0], { status: 201 })

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message || 'Create sponsor failed' }, { status: 500 })
  }
}
