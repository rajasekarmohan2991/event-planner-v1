import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    
    // Only SUPER_ADMIN can fix seats
    if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all events with capacity
    const events = await prisma.$queryRaw<Array<{id: bigint, name: string, capacity: number, price_inr: number | null}>>`
      SELECT id, name, capacity, price_inr 
      FROM events 
      WHERE capacity IS NOT NULL AND capacity > 0
    `

    const results = []

    for (const event of events) {
      const eventId = Number(event.id)
      const capacity = event.capacity
      const basePrice = event.price_inr || 0

      // Calculate seat distribution (10% VIP, 30% Premium, 60% General)
      const vipCount = Math.floor(capacity * 0.1)
      const premiumCount = Math.floor(capacity * 0.3)
      const generalCount = capacity - vipCount - premiumCount

      // Delete existing seats for this event
      await prisma.$executeRaw`DELETE FROM seat_inventory WHERE event_id = ${eventId}`
      await prisma.$executeRaw`DELETE FROM floor_plan_configs WHERE event_id = ${eventId}`

      // Create VIP seats (sequential numbering)
      let seatNum = 1
      for (let i = 0; i < vipCount; i++) {
        const rowNum = Math.ceil((i + 1) / 5)
        await prisma.$executeRaw`
          INSERT INTO seat_inventory (
            event_id, section, row_number, seat_number, 
            seat_type, base_price, status, created_at, updated_at
          ) VALUES (
            ${eventId}, 'VIP', ${rowNum}, ${seatNum},
            'VIP', ${basePrice * 3}, 'AVAILABLE', NOW(), NOW()
          )
        `
        seatNum++
      }

      // Create Premium seats (sequential numbering)
      seatNum = 1
      for (let i = 0; i < premiumCount; i++) {
        const rowNum = Math.ceil((i + 1) / 8)
        await prisma.$executeRaw`
          INSERT INTO seat_inventory (
            event_id, section, row_number, seat_number,
            seat_type, base_price, status, created_at, updated_at
          ) VALUES (
            ${eventId}, 'Premium', ${rowNum}, ${seatNum},
            'PREMIUM', ${basePrice * 2}, 'AVAILABLE', NOW(), NOW()
          )
        `
        seatNum++
      }

      // Create General seats (sequential numbering)
      seatNum = 1
      for (let i = 0; i < generalCount; i++) {
        const rowNum = Math.ceil((i + 1) / 10)
        await prisma.$executeRaw`
          INSERT INTO seat_inventory (
            event_id, section, row_number, seat_number,
            seat_type, base_price, status, created_at, updated_at
          ) VALUES (
            ${eventId}, 'General', ${rowNum}, ${seatNum},
            'GENERAL', ${basePrice}, 'AVAILABLE', NOW(), NOW()
          )
        `
        seatNum++
      }

      results.push({
        eventId,
        eventName: event.name,
        capacity,
        vipSeats: vipCount,
        premiumSeats: premiumCount,
        generalSeats: generalCount,
        totalCreated: vipCount + premiumCount + generalCount
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Seats fixed successfully',
      results
    })

  } catch (error: any) {
    console.error('Fix seats error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
