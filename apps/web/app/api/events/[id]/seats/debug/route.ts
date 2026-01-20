import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/seats/debug - Debug seat availability issues
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const params = 'then' in context.params ? await context.params : context.params
        const eventId = BigInt(params.id)

        console.log('🔍 Debugging seats for event:', eventId)

        // 1. Check if floor plan exists
        const floorPlans = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        event_id::text as "eventId",
        name,
        layout_data as "layoutData",
        sections,
        created_at as "createdAt"
      FROM floor_plans
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT 1
    `

        const floorPlan = floorPlans.length > 0 ? floorPlans[0] : null

        // 2. Check if seats exist in seat_inventory
        const seatCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM seat_inventory
      WHERE event_id = ${eventId}
    `

        const totalSeats = seatCount[0]?.count || 0

        // 3. Get sample seats
        const sampleSeats = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        section,
        row_number as "rowNumber",
        seat_number as "seatNumber",
        seat_type as "seatType",
        base_price as "basePrice",
        is_available as "isAvailable"
      FROM seat_inventory
      WHERE event_id = ${eventId}
      LIMIT 10
    `

        // 4. Check seat reservations
        const reservationCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count
      FROM seat_reservations
      WHERE event_id = ${eventId}
    `

        const totalReservations = reservationCount[0]?.count || 0

        // 5. Check ticket classes
        const ticketClasses = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        name,
        price_in_minor as "priceInMinor",
        quantity,
        sold,
        status
      FROM tickets
      WHERE event_id = ${eventId}
      ORDER BY price_in_minor DESC
    `

        return NextResponse.json({
            eventId: params.id,
            diagnosis: {
                floorPlan: {
                    exists: !!floorPlan,
                    id: floorPlan?.id,
                    name: floorPlan?.name,
                    hasLayoutData: !!floorPlan?.layoutData,
                    hasSections: !!floorPlan?.sections,
                    sectionsCount: floorPlan?.sections ? Object.keys(floorPlan.sections).length : 0,
                    createdAt: floorPlan?.createdAt
                },
                seats: {
                    total: totalSeats,
                    exists: totalSeats > 0,
                    sample: sampleSeats
                },
                reservations: {
                    total: totalReservations
                },
                ticketClasses: {
                    total: ticketClasses.length,
                    classes: ticketClasses
                },
                recommendations: []
            }
        })

    } catch (error: any) {
        console.error('❌ Debug error:', error)
        return NextResponse.json({
            error: 'Debug failed',
            details: error.message
        }, { status: 500 })
    }
}
