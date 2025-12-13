import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { publish } from '@/lib/seatEvents'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/extend - Extend reservation hold by 10 minutes
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const { seatIds } = await req.json()

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: 'seatIds array is required' }, { status: 400 })
    }

    const seatIdsStr = seatIds.map((id: string) => `'${id}'`).join(',')
    const newExpiry = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.$executeRawUnsafe(`
      UPDATE seat_reservations
      SET expires_at = ${newExpiry}, updated_at = NOW()
      WHERE event_id = ${eventId}
        AND seat_id IN (${seatIdsStr})
        AND status IN ('RESERVED', 'LOCKED')
        AND (expires_at IS NULL OR expires_at > NOW())
    `)

    try { publish(eventId, { type: 'extended', seatIds, expiresAt: newExpiry }) } catch {}

    return NextResponse.json({ success: true, expiresAt: newExpiry.toISOString() })
  } catch (error: any) {
    console.error('Error extending reservation:', error)
    return NextResponse.json({ error: 'Failed to extend reservation' }, { status: 500 })
  }
}
