import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// POST /api/admin/fix-seat-numbering - Fix sequential seat numbering for all events
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only SUPER_ADMIN can run this
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Super Admin only' }, { status: 403 })
    }

    const { eventId, numberingType } = await req.json()

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const type = numberingType || 'sequential' // 'sequential' or 'row-based'

    // Get all seats for the event
    const seats = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        section,
        row_number,
        seat_number,
        seat_type
      FROM seat_inventory
      WHERE event_id = ${parseInt(eventId)}
      ORDER BY 
        CASE section
          WHEN 'VIP' THEN 1
          WHEN 'Premium' THEN 2
          WHEN 'General' THEN 3
          ELSE 4
        END,
        row_number,
        seat_number::int
    `

    if (seats.length === 0) {
      return NextResponse.json({ error: 'No seats found for this event' }, { status: 404 })
    }

    let updated = 0

    if (type === 'sequential') {
      // Sequential numbering: 1, 2, 3, 4... across entire venue
      for (let i = 0; i < seats.length; i++) {
        const seat = seats[i]
        const newSeatNumber = String(i + 1)

        await prisma.$executeRaw`
          UPDATE seat_inventory
          SET seat_number = ${newSeatNumber}
          WHERE id = ${BigInt(seat.id)}
        `
        updated++
      }
    } else {
      // Row-based numbering: Each row starts from 1
      let currentSection = ''
      let currentRow = ''
      let seatInRow = 0

      for (const seat of seats) {
        if (seat.section !== currentSection || seat.row_number !== currentRow) {
          currentSection = seat.section
          currentRow = seat.row_number
          seatInRow = 1
        } else {
          seatInRow++
        }

        const newSeatNumber = String(seatInRow)

        await prisma.$executeRaw`
          UPDATE seat_inventory
          SET seat_number = ${newSeatNumber}
          WHERE id = ${BigInt(seat.id)}
        `
        updated++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} seats with ${type} numbering`,
      totalSeats: seats.length,
      numberingType: type
    })

  } catch (error: any) {
    console.error('Error fixing seat numbering:', error)
    return NextResponse.json({ 
      error: 'Failed to fix seat numbering',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET /api/admin/fix-seat-numbering - Preview seat numbering
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Get current seat numbering
    const seats = await prisma.$queryRaw<any[]>`
      SELECT 
        section,
        row_number,
        seat_number,
        COUNT(*)::int as count
      FROM seat_inventory
      WHERE event_id = ${parseInt(eventId)}
      GROUP BY section, row_number, seat_number
      ORDER BY section, row_number, seat_number::int
    `

    // Get summary
    const summary = await prisma.$queryRaw<any[]>`
      SELECT 
        section,
        COUNT(*)::int as total_seats,
        COUNT(DISTINCT row_number)::int as total_rows
      FROM seat_inventory
      WHERE event_id = ${parseInt(eventId)}
      GROUP BY section
      ORDER BY section
    `

    return NextResponse.json({
      seats: seats.slice(0, 50), // First 50 seats
      summary,
      totalSeats: seats.reduce((sum, s) => sum + s.count, 0)
    })

  } catch (error: any) {
    console.error('Error fetching seat numbering:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch seat numbering',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
