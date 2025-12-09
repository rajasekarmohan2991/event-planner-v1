import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/rsvp-interest - Get RSVP interest count and user status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = BigInt(params.id)
    const session = await getServerSession(authOptions as any)

    // Get total counts by response type
    const counts = await prisma.$queryRaw<any[]>`
      SELECT 
        response_type,
        COUNT(*)::int as count
      FROM rsvp_interests
      WHERE event_id = ${eventId}
      GROUP BY response_type
    `

    const summary = {
      going: 0,
      maybe: 0,
      notGoing: 0,
      pending: 0,
      total: 0
    }

    counts.forEach((row: any) => {
      const type = row.response_type?.toLowerCase()
      if (type === 'going') summary.going = row.count
      else if (type === 'maybe') summary.maybe = row.count
      else if (type === 'not_going') summary.notGoing = row.count
      else if (type === 'pending') summary.pending = row.count
    })

    summary.total = summary.going + summary.maybe + summary.notGoing + summary.pending

    // Check if current user has responded
    let userResponse = null
    if (session && (session as any).user) {
      const email = ((session as any).user as any).email
      const result = await prisma.$queryRaw<any[]>`
        SELECT response_type, created_at
        FROM rsvp_interests
        WHERE event_id = ${eventId} AND email = ${email}
        LIMIT 1
      `
      if (result.length > 0) {
        userResponse = result[0].response_type
      }
    }

    return NextResponse.json({ ...summary, userResponse })
  } catch (error: any) {
    console.error('Error fetching RSVP interest:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVP data' }, { status: 500 })
  }
}

// POST /api/events/[id]/rsvp-interest - Mark interest in event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)
    const body = await req.json()
    const { responseType = 'GOING' } = body

    const user = (session as any).user as any
    const email = user.email
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
    const userId = user.id ? BigInt(user.id) : null

    // Validate response type
    if (!['GOING', 'MAYBE', 'NOT_GOING', 'PENDING'].includes(responseType)) {
      return NextResponse.json({ error: 'Invalid response type' }, { status: 400 })
    }

    // Insert or update RSVP interest
    await prisma.$executeRaw`
      INSERT INTO rsvp_interests (event_id, user_id, name, email, response_type, status, created_at, updated_at)
      VALUES (${eventId}, ${userId}, ${name}, ${email}, ${responseType}, 'NOT_REGISTERED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (event_id, email)
      DO UPDATE SET 
        response_type = ${responseType},
        updated_at = CURRENT_TIMESTAMP
    `

    console.log(`✅ RSVP Interest recorded: ${email} - ${responseType} for event ${eventId}`)

    // Also mirror this into RSVP guests so organizers can see the interest in "RSVP Management"
    try {
      const statusMap: Record<string, string> = {
        'GOING': 'GOING',
        'MAYBE': 'INTERESTED',
        'NOT_GOING': 'NOT_GOING',
        'PENDING': 'YET_TO_RESPOND'
      }
      const guestStatus = statusMap[String(responseType)] || 'YET_TO_RESPOND'

      // Best-effort upsert using Prisma model if available
      const existing: any = await (prisma as any).rsvpGuest.findFirst({
        where: { eventId: String(eventId), email }
      }).catch(() => null)

      if (existing?.id) {
        await (prisma as any).rsvpGuest.update({
          where: { id: existing.id },
          data: { name, status: guestStatus }
        }).catch(()=>{})
      } else {
        await (prisma as any).rsvpGuest.create({
          data: { eventId: String(eventId), name, email, status: guestStatus }
        }).catch(()=>{})
      }
    } catch (mirrorErr) {
      console.warn('RSVP interest mirrored to rsvp_guest skipped:', mirrorErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Interest recorded successfully',
      responseType
    })
  } catch (error: any) {
    console.error('Error recording RSVP interest:', error)
    return NextResponse.json({ error: 'Failed to record interest' }, { status: 500 })
  }
}
