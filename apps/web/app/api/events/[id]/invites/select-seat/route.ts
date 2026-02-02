import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/invites/select-seat - Select seat after approval
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = BigInt(params.id)
    const body = await req.json()
    const { inviteId, seatId } = body

    if (!inviteId || !seatId) {
      return NextResponse.json({ error: 'Invite ID and seat ID are required' }, { status: 400 })
    }

    // Verify invite is approved
    const invite = await prisma.$queryRaw<any[]>`
      SELECT id, approval_status, selected_seat_id
      FROM event_invites
      WHERE id = ${BigInt(inviteId)} AND event_id = ${eventId}
      LIMIT 1
    `

    if (!invite || invite.length === 0) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    if (invite[0].approval_status !== 'APPROVED') {
      return NextResponse.json({ error: 'Invite not approved' }, { status: 400 })
    }

    // Check if seat is available
    const seat = await prisma.$queryRaw<any[]>`
      SELECT id, seat_number, status
      FROM seat_inventory
      WHERE id = ${BigInt(seatId)} AND event_id = ${eventId}
      LIMIT 1
    `

    if (!seat || seat.length === 0) {
      return NextResponse.json({ error: 'Seat not found' }, { status: 404 })
    }

    if (seat[0].status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Seat is not available' }, { status: 400 })
    }

    // Reserve the seat and update invite
    await prisma.$executeRaw`
      UPDATE seat_inventory
      SET status = 'RESERVED'
      WHERE id = ${BigInt(seatId)}
    `

    await prisma.$executeRaw`
      UPDATE event_invites
      SET selected_seat_id = ${BigInt(seatId)}
      WHERE id = ${BigInt(inviteId)}
    `

    return NextResponse.json({
      success: true,
      message: 'Seat reserved successfully',
      seatId,
      seatNumber: seat[0].seat_number
    })
  } catch (error: any) {
    console.error('Error selecting seat:', error)
    return NextResponse.json({ error: 'Failed to select seat' }, { status: 500 })
  }
}
