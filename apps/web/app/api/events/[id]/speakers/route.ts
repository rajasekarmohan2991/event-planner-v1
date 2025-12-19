import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Helper to serialize BigInt
const bigIntReplacer = (key: string, value: any) =>
  typeof value === 'bigint' ? value.toString() : value

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('📡 Fetching speakers for event:', params.id)

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

    // Fetch speakers with pagination - use type assertion for safety
    const [speakers, total] = await Promise.all([
      (prisma as any).speaker?.findMany({
        where: { eventId },
        skip: page * size,
        take: size,
        orderBy: { createdAt: 'desc' }
      }) || [],
      (prisma as any).speaker?.count({
        where: { eventId }
      }) || 0
    ])

    console.log(`✅ Found ${speakers?.length || 0} speakers (total: ${total})`)

    return NextResponse.json({
      data: JSON.parse(JSON.stringify(speakers || [], bigIntReplacer)),
      pagination: {
        page,
        size,
        total: total || 0,
        totalPages: Math.ceil((total || 0) / size)
      }
    })
  } catch (e: any) {
    console.error('❌ Failed to load speakers:', e)
    return NextResponse.json({
      message: e?.message || 'Failed to load speakers',
      error: e?.toString(),
      details: 'The Speaker model may not be available yet. Please run: npx prisma generate'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })

  try {
    const raw = await req.json()
    const eventIdString = params.id
    console.log(`🔊 Creating speaker for event ${eventIdString}`)

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
      // Fallback: Check if it exists as a string ID just in case of schema mismatch (unlikely but safe)
      // or check if it was just created but replication lag? (Unlikely with Prisma)
      return NextResponse.json({ message: `Event ${eventIdString} not found` }, { status: 404 })
    }

    console.log(`✅ Found event: ${event.name} (${event.id})`)

    // 1. Create Speaker - use type assertion for safety
    const speaker = await (prisma as any).speaker.create({
      data: {
        name: raw.name,
        title: raw.title,
        bio: raw.bio,
        photoUrl: raw.photoUrl,
        email: raw.email,
        linkedin: raw.linkedin,
        twitter: raw.twitter,
        website: raw.website,
        eventId: BigInt(eventIdString),
        tenantId: event.tenantId
      }
    })

    // 2. Create Default Session (1 hour duration from Event Start or Now)
    const startTime = event.startsAt || new Date()
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000)

    const sessionData = await (prisma as any).eventSession.create({
      data: {
        eventId: BigInt(eventIdString),
        tenantId: event.tenantId,
        title: raw.sessionTitle || `Keynote: ${speaker.name}`,
        description: raw.sessionDescription || `Session by ${speaker.name}`,
        startTime: startTime,
        endTime: endTime
      }
    })

    // 3. Link Speaker to Session
    await (prisma as any).sessionSpeaker.create({
      data: {
        sessionId: sessionData.id,
        speakerId: speaker.id
      }
    })

    return NextResponse.json(JSON.parse(JSON.stringify(speaker, bigIntReplacer)))

  } catch (error: any) {
    console.error('Create speaker failed:', error)
    return NextResponse.json({ message: error.message || 'Create speaker failed' }, { status: 500 })
  }
}
