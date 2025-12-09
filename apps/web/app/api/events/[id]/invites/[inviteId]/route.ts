import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/invites/[inviteId] - Get specific invite details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; inviteId: string } }
) {
  try {
    const eventId = BigInt(params.id)
    const inviteId = BigInt(params.inviteId)

    const invite = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        event_id::text as "eventId",
        email,
        invitee_name as "inviteeName",
        organization,
        category,
        discount_code as "discountCode",
        invite_code as "inviteCode",
        response,
        response_at as "responseAt",
        approval_status as "approvalStatus",
        approval_type as "approvalType",
        approved_at as "approvedAt",
        selected_seat_id::text as "selectedSeatId",
        status
      FROM event_invites
      WHERE id = ${inviteId} AND event_id = ${eventId}
      LIMIT 1
    `

    if (!invite || invite.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    return NextResponse.json(invite[0])
  } catch (error: any) {
    console.error('Error fetching invite:', error)
    return NextResponse.json({ error: 'Failed to fetch invite' }, { status: 500 })
  }
}
