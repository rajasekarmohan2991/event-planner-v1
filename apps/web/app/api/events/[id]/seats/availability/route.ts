import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/events/[id]/seats/availability - Get all available seats with pricing
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Allow unauthenticated access for checking seat availability (public registration)
    const session = await getServerSession(authOptions as any)

    const eventId = parseInt(params.id)
    const tenantId = getTenantId()

    // Validate eventId is numeric
    if (isNaN(eventId)) {
      return NextResponse.json({
        seats: [],
        groupedSeats: {},
        floorPlan: null,
        totalSeats: 0,
        availableSeats: 0
      })
    }

    const { searchParams } = new URL(req.url)
    const section = searchParams.get('section')
    const ticketClass = searchParams.get('ticketClass') // VIP, PREMIUM, GENERAL

    // Gate by actual existence: floor plan OR existing seats

    // 1. Check floor_plan_configs (New system) - Raw SQL
    // It stores the layout in 'data' column (JSONB)
    const configs = await prisma.$queryRaw<any[]>`
       SELECT data, event_id FROM floor_plan_configs WHERE event_id = ${eventId}::bigint LIMIT 1
    `

    let floorPlan: any = null;
    if (configs.length > 0) {
      const cfg = configs[0]
      // Parse data if string, else use object
      let layoutData;
      try {
        layoutData = (typeof cfg.data === 'string') ? JSON.parse(cfg.data) : cfg.data;
      } catch (e) {
        layoutData = {}
      }

      floorPlan = {
        id: 'config', // ID not strictly needed for rendering
        layoutData: layoutData,
        totalCapacity: Number(layoutData?.capacity || 0),
        name: layoutData?.name || 'Event Floor Plan'
      }
    } else {
      // 2. Check floor_plans (Legacy system) - Prisma Client
      // This handles schema mapping safely
      try {
        const legacy = await prisma.floorPlan.findFirst({
          where: { eventId: BigInt(eventId) },
          orderBy: { createdAt: 'desc' }
        })
        if (legacy) {
          floorPlan = legacy;
        }
      } catch (err) {
        console.warn('Legacy floor plan check failed:', err)
      }
    }

    // Check seat inventory count safely
    const seatCountRaw = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM seat_inventory WHERE event_id = ${eventId}::bigint
    `
    const seatCount = seatCountRaw[0]?.count || 0

    const hasFloorPlan = !!floorPlan
    const hasSeatInventory = seatCount > 0

    if (!hasFloorPlan && !hasSeatInventory) {
      // No floor plan or seats exist - return empty (seat selector only works after floor plan creation)
      return NextResponse.json({
        seats: [],
        groupedSeats: {},
        floorPlan: null,
        totalSeats: 0,
        availableSeats: 0
      })
    }

    // Clean up expired reservations first
    await prisma.$executeRaw`
      UPDATE seat_reservations
      SET status = 'EXPIRED'
      WHERE event_id = ${eventId}::bigint
        AND status = 'RESERVED'
        AND expires_at < NOW()
    `

    // Get seat inventory with reservation status (avoid referencing optional columns like ticket_class)
    let query = `
      SELECT 
        si.id::text,
        si.event_id::text as "eventId",
        si.section,
        si.row_number as "rowNumber",
        si.seat_number as "seatNumber",
        si.seat_type as "seatType",
        si.seat_type as "ticketClass",
        si.base_price::numeric as "basePrice",
        si.x_coordinate::numeric as "xCoordinate",
        si.y_coordinate::numeric as "yCoordinate",
        si.is_available as "isAvailable",
        CASE 
          WHEN sr.id IS NOT NULL AND sr.status IN ('RESERVED', 'LOCKED', 'CONFIRMED') 
          THEN false 
          ELSE true 
        END as "available",
        sr.status as "reservationStatus",
        sr.user_email as "reservedBy",
        sr.expires_at as "expiresAt"
      FROM seat_inventory si
      LEFT JOIN seat_reservations sr ON si.id = sr.seat_id 
        AND sr.status IN ('RESERVED', 'LOCKED', 'CONFIRMED')
        AND (sr.expires_at IS NULL OR sr.expires_at > NOW())
      WHERE si.event_id = ${eventId}::bigint
        AND si.is_available = true
    `

    if (ticketClass) {
      query += ` AND si.seat_type = '${ticketClass}'`
    }

    if (section) {
      query += ` AND si.section = '${section}'`
    }

    query += ` ORDER BY si.section, si.row_number, si.seat_number`

    const seats = await prisma.$queryRawUnsafe(query)

    // Group seats by section and row for easier rendering
    const groupedSeats = (seats as any[]).reduce((acc, seat) => {
      const section = seat.section || 'General'
      const row = seat.rowNumber

      if (!acc[section]) acc[section] = {}
      if (!acc[section][row]) acc[section][row] = []

      acc[section][row].push(seat)
      return acc
    }, {} as Record<string, Record<string, any[]>>)

    // Format floor plan data for response (already fetched above)
    const floorPlanData = floorPlan ? {
      id: floorPlan.id,
      planName: floorPlan.name,
      layoutData: floorPlan.layoutData,
      totalSeats: floorPlan.totalCapacity,
      sections: floorPlan.layoutData
    } : null

    return NextResponse.json({
      seats: seats,
      groupedSeats,
      floorPlan: floorPlanData,
      totalSeats: (seats as any[]).length,
      availableSeats: (seats as any[]).filter(s => s.available).length
    })

  } catch (error: any) {
    console.error('Error fetching seat availability:', error)
    return NextResponse.json({
      error: 'Failed to fetch seat availability',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
