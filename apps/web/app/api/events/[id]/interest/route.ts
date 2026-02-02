import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Ensure table exists
async function ensureInterestTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_interests (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        user_id BIGINT,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'INTERESTED',
        source VARCHAR(50) DEFAULT 'WEB',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, email)
      )
    `)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_interests_event ON event_interests(event_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_interests_email ON event_interests(email)`)
  } catch (e) {
    // Table may already exist
  }
}

// GET /api/events/[id]/interest - Get interest count and user's interest status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const session = await getServerSession(authOptions as any).catch(() => null)
    const userEmail = (session as any)?.user?.email

    await ensureInterestTable()

    // Get total interest count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM event_interests
      WHERE event_id = ${eventId}
        AND status = 'INTERESTED'
    ` as any[]

    const totalInterested = countResult[0]?.count || 0

    // Check if current user is interested
    let userInterested = false
    if (userEmail) {
      const userResult = await prisma.$queryRaw`
        SELECT id FROM event_interests
        WHERE event_id = ${eventId}
          AND email = ${userEmail}
          AND status = 'INTERESTED'
        LIMIT 1
      ` as any[]
      userInterested = userResult.length > 0
    }

    return NextResponse.json({
      eventId,
      totalInterested,
      userInterested
    })

  } catch (error: any) {
    console.error('Error fetching interest:', error)
    return NextResponse.json({ error: 'Failed to fetch interest data' }, { status: 500 })
  }
}

// POST /api/events/[id]/interest - Express interest in an event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const session = await getServerSession(authOptions as any).catch(() => null)
    const body = await req.json().catch(() => ({}))

    const userEmail = (session as any)?.user?.email || body.email
    const userName = (session as any)?.user?.name || body.name || 'Anonymous'
    const userId = (session as any)?.user?.id || null

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await ensureInterestTable()

    // Check if already interested
    const existing = await prisma.$queryRaw`
      SELECT id, status FROM event_interests
      WHERE event_id = ${eventId}
        AND email = ${userEmail}
      LIMIT 1
    ` as any[]

    if (existing.length > 0) {
      // Update status back to INTERESTED if it was removed
      if (existing[0].status !== 'INTERESTED') {
        await prisma.$executeRaw`
          UPDATE event_interests
          SET status = 'INTERESTED', updated_at = NOW()
          WHERE event_id = ${eventId}
            AND email = ${userEmail}
        `
      }
      
      // Get updated count
      const countResult = await prisma.$queryRaw`
        SELECT COUNT(*)::int as count
        FROM event_interests
        WHERE event_id = ${eventId}
          AND status = 'INTERESTED'
      ` as any[]

      return NextResponse.json({
        message: 'Interest recorded',
        eventId,
        totalInterested: countResult[0]?.count || 0,
        userInterested: true
      })
    }

    // Insert new interest
    await prisma.$executeRaw`
      INSERT INTO event_interests (event_id, user_id, email, name, status, source)
      VALUES (${eventId}, ${userId ? BigInt(userId) : null}, ${userEmail}, ${userName}, 'INTERESTED', 'WEB')
    `

    // Get updated count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM event_interests
      WHERE event_id = ${eventId}
        AND status = 'INTERESTED'
    ` as any[]

    console.log(`✅ Interest recorded for event ${eventId} by ${userEmail}`)

    return NextResponse.json({
      message: 'Interest recorded successfully',
      eventId,
      totalInterested: countResult[0]?.count || 0,
      userInterested: true
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error recording interest:', error)
    return NextResponse.json({ 
      error: 'Failed to record interest',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// DELETE /api/events/[id]/interest - Remove interest
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const session = await getServerSession(authOptions as any).catch(() => null)
    const body = await req.json().catch(() => ({}))

    const userEmail = (session as any)?.user?.email || body.email

    if (!userEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    await ensureInterestTable()

    // Update status to REMOVED
    await prisma.$executeRaw`
      UPDATE event_interests
      SET status = 'REMOVED', updated_at = NOW()
      WHERE event_id = ${eventId}
        AND email = ${userEmail}
    `

    // Get updated count
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM event_interests
      WHERE event_id = ${eventId}
        AND status = 'INTERESTED'
    ` as any[]

    return NextResponse.json({
      message: 'Interest removed',
      eventId,
      totalInterested: countResult[0]?.count || 0,
      userInterested: false
    })

  } catch (error: any) {
    console.error('Error removing interest:', error)
    return NextResponse.json({ error: 'Failed to remove interest' }, { status: 500 })
  }
}
