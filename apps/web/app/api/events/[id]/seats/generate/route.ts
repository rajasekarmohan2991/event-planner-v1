import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/generate - Generate seat inventory from floor plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const permissionCheck = await checkPermissionInRoute('events.edit', 'Generate Seats')
    if (permissionCheck) return permissionCheck

    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    
    // Ensure tables exist
    try {
      // Tables should already exist from migrations, skip creation to avoid schema conflicts
      // await prisma.$executeRawUnsafe(`...`)
    } catch (e) {
      // Tables likely exist
    }

    const body = await req.json()
    const { floorPlan, pricingRules } = body

    // Support v2 payload { rows, cols, seatPrefix, basePrice, ticketClass }
    let plan = floorPlan
    if (!plan && (body?.rows && body?.cols)) {
      const rows = Number(body.rows)
      const cols = Number(body.cols)
      const seatPrefix = String(body.seatPrefix || '')
      const basePrice = Number(body.basePrice || 100)
      const sectionName = String(body.ticketClass || 'General')
      plan = {
        name: `${sectionName} Plan`,
        totalSeats: rows * cols,
        sections: [
          {
            name: sectionName,
            basePrice,
            rows: Array.from({ length: rows }).map((_, rIdx) => ({
              number: seatPrefix ? `${seatPrefix}${rIdx + 1}` : `${rIdx + 1}`,
              seats: cols,
              xOffset: 0,
              yOffset: rIdx * 50,
            }))
          }
        ]
      }
    }

    if (!plan || !plan.sections) {
      return NextResponse.json({ error: 'Floor plan with sections is required' }, { status: 400 })
    }

    // Delete existing seats for this event
    await prisma.$executeRaw`
      DELETE FROM seat_inventory WHERE event_id = ${eventId}
    `

    // Get tenant_id from event
    const tenantId = getTenantId() || null

    // Save floor plan configuration
    await prisma.$executeRaw`
      INSERT INTO floor_plan_configs (
        event_id,
        plan_name,
        layout_data,
        total_seats,
        sections,
        tenant_id
      ) VALUES (
        ${eventId},
        ${plan.name || 'Default Floor Plan'},
        ${JSON.stringify(plan)}::jsonb,
        ${plan.totalSeats || 0},
        ${JSON.stringify(plan.sections)}::jsonb,
        ${tenantId}
      )
      ON CONFLICT (event_id, plan_name)
      DO UPDATE SET
        layout_data = EXCLUDED.layout_data,
        total_seats = EXCLUDED.total_seats,
        sections = EXCLUDED.sections,
        tenant_id = EXCLUDED.tenant_id,
        updated_at = NOW()
    `

    // Generate seats from floor plan
    let totalSeatsGenerated = 0
    let globalSeatNumber = 1 // Sequential numbering across entire venue
    const seats = []

    for (const section of plan.sections) {
      const sectionName = section.name || 'General'
      const rows = section.rows || []
      const basePrice = section.basePrice || 100

      for (const row of rows) {
        const rowNumber = row.number || row.label
        const seatsInRow = row.seats || row.count || 10

        for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
          // Calculate position (simple grid layout)
          const xCoord = row.xOffset || 0 + (seatNum * 50)
          const yCoord = row.yOffset || 0

          await prisma.$executeRaw`
            INSERT INTO seat_inventory (
              event_id,
              section,
              row_number,
              seat_number,
              seat_type,
              base_price,
              x_coordinate,
              y_coordinate,
              is_available,
              tenant_id
            ) VALUES (
              ${eventId},
              ${sectionName},
              ${String(rowNumber)},
              ${String(seatNum)},
              ${section.type || 'Standard'},
              ${basePrice},
              ${xCoord},
              ${yCoord},
              true,
              ${tenantId}
            )
          `

          totalSeatsGenerated++
          seats.push({
            section: sectionName,
            row: rowNumber,
            seat: seatNum,
            price: basePrice
          })
          globalSeatNumber++ // Keep global counter for ID continuity if needed
        }
      }
    }

    // Save pricing rules if provided
    if (pricingRules && Array.isArray(pricingRules)) {
      for (const rule of pricingRules) {
        await prisma.$executeRaw`
          INSERT INTO seat_pricing_rules (
            event_id,
            section,
            row_pattern,
            seat_type,
            base_price,
            multiplier
          ) VALUES (
            ${eventId},
            ${rule.section || null},
            ${rule.rowPattern || null},
            ${rule.seatType || null},
            ${rule.basePrice},
            ${rule.multiplier || 1.0}
          )
        `
      }
    }

    return NextResponse.json({
      success: true,
      totalSeatsGenerated,
      message: `Generated ${totalSeatsGenerated} seats from floor plan`,
      preview: seats.slice(0, 10) // Show first 10 seats as preview
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error generating seats:', error)
    return NextResponse.json({ 
      error: 'Failed to generate seats',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

// GET /api/events/[id]/seats/generate - Get floor plan configuration
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const tenantId = getTenantId()

    const floorPlan = await prisma.$queryRaw`
      SELECT 
        id::text,
        plan_name as "planName",
        layout_data as "layoutData",
        total_seats as "totalSeats",
        sections,
        created_at as "createdAt"
      FROM floor_plan_configs
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    const seatCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM seat_inventory
      WHERE event_id = ${eventId}
    `

    return NextResponse.json({
      floorPlan: (floorPlan as any[])[0] || null,
      totalSeats: (seatCount as any[])[0]?.count || 0
    })

  } catch (error: any) {
    console.error('Error fetching floor plan:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch floor plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
