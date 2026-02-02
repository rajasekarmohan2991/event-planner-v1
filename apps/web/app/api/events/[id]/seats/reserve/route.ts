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

    // 1. Clean up expired reservations
    await prisma.seatReservation.updateMany({
      where: {
        eventId: BigInt(eventId),
        status: 'RESERVED',
        expiresAt: { lt: new Date() }
      },
      data: { status: 'EXPIRED' }
    })

    const bigIntSeatIds = seatIds.map((id: string | number) => BigInt(id))

    // 2. Get seat details and check availability
    // Check for active reservations
    const activeReservations = await prisma.seatReservation.findMany({
      where: {
        seatId: { in: bigIntSeatIds },
        status: { in: ['RESERVED', 'LOCKED', 'CONFIRMED'] },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      },
      select: { seatId: true }
    })

    if (activeReservations.length > 0) {
      const occupiedIds = activeReservations.map(r => String(r.seatId))
      return NextResponse.json({
        error: 'Some seats are no longer available',
        unavailableSeats: occupiedIds.map(id => ({ id, reason: 'Reserved' }))
      }, { status: 409 })
    }

    // Check inventory status
    const seats = await prisma.seatInventory.findMany({
      where: {
        id: { in: bigIntSeatIds }
      }
    })

    // Verify all seats found and available
    const unavailableSeats = []
    const seatMap = new Map()
    seats.forEach(s => seatMap.set(String(s.id), s))

    for (const id of seatIds) {
      const s = seatMap.get(String(id))
      if (!s) {
        unavailableSeats.push({ id, reason: 'Not found' })
      } else if (!s.isAvailable) {
        unavailableSeats.push({ id, reason: 'Unavailable' })
      }
    }

    if (unavailableSeats.length > 0) {
      return NextResponse.json({
        error: 'Some seats are no longer available',
        unavailableSeats
      }, { status: 409 })
    }

    // 3. Create reservations (10-minute lock)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)
    const reservations: any[] = []

    // Calculate total price
    const totalPrice = seats.reduce((sum, seat) => sum + seat.basePrice, 0)

    // Use transaction for atomic reservation
    await prisma.$transaction(async (tx) => {
      for (const seat of seats) {
        const res = await tx.seatReservation.create({
          data: {
            eventId: BigInt(eventId),
            seatId: seat.id,
            userId: userId ? BigInt(userId) : null,
            userEmail: userEmail,
            status: 'RESERVED',
            expiresAt: expiresAt,
            tenantId: tenantId
          }
        })
        reservations.push(res)
      }
    })

    // Notify listeners
    try { publish(eventId, { type: 'reserved', seatIds }) } catch { }

    // Convert BigInts to strings for JSON response
    const safeReservations = reservations.map(r => ({
      ...r,
      id: r.id,
      seatId: String(r.seatId),
      eventId: String(r.eventId),
      userId: r.userId ? String(r.userId) : null
    }))

    const safeSeats = seats.map(s => ({
      ...s,
      id: String(s.id),
      eventId: String(s.eventId),
      basePrice: s.basePrice // Assuming int
    }))

    return NextResponse.json({
      success: true,
      reservations: safeReservations,
      seats: safeSeats,
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
    try { publish(eventId, { type: 'released', seatIds }) } catch { }

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
