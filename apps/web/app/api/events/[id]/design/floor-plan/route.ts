import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getKV } from '@/lib/kv'

// Generate seats based on floor plan configuration
async function generateSeatsFromFloorPlan(eventId: string, config: any) {
  try {
    // Clear existing seats for this event
    await prisma.$executeRaw`DELETE FROM seat_inventory WHERE event_id = ${parseInt(eventId)}`

    const { guestCount, seatsPerTable, tableType, hallLength, hallWidth, seatZones } = config
    const seatsPerTableNum = Math.max(1, Number(seatsPerTable) || 1)

    // Fetch ticket pricing settings from database
    const ticketSettings = await prisma.$queryRaw`
      SELECT vip_price, premium_price, general_price
      FROM event_ticket_settings
      WHERE event_id = ${parseInt(eventId)}
    ` as any[]

    // Use configured prices or defaults
    const prices = ticketSettings.length > 0 ? {
      vip: Number(ticketSettings[0].vip_price) || 500,
      premium: Number(ticketSettings[0].premium_price) || 300,
      general: Number(ticketSettings[0].general_price) || 150
    } : {
      vip: 500,
      premium: 300,
      general: 150
    }

    // Determine desired seat counts: prefer config -> saved KV -> fallback to percentages of guestCount
    const configCounts = {
      vipSeats: Number(config.vipSeats || 0),
      premiumSeats: Number(config.premiumSeats || 0),
      generalSeats: Number(config.generalSeats || 0),
    }
    const savedCounts = await getKV<any>('event_seat_counts', eventId)
    const hasConfigCounts = (configCounts.vipSeats + configCounts.premiumSeats + configCounts.generalSeats) > 0
    const kvCounts = savedCounts ? {
      vipSeats: Number(savedCounts.vipSeats || 0),
      premiumSeats: Number(savedCounts.premiumSeats || 0),
      generalSeats: Number(savedCounts.generalSeats || 0),
    } : { vipSeats: 0, premiumSeats: 0, generalSeats: 0 }

    let vipRemaining = hasConfigCounts ? configCounts.vipSeats : (kvCounts.vipSeats || Math.floor((guestCount || 0) * 0.2))
    let premiumRemaining = hasConfigCounts ? configCounts.premiumSeats : (kvCounts.premiumSeats || Math.floor((guestCount || 0) * 0.3))
    let generalRemaining = hasConfigCounts ? configCounts.generalSeats : (kvCounts.generalSeats || Math.max(0, (guestCount || 0) - ((vipRemaining || 0) + (premiumRemaining || 0))))

    const desiredTotalSeats = Math.max(0, (vipRemaining || 0) + (premiumRemaining || 0) + (generalRemaining || 0)) || (guestCount || 0)
    const totalTables = Math.max(1, Math.ceil(desiredTotalSeats / seatsPerTableNum))

    let generatedSeats = 0
    const rowSeatCounters: Record<string, number> = {}
    let done = false

    // Generate seats for each table
    for (let tableNum = 1; tableNum <= totalTables; tableNum++) {
      if (done) break
      // Calculate table position (simple grid layout)
      const tablesPerRow = Math.max(1, Math.floor(hallLength / 10)) // Assuming 10ft spacing
      const row = Math.floor((tableNum - 1) / tablesPerRow)
      const col = (tableNum - 1) % tablesPerRow

      const tableX = (col + 1) * (hallLength / (tablesPerRow + 1))
      const tableY = (row + 1) * (hallWidth / (Math.ceil(totalTables / tablesPerRow) + 1))

      for (let seatNum = 1; seatNum <= seatsPerTableNum; seatNum++) {
        if (generatedSeats >= desiredTotalSeats) { done = true; break }

        // Determine seat type based on remaining counters
        let section = 'General'
        let type = 'STANDARD'
        let basePrice = prices.general
        if (vipRemaining > 0) {
          section = 'VIP'; type = 'VIP'; basePrice = prices.vip; vipRemaining--
        } else if (premiumRemaining > 0) {
          section = 'Premium'; type = 'PREMIUM'; basePrice = prices.premium; premiumRemaining--
        } else if (generalRemaining > 0) {
          section = 'General'; type = 'STANDARD'; basePrice = prices.general; generalRemaining--
        }

        // Seat position: circular around table unless seats-only (then align in grid)
        let seatX: number
        let seatY: number
        if (tableType === 'seats-only') {
          seatX = tableX
          seatY = tableY
        } else {
          const angle = (seatNum - 1) * (2 * Math.PI / seatsPerTableNum)
          seatX = tableX + 3 * Math.cos(angle)
          seatY = tableY + 3 * Math.sin(angle)
        }

        // Generate row label: A-Z, then AA, AB, etc. based on table row index
        const rowLetter = row < 26
          ? String.fromCharCode(65 + row)
          : String.fromCharCode(65 + Math.floor(row / 26) - 1) + String.fromCharCode(65 + (row % 26))

        // Determine seat_number sequentially within a row
        const currentSeatNumber = (rowSeatCounters[rowLetter] || 0) + 1
        rowSeatCounters[rowLetter] = currentSeatNumber

        await prisma.$executeRaw`
          INSERT INTO seat_inventory (
            event_id, section, row_number, seat_number, seat_type, 
            base_price, x_coordinate, y_coordinate, is_available
          ) VALUES (
            ${parseInt(eventId)}, 
            ${section}, 
            ${rowLetter}, 
            ${String(currentSeatNumber)}, 
            ${type},
            ${basePrice}, 
            ${seatX}, 
            ${seatY}, 
            true
          )
        `

        generatedSeats++
      }
    }

    console.log(`Generated ${generatedSeats} seats for event ${eventId}`)
  } catch (error) {
    console.error('Error generating seats:', error)
    throw error
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const { config, imageData } = body

    if (!config || !imageData) {
      return NextResponse.json({ error: 'Missing config or imageData' }, { status: 400 })
    }

    // Save floor plan to database using Prisma ORM
    console.log('[Floor Plan Save] Saving floor plan for event:', eventId)
    console.log('[Floor Plan Save] Config:', config)

    const result = await prisma.floorPlan.create({
      data: {
        eventId: BigInt(eventId),
        name: config.hallName || 'Untitled Floor Plan',
        description: config.description || null,
        layoutData: {
          config: config,
          imageData: imageData,
          objects: config.objects || []
        },
        canvasWidth: config.canvasWidth || 1200,
        canvasHeight: config.canvasHeight || 800,
        backgroundColor: config.backgroundColor || '#ffffff',
        gridSize: config.gridSize || 20,
        vipPrice: config.vipPrice || 0,
        premiumPrice: config.premiumPrice || 0,
        generalPrice: config.generalPrice || 0,
        totalCapacity: config.guestCount || 0,
        vipCapacity: config.vipSeats || 0,
        premiumCapacity: config.premiumSeats || 0,
        generalCapacity: config.generalSeats || 0
      },
      select: {
        id: true
      }
    })

    console.log('[Floor Plan Save] Saved with ID:', result.id)
    const floorPlanId = result.id

    // Generate seats based on floor plan configuration
    // Note: This might fail if seat_inventory tables are missing, but we shouldn't block floor plan saving
    let seatsGenerated = false
    try {
      await generateSeatsFromFloorPlan(eventId, config)
      seatsGenerated = true
      console.log('[Floor Plan Save] Seats generated successfully')
    } catch (seatError) {
      console.warn('Seat generation skipped due to missing tables or configuration:', seatError)
    }

    return NextResponse.json({ success: true, id: floorPlanId, seatsGenerated })
  } catch (error: any) {
    console.error('Save floor plan error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = BigInt(params.id)

    // Use Prisma Client to query the correct floor_plans table
    const floorPlans = await prisma.floorPlan.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        eventId: true,
        name: true,
        description: true,
        layoutData: true,
        createdAt: true,
        updatedAt: true,
        vipCapacity: true,
        premiumCapacity: true,
        generalCapacity: true,
        totalCapacity: true
      }
    })

    // Serialize BigInt fields
    const serialized = floorPlans.map(fp => ({
      id: fp.id,
      eventId: fp.eventId.toString(),
      name: fp.name,
      createdAt: fp.createdAt,
      config: {
        guestCount: fp.totalCapacity,
        vipSeats: fp.vipCapacity,
        premiumSeats: fp.premiumCapacity,
        generalSeats: fp.generalCapacity
      }
    }))

    return NextResponse.json(serialized)
  } catch (error: any) {
    console.error('Get floor plans error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
