import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/rsvp-interest - Get RSVP interest count and user status
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = String(params.id)
    const session = await getServerSession(authOptions as any)

    // Get total counts by status
    const counts = await prisma.rSVP.groupBy({
      by: ['status'],
      where: { eventId: eventId },
      _count: { status: true }
    })

    const summary = {
      going: 0,
      maybe: 0, // Maps to INTERESTED
      notGoing: 0,
      pending: 0,
      total: 0
    }

    counts.forEach((row) => {
      const count = row._count.status
      const status = row.status

      if (status === 'GOING') summary.going = count
      else if (status === 'INTERESTED') summary.maybe = count
      else if (status === 'NOT_GOING') summary.notGoing = count
      else if (status === 'YET_TO_RESPOND') summary.pending = count
    })

    summary.total = summary.going + summary.maybe + summary.notGoing + summary.pending

    // Check if current user has responded
    let userResponse = null
    if (session && (session as any).user && (session as any).user.id) {
      const userId = BigInt((session as any).user.id)
      const userRsvp = await prisma.rSVP.findUnique({
        where: {
          eventId_userId: {
            eventId: eventId,
            userId: userId
          }
        }
      })

      if (userRsvp) {
        // Map back to frontend expected values
        if (userRsvp.status === 'GOING') userResponse = 'GOING'
        else if (userRsvp.status === 'INTERESTED') userResponse = 'MAYBE'
        else if (userRsvp.status === 'NOT_GOING') userResponse = 'NOT_GOING'
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

    const eventId = String(params.id) // RSVP uses String eventId
    const body = await req.json()
    const { responseType = 'GOING' } = body

    const user = (session as any).user as any
    const email = user.email
    const name = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()
    const userId = user.id ? BigInt(user.id) : null

    // Validate response type (frontend sends MAYBE, map to schema INTERESTED)
    const validMap: Record<string, string> = {
      'GOING': 'GOING',
      'MAYBE': 'INTERESTED',
      'NOT_GOING': 'NOT_GOING',
      'PENDING': 'YET_TO_RESPOND'
    }
    const status = validMap[responseType]

    if (!status) {
      return NextResponse.json({ error: 'Invalid response type' }, { status: 400 })
    }

    // 1. Upsert into RSVP table (for logged-in user tracking)
    // Try to find existing RSVP 
    const existingRsvp = await prisma.rSVP.findUnique({
      where: {
        eventId_userId: {
          eventId: eventId,
          userId: userId as bigint
        }
      }
    })

    if (existingRsvp) {
      await prisma.rSVP.update({
        where: { id: existingRsvp.id },
        data: { status: status as any }
      })
    } else {
      await prisma.rSVP.create({
        data: {
          eventId: eventId,
          userId: userId,
          email: email,
          status: status as any
        }
      })
    }

    // 2. Mirror to RsvpGuest table (for admin list view)
    // Find guest by email and event
    const existingGuest = await prisma.rsvpGuest.findFirst({
      where: {
        eventId: eventId,
        email: email
      }
    })

    if (existingGuest) {
      await prisma.rsvpGuest.update({
        where: { id: existingGuest.id },
        data: { status: status as any, name: name }
      })
    } else {
      await prisma.rsvpGuest.create({
        data: {
          eventId: eventId,
          name: name,
          email: email,
          status: status as any
        }
      })
    }

    console.log(`✅ RSVP Interest recorded: ${email} - ${status} for event ${eventId}`)

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
