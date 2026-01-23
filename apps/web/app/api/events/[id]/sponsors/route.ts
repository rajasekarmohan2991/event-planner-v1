import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { validateSponsorForm } from '@/types/sponsor'
import { ensureSchema } from '@/lib/ensure-schema'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '50')
    const offset = page * size

    const eventId = BigInt(params.id)

    const sponsors = await (prisma as any).sponsor.findMany({
      where: {
        eventId: eventId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: size,
    })

    const total = await (prisma as any).sponsor.count({
      where: {
        eventId: eventId
      }
    })

    // Map to ComprehensiveSponsor format if needed
    // The frontend expects keys like 'logoUrl', 'contactData', etc.
    // JSON fields are returned as objects by Prisma, so they should be fine.
    // We just need to map 'logo' -> 'logoUrl'
    const mappedSponsors = sponsors.map((s: any) => ({
      ...s,
      id: s.id,
      eventId: s.eventId.toString(),
      logoUrl: s.logo, // Map DB 'logo' to Frontend 'logoUrl'
      // JSON fields are already objects
    }))

    return NextResponse.json({
      data: mappedSponsors,
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

    // Validate
    const errors = validateSponsorForm(raw)
    if (errors.length > 0) {
      return NextResponse.json({ message: 'Validation failed', errors }, { status: 400 })
    }

    // Map payload to Prisma input
    const sponsorData = {
      eventId: eventId,
      name: raw.name,
      tier: raw.tier || 'BRONZE',
      logo: raw.logoUrl || null, // Map Frontend 'logoUrl' to DB 'logo'
      website: raw.website || null,

      // JSON Fields
      contactData: raw.contactData || {},
      paymentData: raw.paymentData || {},
      brandingOnline: raw.brandingOnline || {},
      brandingOffline: raw.brandingOffline || {},
      eventPresence: raw.eventPresence || {},
      giveawayData: raw.giveawayData || {},
      legalData: raw.legalData || {},
      timelineData: raw.timelineData || {},
      postEventData: raw.postEventData || {},

      // Map basic contact info from contactData to top-level columns if available
      contactName: raw.contactData?.contactName || null,
      contactEmail: raw.contactData?.email || null,
      contactPhone: raw.contactData?.phone || null,
    }

    const result = await (prisma as any).sponsor.create({
      data: sponsorData
    })

    return NextResponse.json({ success: true, id: result.id })

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
