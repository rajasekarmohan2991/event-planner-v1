import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/rsvp-interests/list - Get all RSVP interests for an event
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    // Fetch all RSVP interests
    const interests = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        name,
        email,
        response_type as "responseType",
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM rsvp_interests
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      interests,
      count: interests.length
    })
  } catch (error: any) {
    console.error('Error fetching RSVP interests list:', error)
    return NextResponse.json({ error: 'Failed to fetch RSVP interests' }, { status: 500 })
  }
}
