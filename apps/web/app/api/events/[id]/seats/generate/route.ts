
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'
import { getTenantId } from '@/lib/tenant-context'
import { ensureSchema } from '@/lib/ensure-schema'
import { generateSeats } from '@/lib/seat-generator'

export const dynamic = 'force-dynamic'

// POST /api/events/[id]/seats/generate - Generate seat inventory from floor plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('[API] /api/events/[id]/seats/generate - Starting')

    // Auth & Permission checks
    const permissionCheck = await checkPermissionInRoute('events.edit', 'Generate Seats')
    if (permissionCheck) return permissionCheck

    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = parseInt(params.id)
    const tenantId = getTenantId() || null

    // Ensure schema
    try { await ensureSchema() } catch (e) { console.warn('[API] Schema check warning:', e) }

    const body = await req.json().catch(() => ({}))
    const { floorPlan, pricingRules } = body || {}

    // Support v2 payload adaptation
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

    // Lookup logic omitted as per previous optimization (assume details passed in body)
    if (!plan) {
      return NextResponse.json({ error: 'Floor plan is required' }, { status: 400 })
    }

    const planName = plan.name || 'Default Floor Plan'
    const totalSeats = plan.totalSeats || 0

    // Check if sections is array or object, Prisma expects JSON compatible
    const sections = plan.sections || []

    // Use Prisma Client UPSERT to handle JSON serialization safely (Avoiding SQL Cast Errors)
    await prisma.floorPlanConfig.upsert({
      where: {
        eventId_planName: {
          eventId: BigInt(eventId),
          planName: planName
        }
      },
      update: {
        layoutData: plan,
        totalSeats: totalSeats,
        sections: sections,
        tenantId: tenantId,
        updatedAt: new Date()
      },
      create: {
        eventId: BigInt(eventId),
        planName: planName,
        layoutData: plan,
        totalSeats: totalSeats,
        sections: sections,
        tenantId: tenantId
      }
    })

    // Generate Seats using Optimized Library - pass pricingRules for correct pricing
    const genResult = await generateSeats(eventId, plan, tenantId, pricingRules)
    const totalSeatsGenerated = genResult.count

    // Save pricing rules if provided (wrapped in try-catch to not fail the whole request)
    if (pricingRules && Array.isArray(pricingRules) && pricingRules.length > 0) {
      try {
        console.log('[API] Saving pricing rules:', pricingRules.length)
        for (const rule of pricingRules) {
          if (rule.basePrice != null) {
            await prisma.$executeRaw`
              INSERT INTO seat_pricing_rules (
                event_id, section, row_pattern, seat_type, base_price, multiplier
              ) VALUES (
                ${eventId}::bigint, ${rule.section || null}, ${rule.rowPattern || null}, 
                ${rule.seatType || null}, ${Number(rule.basePrice) || 0}, ${Number(rule.multiplier) || 1.0}
              )
            `
          }
        }
      } catch (priceError) {
        console.warn('[API] Pricing rules save failed (non-critical):', priceError)
      }
    }

    console.log('[API] ✅ Successfully generated', totalSeatsGenerated, 'seats')

    return NextResponse.json({
      success: true,
      totalSeatsGenerated,
      message: `Generated ${totalSeatsGenerated} seats from floor plan`,
      preview: genResult.seats.slice(0, 10)
    }, { status: 201 })

  } catch (error: any) {
    console.error('[API] ❌ Error generating seats:', error)
    return NextResponse.json({
      error: 'Failed to generate seats',
      details: error.message
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

    // Fetch floor plan using Prisma Client for consistency
    const planData = await prisma.floorPlanConfig.findFirst({
      where: { eventId: BigInt(eventId) },
      orderBy: { createdAt: 'desc' }
    })

    // Count seats
    const seatCountResult = await prisma.seatInventory.count({
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
      totalSeats: seatCountResult
    })

  } catch (error: any) {
    console.error('Error fetching floor plan:', error)
    return NextResponse.json({
      error: 'Failed to fetch floor plan',
      details: error.message
    }, { status: 500 })
  }
}
