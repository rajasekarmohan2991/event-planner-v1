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

    const sponsors = await prisma.sponsor.findMany({
      where: {
        eventId: eventId
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: size,
    })

    const total = await prisma.sponsor.count({
      where: {
        eventId: eventId
      }
    })

    // Map to ComprehensiveSponsor format
    const mappedSponsors = sponsors.map((s) => ({
      id: s.id,
      name: s.name,
      industry: s.industry,
      website: s.website,
      description: s.description,
      eventId: s.eventId.toString(),
      logoUrl: s.logo,
      tier: s.tier,
      contactName: s.contactName,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      contactData: s.contactData,
      paymentData: s.paymentData,
      brandingOnline: s.brandingOnline,
      brandingOffline: s.brandingOffline,
      eventPresence: s.eventPresence,
      giveawayData: s.giveawayData,
      legalData: s.legalData,
      timelineData: s.timelineData,
      postEventData: s.postEventData,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt
    }))

    return NextResponse.json({
      data: mappedSponsors,
      pagination: { page, size, total, totalPages: Math.ceil(total / size) }
    })
  } catch (e: any) {
    console.error('❌ Sponsors error:', e)
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

    const result = await prisma.sponsor.create({
      data: sponsorData
    })

    return NextResponse.json({ success: true, id: result.id })

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
