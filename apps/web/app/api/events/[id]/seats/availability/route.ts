import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'
import { generateSeats } from '@/lib/seat-generator'

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
    // It stores the layout in 'layout_data' column (JSONB)
    const configs = await prisma.$queryRaw<any[]>`
       SELECT layout_data, total_seats, plan_name, event_id, tenant_id FROM floor_plan_configs WHERE event_id = ${eventId}::bigint LIMIT 1
    `

    let floorPlan: any = null;
    if (configs.length > 0) {
      const cfg = configs[0]
      // Parse data if string, else use object
      let layoutData;
      try {
        layoutData = (typeof cfg.layout_data === 'string') ? JSON.parse(cfg.layout_data) : cfg.layout_data;
      } catch (e) {
        layoutData = {}
      }

      floorPlan = {
        id: 'config', // ID not strictly needed for rendering
        layoutData: layoutData,
        totalCapacity: Number(cfg.total_seats || 0),
        name: cfg.plan_name || 'Event Floor Plan',
        tenantId: cfg.tenant_id
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
          floorPlan = { ...legacy, tenantId: legacy.tenantId };
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

    console.log('[Availability] Debug - hasFloorPlan:', hasFloorPlan)
    console.log('[Availability] Debug - hasSeatInventory:', hasSeatInventory)
    console.log('[Availability] Debug - floorPlan exists:', !!floorPlan)
    console.log('[Availability] Debug - layoutData exists:', !!floorPlan?.layoutData)

    if (hasFloorPlan && !hasSeatInventory) {
      // Auto-generate seats from floor plan
      console.log('[Availability] Seats missing but floor plan exists. Auto-generating seats...')
      console.log('[Availability] Floor plan data:', JSON.stringify(floorPlan.layoutData).substring(0, 200))
      console.log('[Availability] Tenant ID:', tenantId || floorPlan.tenantId)
      
      // Check if layoutData is empty or invalid
      if (!floorPlan.layoutData || (typeof floorPlan.layoutData === 'object' && Object.keys(floorPlan.layoutData).length === 0)) {
        console.error('[Availability] Floor plan layoutData is empty or invalid')
        return NextResponse.json({
          seats: [],
          groupedSeats: {},
          floorPlan: {
            id: floorPlan.id,
            planName: floorPlan.name,
            layoutData: floorPlan.layoutData,
            totalSeats: floorPlan.totalCapacity,
            sections: floorPlan.layoutData
          },
          totalSeats: 0,
          availableSeats: 0,
          error: 'Floor plan exists but has no layout data. Please configure the floor plan in the event design section.'
        })
      }
      
      try {
        // Try to get pricing from floor plan layout or use defaults
        const layoutData = floorPlan.layoutData || {}
        const pricingRules = [
          { seatType: 'VIP', basePrice: layoutData.vipPrice || 500 },
          { seatType: 'PREMIUM', basePrice: layoutData.premiumPrice || 300 },
          { seatType: 'GENERAL', basePrice: layoutData.generalPrice || 100 }
        ]
        await generateSeats(eventId, floorPlan.layoutData, tenantId || floorPlan.tenantId, pricingRules)
        console.log('[Availability] Seats generated successfully. Re-fetching...')
        
        // Re-fetch seats after generation
        const seatsAfterGen = await prisma.$queryRawUnsafe(`
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
            true as "available",
            NULL as "reservationStatus",
            NULL as "reservedBy",
            NULL as "expiresAt"
          FROM seat_inventory si
          WHERE si.event_id = ${eventId}::bigint
            AND si.is_available = true
          ORDER BY si.section, si.row_number, si.seat_number
        `)
        
        const groupedSeatsAfterGen = (seatsAfterGen as any[]).reduce((acc, seat) => {
          const section = seat.section || 'General'
          const row = seat.rowNumber
          if (!acc[section]) acc[section] = {}
          if (!acc[section][row]) acc[section][row] = []
          acc[section][row].push(seat)
          return acc
        }, {} as Record<string, Record<string, any[]>>)
        
        return NextResponse.json({
          seats: seatsAfterGen,
          groupedSeats: groupedSeatsAfterGen,
          floorPlan: {
            id: floorPlan.id,
            planName: floorPlan.name,
            layoutData: floorPlan.layoutData,
            totalSeats: floorPlan.totalCapacity,
            sections: floorPlan.layoutData
          },
          totalSeats: (seatsAfterGen as any[]).length,
          availableSeats: (seatsAfterGen as any[]).length
        })
      } catch (genError: any) {
        console.error('[Availability] Seat generation failed:', genError)
        // Return floor plan info even if generation fails
        return NextResponse.json({
          seats: [],
          groupedSeats: {},
          floorPlan: {
            id: floorPlan.id,
            planName: floorPlan.name,
            layoutData: floorPlan.layoutData,
            totalSeats: floorPlan.totalCapacity,
            sections: floorPlan.layoutData
          },
          totalSeats: 0,
          availableSeats: 0,
          error: 'Seats could not be generated automatically. Please contact the event organizer.'
        })
      }
    } else if (!hasFloorPlan && !hasSeatInventory) {
      // No floor plan or seats exist AND generation not possible - return empty
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
