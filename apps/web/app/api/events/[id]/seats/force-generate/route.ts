import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateSeats } from '@/lib/seat-generator'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/force-generate - Force regenerate seats from existing floor plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    
    console.log('[ForceGenerate] Starting for event:', eventId)

    // Check floor_plan_configs first
    const configs = await prisma.$queryRaw<any[]>`
      SELECT layout_data, total_seats, plan_name, event_id, tenant_id 
      FROM floor_plan_configs 
      WHERE event_id = ${eventId}::bigint 
      LIMIT 1
    `

    let floorPlan: any = null
    let source = ''

    if (configs.length > 0) {
      const cfg = configs[0]
      let layoutData
      try {
        layoutData = (typeof cfg.layout_data === 'string') ? JSON.parse(cfg.layout_data) : cfg.layout_data
      } catch (e) {
        layoutData = cfg.layout_data
      }

      floorPlan = {
        layoutData: layoutData,
        tenantId: cfg.tenant_id
      }
      source = 'floor_plan_configs'
      console.log('[ForceGenerate] Found floor plan in floor_plan_configs')
    } else {
      // Check legacy floor_plans
      const legacy = await prisma.floorPlan.findFirst({
        where: { eventId: BigInt(eventId) },
        orderBy: { createdAt: 'desc' }
      })
      
      if (legacy) {
        floorPlan = {
          layoutData: legacy.layoutData,
          tenantId: legacy.tenantId
        }
        source = 'floor_plans (legacy)'
        console.log('[ForceGenerate] Found floor plan in legacy floor_plans')
      }
    }

    if (!floorPlan) {
      return NextResponse.json({
        error: 'No floor plan found for this event',
        message: 'Please create a floor plan first in the event design section'
      }, { status: 404 })
    }

    console.log('[ForceGenerate] Floor plan source:', source)
    console.log('[ForceGenerate] Layout data keys:', Object.keys(floorPlan.layoutData || {}))
    console.log('[ForceGenerate] Layout data sample:', JSON.stringify(floorPlan.layoutData).substring(0, 500))

    // Check if layoutData is empty
    if (!floorPlan.layoutData || (typeof floorPlan.layoutData === 'object' && Object.keys(floorPlan.layoutData).length === 0)) {
      return NextResponse.json({
        error: 'Floor plan exists but has no layout data',
        message: 'The floor plan is empty. Please configure it in the event design section.',
        debug: {
          source,
          layoutData: floorPlan.layoutData
        }
      }, { status: 400 })
    }

    // Delete existing seats
    const deleteResult = await prisma.seatInventory.deleteMany({
      where: { eventId: BigInt(eventId) }
    })
    console.log('[ForceGenerate] Deleted', deleteResult.count, 'existing seats')

    // Generate new seats
    console.log('[ForceGenerate] Calling generateSeats...')
    const result = await generateSeats(eventId, floorPlan.layoutData, floorPlan.tenantId)
    console.log('[ForceGenerate] Generation complete. Count:', result.count)

    // Verify seats were created
    const verifyCount = await prisma.seatInventory.count({
      where: { eventId: BigInt(eventId) }
    })

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${result.count} seats`,
      details: {
        source,
        seatsGenerated: result.count,
        seatsInDatabase: verifyCount,
        preview: result.seats.slice(0, 5)
      }
    })

  } catch (error: any) {
    console.error('[ForceGenerate] Error:', error)
    return NextResponse.json({
      error: 'Failed to generate seats',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}
