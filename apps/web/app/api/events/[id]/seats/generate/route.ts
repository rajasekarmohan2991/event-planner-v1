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
    console.log('[API] /api/events/[id]/seats/generate - Starting')
    console.log('[API] Event ID:', params.id)

    const permissionCheck = await checkPermissionInRoute('events.edit', 'Generate Seats')
    if (permissionCheck) {
      console.log('[API] Permission check failed')
      return permissionCheck
    }

    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      console.log('[API] No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[API] User:', session.user.email)

    const eventId = parseInt(params.id)
    console.log('[API] Parsed event ID:', eventId)

    // Ensure tables exist
    try {
      // Tables should already exist from migrations, skip creation to avoid schema conflicts
      // await prisma.$executeRawUnsafe(`...`)
    } catch (e) {
      // Tables likely exist
    }

    const body = await req.json().catch(() => ({}))
    console.log('[API] Request body keys:', Object.keys(body))

    const { floorPlan, pricingRules } = body || {}

    // Support v2 payload { rows, cols, seatPrefix, basePrice, ticketClass }
    let plan = floorPlan
    if (!plan && (body?.rows && body?.cols)) {
      console.log('[API] Using v2 payload format')
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

    if (!plan) {
      console.log('[API] No floor plan in request, checking database...')
      // Try loading the latest saved plan for this event
      const rows = await prisma.$queryRaw`
        SELECT layout_data
        FROM floor_plan_configs
        WHERE event_id = ${eventId}
        ORDER BY created_at DESC
        LIMIT 1
      ` as any[]
      if (rows.length > 0 && rows[0]?.layout_data) {
        plan = rows[0].layout_data as any
        console.log('[API] Loaded plan from database')
      } else {
        console.log('[API] ❌ No floor plan found')
        return NextResponse.json({ error: 'Floor plan is required' }, { status: 400 })
      }
    }

    console.log('[API] Floor plan:', {
      name: plan.name,
      totalSeats: plan.totalSeats,
      sectionsCount: plan.sections?.length || 0
    })

    // Delete existing seats for this event
    await prisma.seatInventory.deleteMany({
      where: { eventId: BigInt(eventId) }
    })

    // Get tenant_id from event
    const tenantId = getTenantId() || null

    // Save floor plan configuration
    await prisma.floorPlanConfig.upsert({
      where: {
        eventId_planName: {
          eventId: BigInt(eventId),
          planName: plan.name || 'Default Floor Plan'
        }
      },
      update: {
        layoutData: plan,
        totalSeats: plan.totalSeats || 0,
        sections: plan.sections || [],
        tenantId: tenantId,
      },
      create: {
        eventId: BigInt(eventId),
        planName: plan.name || 'Default Floor Plan',
        layoutData: plan,
        totalSeats: plan.totalSeats || 0,
        sections: plan.sections || [],
        tenantId: tenantId,
      }
    })

    // Generate seats from floor plan
    let totalSeatsGenerated = 0
    let globalSeatNumber = 1
    const seats: any[] = []

    const insertSeat = async (sectionName: string, rowLabel: string, seatNum: number, seatType: string, basePrice: number, xCoord: number, yCoord: number) => {
      await prisma.seatInventory.create({
        data: {
          eventId: BigInt(eventId),
          section: sectionName,
          rowNumber: String(rowLabel),
          seatNumber: String(seatNum),
          seatType: seatType,
          basePrice: basePrice,
          xCoordinate: xCoord,
          yCoordinate: yCoord,
          isAvailable: true,
          tenantId: tenantId
        }
      })
      totalSeatsGenerated++
      seats.push({ section: sectionName, row: rowLabel, seat: seatNum, price: basePrice })
      globalSeatNumber++
    }

    const hasV3Type = typeof plan.type === 'string' && plan.type.endsWith('_V3')

    if (hasV3Type) {
      const type = String(plan.type)
      if (type === 'THEATER_V3') {
        const rows = Math.max(1, Number(plan.rows || 0))
        const cols = Math.max(1, Number(plan.cols || 0))
        const aisleEvery = Math.max(0, Number(plan.aisleEvery || 0))
        const defaultBasePrice = Number(plan.basePrice || 100)
        const sectionName = String(plan.section || 'Theater')
        const defaultSeatType = String(plan.seatType || 'STANDARD')
        const rowBands: any[] = Array.isArray(plan.rowBands) ? plan.rowBands : []

        const resolveRowBand = (rowIndex: number) => {
          for (const band of rowBands) {
            const start = Number(band.startRowIndex ?? 0)
            const end = Number(band.endRowIndex ?? -1)
            if (end >= 0) {
              if (rowIndex >= start && rowIndex <= end) return band
            } else {
              if (rowIndex >= start) return band
            }
          }
          return null
        }

        // grid with aisles: skip columns that are aisle boundaries
        for (let r = 0; r < rows; r++) {
          const rowLabel = String.fromCharCode(65 + (r % 26)) + (r >= 26 ? Math.floor(r / 26) : '')
          const band = resolveRowBand(r)
          const rowBasePrice = band?.basePrice != null ? Number(band.basePrice) : defaultBasePrice
          const rowSeatType = band?.seatType ? String(band.seatType) : defaultSeatType
          for (let c = 1; c <= cols; c++) {
            if (aisleEvery > 0 && c % aisleEvery === 0) continue // aisle gap
            const x = c * 40
            const y = r * 40
            await insertSeat(sectionName, rowLabel, c, rowSeatType, rowBasePrice, x, y)
          }
        }
      } else if (type === 'STADIUM_V3') {
        const rings: any[] = Array.isArray(plan.rings) ? plan.rings : []
        const centerX = Number(plan.centerX || 500)
        const centerY = Number(plan.centerY || 300)
        for (let ri = 0; ri < rings.length; ri++) {
          const ring = rings[ri] || {}
          const radius = Number(ring.radius || 100 + ri * 30)
          const sectors = Math.max(1, Number(ring.sectors || 6))
          const seatsPerSector = Math.max(1, Number(ring.seatsPerSector || 30))
          const basePrice = Number(ring.basePrice || 200)
          const sectionName = String(ring.name || `Ring ${ri + 1}`)
          const seatType = String(ring.seatType || 'STANDARD')
          const totalSeats = sectors * seatsPerSector
          for (let s = 0; s < totalSeats; s++) {
            const angle = (2 * Math.PI * s) / totalSeats
            const x = centerX + radius * Math.cos(angle)
            const y = centerY + radius * Math.sin(angle)
            const rowLabel = `R${ri + 1}`
            await insertSeat(sectionName, rowLabel, s + 1, seatType, basePrice, x, y)
          }
        }
      } else if (type === 'BANQUET_V3') {
        const tables: any[] = Array.isArray(plan.tables) ? plan.tables : []
        for (let ti = 0; ti < tables.length; ti++) {
          const t = tables[ti]
          const x0 = Number(t.x || 100 + (ti % 10) * 80)
          const y0 = Number(t.y || 100 + Math.floor(ti / 10) * 80)
          const seatsN = Math.max(1, Number(t.seats || plan.seatsPerTable || 6))
          const basePrice = Number(t.basePrice || plan.basePrice || 150)
          const sectionName = String(t.section || plan.section || 'Banquet')
          const seatType = String(t.seatType || 'STANDARD')
          const radius = Number(t.radius || 30)
          const rowLabel = `T${ti + 1}`
          for (let sn = 0; sn < seatsN; sn++) {
            const ang = (2 * Math.PI * sn) / seatsN
            const x = x0 + radius * Math.cos(ang)
            const y = y0 + radius * Math.sin(ang)
            await insertSeat(sectionName, rowLabel, sn + 1, seatType, basePrice, x, y)
          }
        }
      } else {
        return NextResponse.json({ error: `Unknown plan.type ${type}` }, { status: 400 })
      }
    } else {
      if (!plan.sections) {
        return NextResponse.json({ error: 'Floor plan with sections is required' }, { status: 400 })
      }
      for (const section of plan.sections) {
        const sectionName = section.name || 'General'
        const rows = section.rows || []
        const basePrice = section.basePrice || 100
        for (const row of rows) {
          const rowNumber = row.number || row.label
          const seatsInRow = row.seats || row.count || 10
          for (let seatNum = 1; seatNum <= seatsInRow; seatNum++) {
            const xCoord = (row.xOffset || 0) + (seatNum * 50)
            const yCoord = row.yOffset || 0
            await insertSeat(sectionName, String(rowNumber), seatNum, section.type || 'Standard', basePrice, xCoord, yCoord)
          }
        }
      }
    }

    // Save pricing rules if provided
    if (pricingRules && Array.isArray(pricingRules)) {
      console.log('[API] Saving pricing rules:', pricingRules.length)
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

    console.log('[API] ✅ Successfully generated', totalSeatsGenerated, 'seats')

    return NextResponse.json({
      success: true,
      totalSeatsGenerated,
      message: `Generated ${totalSeatsGenerated} seats from floor plan`,
      preview: seats.slice(0, 10) // Show first 10 seats as preview
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] ❌ Error generating seats:', error)
    console.error('[API] Error stack:', error.stack)
    return NextResponse.json({
      error: 'Failed to generate seats',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
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


    const floorPlan = await prisma.floorPlanConfig.findUnique({
      where: {
        eventId_planName: {
          eventId: BigInt(eventId),
          planName: 'Default Floor Plan' // Default to this name or findFirst
        }
      }
    })

    // Fallback if not found by specific name, try finding any for event (legacy support)
    let planData = floorPlan
    if (!planData) {
      const anyPlan = await prisma.floorPlanConfig.findFirst({
        where: { eventId: BigInt(eventId) },
        orderBy: { createdAt: 'desc' }
      })
      planData = anyPlan
    }

    const seatCount = await prisma.seatInventory.count({
      where: { eventId: BigInt(eventId) }
    })

    return NextResponse.json({
      floorPlan: planData ? {
        id: String(planData.id),
        planName: planData.planName,
        layoutData: planData.layoutData,
        totalSeats: planData.totalSeats,
        sections: planData.sections,
        createdAt: planData.createdAt
      } : null,
      totalSeats: seatCount
    })

  } catch (error: any) {
    console.error('Error fetching floor plan:', error)
    return NextResponse.json({
      error: 'Failed to fetch floor plan',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
