import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'
import { publish } from '@/lib/seatEvents'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/reserve - Reserve seats temporarily (15 min lock)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Session is optional for public registration seat holds
    const session = await getServerSession(authOptions as any).catch(() => null)

    const eventId = parseInt(params.id)
    const body = await req.json()
    const { seatIds, reservationKey } = body || {}
    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: 'seatIds array is required' }, { status: 400 })
    }

    const userEmail = (session as any)?.user?.email || (reservationKey ? String(reservationKey) : null)
    const userId = (session as any)?.user?.id || null
    const tenantId = getTenantId()

    // Clean up expired reservations
    await prisma.$executeRaw`
      UPDATE seat_reservations
      SET status = 'EXPIRED'
      WHERE event_id = ${eventId}
        AND status = 'RESERVED'
        AND expires_at < NOW()
    `

    // Check if seats are available
    const seatIdsStr = seatIds.map(id => `'${id}'`).join(',')
    const unavailableSeats = await prisma.$queryRawUnsafe(`
      SELECT si.id::text, si.row_number, si.seat_number
      FROM seat_inventory si
      LEFT JOIN seat_reservations sr ON si.id = sr.seat_id 
        AND sr.status IN ('RESERVED', 'LOCKED', 'CONFIRMED')
        AND (sr.expires_at IS NULL OR sr.expires_at > NOW())
      WHERE si.id IN (${seatIdsStr})
        AND (si.is_available = false OR sr.id IS NOT NULL)
    `)

    if ((unavailableSeats as any[]).length > 0) {
      return NextResponse.json({ 
        error: 'Some seats are no longer available',
        unavailableSeats
      }, { status: 409 })
    }

    // Get seat details with pricing
    const seats = await prisma.$queryRawUnsafe(`
      SELECT 
        id::text,
        section,
        row_number as "rowNumber",
        seat_number as "seatNumber",
        base_price as "basePrice"
      FROM seat_inventory
      WHERE id IN (${seatIdsStr})
    `)

    // Calculate total price
    const totalPrice = (seats as any[]).reduce((sum, seat) => sum + parseFloat(seat.basePrice), 0)

    // Create reservations (15-minute lock)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
    const reservations = []

    for (const seatId of seatIds) {
      const seat = (seats as any[]).find(s => s.id === seatId)
      
      const reservation = await prisma.$queryRaw`
        INSERT INTO seat_reservations (
          event_id,
          seat_id,
          user_id,
          user_email,
          status,
          expires_at,
          payment_status,
          price_paid,
          tenant_id
        ) VALUES (
          ${eventId},
          ${BigInt(seatId)},
          ${userId ? BigInt(userId) : null},
          ${userEmail},
          'RESERVED',
          ${expiresAt},
          'PENDING',
          ${seat.basePrice},
          ${tenantId || null}
        )
        RETURNING 
          id::text,
          seat_id::text as "seatId",
          status,
          expires_at as "expiresAt"
      `

      reservations.push((reservation as any[])[0])
    }

    // Notify listeners
    try { publish(eventId, { type: 'reserved', seatIds }) } catch {}

    return NextResponse.json({
      success: true,
      reservations,
      seats,
      totalPrice,
      expiresAt,
      owner: userEmail || null,
      message: `${seatIds.length} seat(s) reserved for 10 minutes`
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error reserving seats:', error)
    return NextResponse.json({ 
      error: 'Failed to reserve seats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// DELETE /api/events/[id]/seats/reserve - Release reserved seats
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = parseInt(params.id)
    const { seatIds } = await req.json()
    const tenantId = getTenantId()

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return NextResponse.json({ error: 'seatIds array is required' }, { status: 400 })
    }

    const seatIdsStr = seatIds.map((id: string) => `'${id}'`).join(',')

    // Release reservations for these seats if not confirmed
    await prisma.$executeRawUnsafe(`
      UPDATE seat_reservations
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE event_id = ${eventId}
        ${tenantId ? `AND tenant_id = '${tenantId}'` : ''}
        AND seat_id IN (${seatIdsStr})
        AND status IN ('RESERVED', 'LOCKED')
    `)

    // Notify listeners on release
    try { publish(eventId, { type: 'released', seatIds }) } catch {}

    return NextResponse.json({
      success: true,
      message: 'Seats released successfully'
    })

  } catch (error: any) {
    console.error('Error releasing seats:', error)
    return NextResponse.json({ 
      error: 'Failed to release seats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
