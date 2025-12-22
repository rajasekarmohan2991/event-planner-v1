import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Ensure seats table exists
async function ensureSeatsTable() {
    try {
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS seats (
        id TEXT PRIMARY KEY,
        floor_plan_id TEXT NOT NULL,
        event_id BIGINT NOT NULL,
        tenant_id VARCHAR(255),
        section VARCHAR(50),
        row_number INT,
        seat_number INT,
        seat_label VARCHAR(50),
        seat_type VARCHAR(50),
        pricing_tier VARCHAR(50),
        price_inr INT DEFAULT 0,
        x_position DECIMAL(10, 2),
        y_position DECIMAL(10, 2),
        rotation INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'AVAILABLE',
        reserved_by BIGINT,
        reserved_at TIMESTAMP,
        booked_by BIGINT,
        booked_at TIMESTAMP,
        registration_id TEXT,
        is_accessible BOOLEAN DEFAULT FALSE,
        is_aisle BOOLEAN DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_seats_floor_plan ON seats(floor_plan_id)`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id)`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status)`)
    } catch (e) {
        console.error('Error ensuring seats table:', e)
    }
}

// GET - Fetch all seats for a floor plan
export async function GET(req: NextRequest, { params }: { params: { id: string, planId: string } }) {
    try {
        await ensureSeatsTable()

        const session = await getServerSession(authOptions)
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params

        const seats = await prisma.$queryRaw`
      SELECT 
        id, floor_plan_id as "floorPlanId", event_id::text as "eventId",
        section, row_number as "rowNumber", seat_number as "seatNumber", seat_label as "seatLabel",
        seat_type as "seatType", pricing_tier as "pricingTier", price_inr as "priceInr",
        x_position::text as "xPosition", y_position::text as "yPosition", rotation,
        status, reserved_by::text as "reservedBy", reserved_at as "reservedAt",
        booked_by::text as "bookedBy", booked_at as "bookedAt", registration_id as "registrationId",
        is_accessible as "isAccessible", is_aisle as "isAisle", notes
      FROM seats
      WHERE floor_plan_id = ${planId}
      ORDER BY section, row_number, seat_number
    ` as any[]

        return NextResponse.json({ seats })

    } catch (error: any) {
        console.error('GET seats error:', error)
        return NextResponse.json({ error: 'Failed to fetch seats', details: error.message }, { status: 500 })
    }
}

// POST - Generate seats for a floor plan object
export async function POST(req: NextRequest, { params }: { params: { id: string, planId: string } }) {
    try {
        await ensureSeatsTable()

        const session = await getServerSession(authOptions) as any
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        const eventId = BigInt(params.id)
        const body = await req.json()
        const { objectId, type, rows, cols, section, pricingTier, priceInr, x, y } = body

        console.log('🪑 Generating seats for object:', { objectId, type, rows, cols, section })

        // Get event tenant
        const events = await prisma.$queryRaw`
      SELECT tenant_id as "tenantId" FROM events WHERE id = ${eventId} LIMIT 1
    ` as any[]

        if (!events.length) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 })
        }

        const tenantId = events[0].tenantId
        const generatedSeats: any[] = []

        if (type === 'GRID') {
            // Generate grid seats (rows x cols)
            const seatWidth = 30
            const seatHeight = 30
            const seatSpacing = 5

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const seatId = `${objectId}-${row}-${col}`
                    const seatLabel = `${section}${row + 1}-${col + 1}`
                    const xPos = x + (col * (seatWidth + seatSpacing))
                    const yPos = y + (row * (seatHeight + seatSpacing))

                    await prisma.$executeRawUnsafe(`
            INSERT INTO seats (
              id, floor_plan_id, event_id, tenant_id,
              section, row_number, seat_number, seat_label,
              seat_type, pricing_tier, price_inr,
              x_position, y_position, rotation, status,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4,
              $5, $6, $7, $8,
              $9, $10, $11,
              $12, $13, $14, $15,
              NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
              x_position = $12,
              y_position = $13,
              updated_at = NOW()
          `,
                        seatId, planId, eventId, tenantId,
                        section, row + 1, col + 1, seatLabel,
                        'CHAIR', pricingTier, priceInr || 0,
                        xPos, yPos, 0, 'AVAILABLE'
                    )

                    generatedSeats.push({ id: seatId, label: seatLabel, x: xPos, y: yPos })
                }
            }
        } else if (type === 'ROUND_TABLE') {
            // Generate 8 seats around a round table
            const tableRadius = 60
            const seatRadius = 15
            const numSeats = 8

            for (let i = 0; i < numSeats; i++) {
                const angle = (i * 360) / numSeats
                const radian = (angle * Math.PI) / 180
                const seatX = x + tableRadius + (tableRadius + seatRadius) * Math.cos(radian)
                const seatY = y + tableRadius + (tableRadius + seatRadius) * Math.sin(radian)

                const seatId = `${objectId}-${i}`
                const seatLabel = `${section}-${i + 1}`

                await prisma.$executeRawUnsafe(`
          INSERT INTO seats (
            id, floor_plan_id, event_id, tenant_id,
            section, row_number, seat_number, seat_label,
            seat_type, pricing_tier, price_inr,
            x_position, y_position, rotation, status,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7, $8,
            $9, $10, $11,
            $12, $13, $14, $15,
            NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            x_position = $12,
            y_position = $13,
            updated_at = NOW()
        `,
                    seatId, planId, eventId, tenantId,
                    section, 1, i + 1, seatLabel,
                    'TABLE_SEAT', pricingTier, priceInr || 0,
                    seatX, seatY, angle, 'AVAILABLE'
                )

                generatedSeats.push({ id: seatId, label: seatLabel, x: seatX, y: seatY })
            }
        }

        console.log(`✅ Generated ${generatedSeats.length} seats`)

        return NextResponse.json({
            success: true,
            seats: generatedSeats,
            count: generatedSeats.length
        })

    } catch (error: any) {
        console.error('POST seats error:', error)
        return NextResponse.json({ error: 'Failed to generate seats', details: error.message }, { status: 500 })
    }
}
