import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/events/[id]/settings/tickets - Get ticket pricing settings
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)

    // Ensure table exists
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS event_ticket_settings (
          id BIGSERIAL PRIMARY KEY,
          event_id BIGINT NOT NULL UNIQUE,
          vip_price DECIMAL(10,2) DEFAULT 0,
          premium_price DECIMAL(10,2) DEFAULT 0,
          general_price DECIMAL(10,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `)
    } catch (e) {
      // Ignore if table exists
    }

    // Get ticket settings or return defaults
    const settings = await prisma.$queryRaw`
      SELECT 
        id::text,
        event_id as "eventId",
        vip_price as "vipPrice",
        premium_price as "premiumPrice",
        general_price as "generalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM event_ticket_settings
      WHERE event_id = ${eventId}
    ` as any[]

    if (settings.length === 0) {
      // Return default prices if no settings exist
      return NextResponse.json({
        eventId,
        vipPrice: 500,
        premiumPrice: 300,
        generalPrice: 150,
        isDefault: true
      })
    }

    return NextResponse.json({
      ...settings[0],
      isDefault: false
    })
  } catch (error: any) {
    console.error('Get ticket settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ticket settings' },
      { status: 500 }
    )
  }
}

// POST /api/events/[id]/settings/tickets - Create or update ticket pricing
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const body = await req.json()
    const { vipPrice, premiumPrice, generalPrice } = body

    // Validate prices
    if (typeof vipPrice !== 'number' || vipPrice < 0) {
      return NextResponse.json({ error: 'Invalid VIP price' }, { status: 400 })
    }
    if (typeof premiumPrice !== 'number' || premiumPrice < 0) {
      return NextResponse.json({ error: 'Invalid Premium price' }, { status: 400 })
    }
    if (typeof generalPrice !== 'number' || generalPrice < 0) {
      return NextResponse.json({ error: 'Invalid General price' }, { status: 400 })
    }

    // Upsert ticket settings
    await prisma.$executeRaw`
      INSERT INTO event_ticket_settings (event_id, vip_price, premium_price, general_price, updated_at)
      VALUES (${eventId}, ${vipPrice}, ${premiumPrice}, ${generalPrice}, NOW())
      ON CONFLICT (event_id) 
      DO UPDATE SET 
        vip_price = ${vipPrice},
        premium_price = ${premiumPrice},
        general_price = ${generalPrice},
        updated_at = NOW()
    `

    // Fetch the updated settings
    const settings = await prisma.$queryRaw`
      SELECT 
        id::text,
        event_id as "eventId",
        vip_price as "vipPrice",
        premium_price as "premiumPrice",
        general_price as "generalPrice",
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM event_ticket_settings
      WHERE event_id = ${eventId}
    ` as any[]

    return NextResponse.json({
      success: true,
      settings: settings[0]
    })
  } catch (error: any) {
    console.error('Update ticket settings error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update ticket settings' },
      { status: 500 }
    )
  }
}
