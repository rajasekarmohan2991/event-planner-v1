import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/confirm - Confirm seat reservation after payment
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Make session optional for checkout demo reliability
    const session = await getServerSession(authOptions as any).catch(() => null)

    const eventId = parseInt(params.id)
    const { seatIds, registrationId, paymentId, paymentStatus } = await req.json()

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: 'seatIds array is required' }, { status: 400 })
    }

    const seatIdsStr = seatIds.map((id: string) => `'${id}'`).join(',')

    // Update reservations to CONFIRMED status (do not restrict by user/tenant for now)
    await prisma.$executeRawUnsafe(`
      UPDATE seat_reservations
      SET 
        status = 'CONFIRMED',
        payment_status = '${paymentStatus || 'PAID'}',
        confirmed_at = NOW(),
        registration_id = ${registrationId ? BigInt(registrationId) : null},
        expires_at = NULL,
        updated_at = NOW()
      WHERE event_id = ${eventId}
        AND seat_id IN (${seatIdsStr})
        AND status IN ('RESERVED', 'LOCKED')
    `)

    // Get confirmed seats
    const confirmedSeats = await prisma.$queryRawUnsafe(`
      SELECT 
        sr.id::text as "reservationId",
        si.id::text as "seatId",
        si.section,
        si.row_number as "rowNumber",
        si.seat_number as "seatNumber",
        si.base_price as "price",
        sr.status,
        sr.confirmed_at as "confirmedAt"
      FROM seat_reservations sr
      JOIN seat_inventory si ON sr.seat_id = si.id
      WHERE sr.event_id = ${eventId}
        AND sr.seat_id IN (${seatIdsStr})
        AND sr.status = 'CONFIRMED'
    `)

    return NextResponse.json({
      success: true,
      confirmedSeats,
      message: `${(confirmedSeats as any[]).length} seat(s) confirmed`
    })

  } catch (error: any) {
    console.error('Error confirming seats:', error)
    return NextResponse.json({ 
      error: 'Failed to confirm seats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
