import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSponsorForm } from '@/types/sponsor'
import { ensureSchema } from '@/lib/ensure-schema'

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
        contact_data as "contactData",
        payment_data as "paymentData",
        branding_online as "brandingOnline",
        branding_offline as "brandingOffline",
        event_presence as "eventPresence",
        giveaway_data as "giveawayData",
        legal_data as "legalData",
        timeline_data as "timelineData",
        post_event_data as "postEventData",
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
    // Attempt self-repair if column missing
    if (e.message.includes('column') || e.message.includes('relation')) {
      await ensureSchema()
      return NextResponse.json({ message: 'Database schema updated. Please retry.' }, { status: 503 })
    }
    return NextResponse.json({ message: 'Failed to load sponsors', error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)

    // Validate
    const errors = validateSponsorForm(raw)
    if (errors.length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 })
    }

    const result = await prisma.$queryRaw`
      INSERT INTO sponsors (
        event_id, name, tier, logo_url, website,
        contact_data, payment_data, branding_online, branding_offline,
        event_presence, giveaway_data, legal_data, timeline_data, post_event_data,
        created_at, updated_at
      ) VALUES (
        ${eventId}, ${raw.name}, ${raw.tier || 'BRONZE'}, ${raw.logoUrl || null}, ${raw.website || null},
        ${JSON.stringify(raw.contactData || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.paymentData || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.brandingOnline || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.brandingOffline || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.eventPresence || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.giveawayData || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.legalData || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.timelineData || {}) || '{}'}::jsonb,
        ${JSON.stringify(raw.postEventData || {}) || '{}'}::jsonb,
        NOW(), NOW()
      )
      RETURNING id::text as id
    ` as any[]

    return NextResponse.json({ success: true, id: result[0].id })

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
