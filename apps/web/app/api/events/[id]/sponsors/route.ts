import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📡 Fetching sponsors for event:', params.id)

    // Get pagination params from URL
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '0')
    const size = parseInt(searchParams.get('size') || '20')

    // Validate event ID
    let eventId: bigint
    try {
      eventId = BigInt(params.id)
    } catch (e) {
      console.error('❌ Invalid event ID:', params.id)
      return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
    }

    // Fetch sponsors with pagination - use safe type casting
    const [sponsors, total] = await Promise.all([
      (prisma as any).sponsor?.findMany({
        where: { eventId },
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' }
      }) || [],
      (prisma as any).sponsor?.count({
        where: { eventId }
      }) || 0
    ])

    console.log(`✅ Found ${sponsors?.length || 0} sponsors (total: ${total})`)

    return NextResponse.json({
      data: JSON.parse(JSON.stringify(sponsors || [], bigIntReplacer)),
      pagination: {
        page,
        size,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / size)
      }
    })
  } catch (e: any) {
    console.error('❌ Failed to load sponsors:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to load sponsors',
      error: e?.toString(),
      details: 'The Sponsor model may not be available yet. Please run: npx prisma generate'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventIdString = params.id
    console.log(`🏢 Creating sponsor for event ${eventIdString}`)

    // Try finding event
    let event = null
    try {
      event = await prisma.event.findFirst({
        where: { id: BigInt(eventIdString) }
      })
    } catch (e) {
      console.error(`❌ Failed to query event ${eventIdString}:`, e)
    }

    if (!event) {
      console.error(`❌ Event ${eventIdString} not found in DB`)
      return NextResponse.json({ message: `Event ${eventIdString} not found` }, { status: 404 })
    }

    console.log(`✅ Found event: ${event.name} (${event.id})`)

    // Create Sponsor - use type assertion for safety
    const sponsor = await (prisma as any).sponsor.create({
      data: {
        name: raw.name,
        tier: raw.tier || 'BRONZE',
        logoUrl: raw.logoUrl,
        website: raw.website,
        description: raw.description,
        contactName: raw.contactName,
        contactEmail: raw.contactEmail,
        contactPhone: raw.contactPhone,
        eventId: BigInt(eventIdString),
        tenantId: event.tenantId
      }
    })

    return NextResponse.json(JSON.parse(JSON.stringify(sponsor, bigIntReplacer)))

  } catch (error: any) {
    console.error('Create sponsor failed:', error)
    return NextResponse.json({ message: error.message || 'Create sponsor failed' }, { status: 500 })
  }
}
