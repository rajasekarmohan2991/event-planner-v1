import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET /api/events/[id]/floor-plans - Get all floor plans for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const floorPlans = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        id,
        event_id as "eventId",
        ticket_class as "ticketClass",
        floor_plan_image as "floorPlanImage",
        layout_config as "layoutConfig",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM floor_plans
      WHERE event_id = $1
      ORDER BY 
        CASE ticket_class
          WHEN 'VIP' THEN 1
          WHEN 'PREMIUM' THEN 2
          WHEN 'GENERAL' THEN 3
          ELSE 4
        END
    `, BigInt(eventId))

    // Convert BigInt to Number
    const safePlans = floorPlans.map(fp => ({
      id: Number(fp.id),
      eventId: Number(fp.eventId),
      ticketClass: fp.ticketClass,
      floorPlanImage: fp.floorPlanImage,
      layoutConfig: fp.layoutConfig,
      createdAt: fp.createdAt,
      updatedAt: fp.updatedAt
    }))

    return NextResponse.json(safePlans)
  } catch (e: any) {
    console.error('Error fetching floor plans:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to load floor plans',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

// POST /api/events/[id]/floor-plans - Create or update a floor plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { ticketClass, floorPlanImage, layoutConfig } = body

    if (!ticketClass) {
      return NextResponse.json({ message: 'Ticket class is required' }, { status: 400 })
    }

    // Check if floor plan already exists for this event and ticket class
    const existing = await prisma.$queryRawUnsafe<any[]>(`
      SELECT id FROM floor_plans 
      WHERE event_id = $1 AND ticket_class = $2
    `, BigInt(eventId), ticketClass)

    if (existing.length > 0) {
      // Update existing floor plan
      await prisma.$queryRawUnsafe(`
        UPDATE floor_plans
        SET 
          floor_plan_image = $1,
          layout_config = $2,
          updated_at = NOW()
        WHERE event_id = $3 AND ticket_class = $4
      `,
        floorPlanImage,
        layoutConfig ? JSON.stringify(layoutConfig) : null,
        BigInt(eventId),
        ticketClass
      )

      return NextResponse.json({
        success: true,
        message: 'Floor plan updated successfully'
      })
    } else {
      // Create new floor plan
      await prisma.$queryRawUnsafe(`
        INSERT INTO floor_plans (event_id, ticket_class, floor_plan_image, layout_config)
        VALUES ($1, $2, $3, $4)
      `,
        BigInt(eventId),
        ticketClass,
        floorPlanImage,
        layoutConfig ? JSON.stringify(layoutConfig) : null
      )

      return NextResponse.json({
        success: true,
        message: 'Floor plan created successfully'
      }, { status: 201 })
    }
  } catch (e: any) {
    console.error('Error saving floor plan:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to save floor plan',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

// DELETE /api/events/[id]/floor-plans - Delete a floor plan
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const ticketClass = searchParams.get('ticketClass')

    if (!ticketClass) {
      return NextResponse.json({ message: 'Ticket class is required' }, { status: 400 })
    }

    // Delete floor plan and associated seats
    await prisma.$queryRawUnsafe(`
      DELETE FROM floor_plans 
      WHERE event_id = $1 AND ticket_class = $2
    `, BigInt(eventId), ticketClass)

    // Also delete seats for this ticket class
    await prisma.$queryRawUnsafe(`
      DELETE FROM seat_inventory
      WHERE event_id = $1 AND ticket_class = $2
    `, BigInt(eventId), ticketClass)

    return NextResponse.json({
      success: true,
      message: 'Floor plan and seats deleted successfully'
    })
  } catch (e: any) {
    console.error('Error deleting floor plan:', e)
    return NextResponse.json({ 
      message: e?.message || 'Failed to delete floor plan',
      error: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}
