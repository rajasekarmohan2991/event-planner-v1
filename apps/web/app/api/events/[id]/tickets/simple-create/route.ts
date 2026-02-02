import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/tickets/simple-create - Simple ticket class creation
// Input: { ticketClass: 'VIP'|'PREMIUM'|'GENERAL', quantity: 25, price: 500 }
// Output: Creates exactly 'quantity' number of seats
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const { ticketClass, quantity, price } = await req.json()

    // Validate inputs
    if (!ticketClass || !['VIP', 'PREMIUM', 'GENERAL'].includes(ticketClass)) {
      return NextResponse.json({ 
        error: 'Invalid ticket class. Must be VIP, PREMIUM, or GENERAL' 
      }, { status: 400 })
    }

    if (!quantity || quantity < 1 || quantity > 1000) {
      return NextResponse.json({ 
        error: 'Quantity must be between 1 and 1000' 
      }, { status: 400 })
    }

    if (!price || price < 0) {
      return NextResponse.json({ 
        error: 'Price must be a positive number' 
      }, { status: 400 })
    }

    // Delete existing seats for this ticket class
    await prisma.$executeRaw`
      DELETE FROM seat_inventory 
      WHERE event_id = ${eventId} 
      AND section = ${ticketClass}
    `

    // Create seats with simple sequential numbering
    const seatPrefix = ticketClass.charAt(0) // V, P, or G
    const createdSeats = []

    for (let i = 1; i <= quantity; i++) {
      const seatNumber = `${seatPrefix}${i}`
      
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
          is_available
        ) VALUES (
          ${eventId},
          ${ticketClass},
          ${Math.ceil(i / 10).toString()},
          ${seatNumber},
          ${ticketClass},
          ${price},
          ${(i % 10) * 50},
          ${Math.floor((i - 1) / 10) * 50},
          true
        )
      `
      
      createdSeats.push(seatNumber)
    }

    // Create or update floor plan config
    await prisma.$executeRaw`
      INSERT INTO floor_plan_configs (
        event_id,
        plan_name,
        layout_data,
        total_seats,
        sections,
        created_by
      ) VALUES (
        ${eventId},
        ${ticketClass + ' Floor Plan'},
        ${JSON.stringify({
          ticketClass,
          quantity,
          price,
          createdAt: new Date().toISOString()
        })}::jsonb,
        ${quantity},
        ${JSON.stringify([{
          name: ticketClass,
          type: ticketClass,
          basePrice: price,
          totalSeats: quantity
        }])}::jsonb,
        ${BigInt((session as any).user?.id || 1)}
      )
      ON CONFLICT (event_id, plan_name)
      DO UPDATE SET
        layout_data = EXCLUDED.layout_data,
        total_seats = EXCLUDED.total_seats,
        sections = EXCLUDED.sections,
        updated_at = NOW()
    `

    return NextResponse.json({
      success: true,
      ticketClass,
      quantity,
      price,
      message: `Successfully created ${quantity} ${ticketClass} tickets (${seatPrefix}1 to ${seatPrefix}${quantity})`,
      preview: createdSeats.slice(0, 10)
    }, { status: 201 })

  } catch (error: any) {
    console.error('Error creating tickets:', error)
    return NextResponse.json({ 
      error: 'Failed to create tickets',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}
