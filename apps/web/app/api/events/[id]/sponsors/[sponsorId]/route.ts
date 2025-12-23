import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSponsorForm } from '@/types/sponsor'

export async function PUT(req: NextRequest, { params }: { params: { id: string, sponsorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventId = BigInt(params.id)
    const sponsorId = BigInt(params.sponsorId)

    // Validate
    const errors = validateSponsorForm(raw)
    if (errors.length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 })
    }

    // Update using raw SQL because Prisma might not fully support the JSONB casting or partial updates exactly as we want with raw query consistency
    const result = await prisma.$queryRaw`
      UPDATE sponsors
      SET
        name = ${raw.name},
        tier = ${raw.tier || 'BRONZE'},
        logo_url = ${raw.logoUrl || null},
        website = ${raw.website || null},
        contact_data = ${JSON.stringify(raw.contactData || {}) || '{}'}::jsonb,
        payment_data = ${JSON.stringify(raw.paymentData || {}) || '{}'}::jsonb,
        branding_online = ${JSON.stringify(raw.brandingOnline || {}) || '{}'}::jsonb,
        branding_offline = ${JSON.stringify(raw.brandingOffline || {}) || '{}'}::jsonb,
        event_presence = ${JSON.stringify(raw.eventPresence || {}) || '{}'}::jsonb,
        giveaway_data = ${JSON.stringify(raw.giveawayData || {}) || '{}'}::jsonb,
        legal_data = ${JSON.stringify(raw.legalData || {}) || '{}'}::jsonb,
        timeline_data = ${JSON.stringify(raw.timelineData || {}) || '{}'}::jsonb,
        post_event_data = ${JSON.stringify(raw.postEventData || {}) || '{}'}::jsonb,
        updated_at = NOW()
      WHERE id = ${sponsorId} AND event_id = ${eventId}
      RETURNING id::text
    ` as any[]

    if (result.length === 0) {
      return NextResponse.json({ message: 'Sponsor not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, id: result[0].id })

  } catch (error: any) {
    console.error('Update sponsor failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, sponsorId: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const eventId = BigInt(params.id)
    const sponsorId = BigInt(params.sponsorId)

    const result = await prisma.$queryRaw`
      DELETE FROM sponsors
      WHERE id = ${sponsorId} AND event_id = ${eventId}
      RETURNING id::text
    ` as any[]

    if (result.length === 0) {
      return NextResponse.json({ message: 'Sponsor not found' }, { status: 404 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    console.error('Delete sponsor failed:', e)
    return NextResponse.json({ message: e?.message || 'Delete sponsor failed' }, { status: 500 })
  }
}
