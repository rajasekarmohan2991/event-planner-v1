import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

// Production schema: eventId is BIGINT (camelCase, unquoted)

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> | { id: string } }
) {
    // Await params if it's a Promise (Next.js 15+)
    const params = 'then' in context.params ? await context.params : context.params

    // Force rebuild checksum
    console.log('🔍 [FloorPlan GET] Request received for event:', params.id)

    try {
        const session = await getServerSession(authOptions as any)
        console.log('🔍 [FloorPlan GET] Session:', session ? 'Authenticated' : 'Not authenticated')

        if (!session) {
            console.log('❌ [FloorPlan GET] Unauthorized - no session')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        let eventId: bigint
        try {
            eventId = BigInt(params.id)
            console.log('🔍 [FloorPlan GET] Event ID converted:', eventId.toString())
        } catch (e) {
            console.error('❌ [FloorPlan GET] Invalid event ID:', params.id, e)
            return NextResponse.json({ message: 'Invalid event ID' }, { status: 400 })
        }

        console.log('📐 [FloorPlan GET] Fetching floor plans for event:', eventId.toString())

        const floorPlansRaw = await prisma.$queryRaw`
            SELECT 
                id,
                "eventId"::text as "eventId",
                name,
                description,
                "canvasWidth",
                "canvasHeight",
                "backgroundColor",
                "gridSize",
                "vipPrice",
                "premiumPrice",
                "generalPrice",
                "totalCapacity",
                "vipCapacity",
                "premiumCapacity",
                "generalCapacity",
                "menCapacity",
                "womenCapacity",
                "layoutData",
                status,
                version,
                created_at as "createdAt",
                updated_at as "updatedAt",
                tenant_id as "tenantId"
            FROM floor_plans
            WHERE "eventId" = ${eventId}
            ORDER BY created_at DESC
        ` as any[]

        console.log(`🔍 [FloorPlan GET] Raw query returned ${floorPlansRaw.length} results`)

        const floorPlans = floorPlansRaw.map(fp => ({
            ...fp,
            objects: fp.layoutData?.objects || []
        }))

        console.log(`✅ [FloorPlan GET] Found ${floorPlans.length} floor plans`)

        return NextResponse.json({
            floorPlans,
            total: floorPlans.length
        })
    } catch (error: any) {
        console.error('❌ [FloorPlan GET] Error fetching floor plans:', error)

        // Auto-heal
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            await ensureSchema()
            return NextResponse.json({ message: 'Database schema repaired. Please retry.' }, { status: 503 })
        }

        console.error('❌ [FloorPlan GET] Error stack:', error.stack)
        return NextResponse.json({
            message: 'Failed to load floor plans',
            error: error.message
        }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        console.log('📌 [FloorPlan POST] Creating for event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(id)
        const body = await req.json()

        // 1. Get Event (optional check, better debugging)
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { tenantId: true }
        })

        if (!event) {
            console.error('❌ [FloorPlan POST] Event not found for ID:', id)
            // Still return 404, but logged.
            return NextResponse.json({ message: `Event ${id} not found` }, { status: 404 })
        }

        console.log('✅ [FloorPlan POST] Event found, creating plan...')

        // 2. Create Floor Plan using Prisma Client
        const newFloorPlan = await prisma.floorPlan.create({
            data: {
                eventId: eventId,
                tenantId: event.tenantId,
                name: body.name || 'New Floor Plan',
                description: body.description || null,
                canvasWidth: body.canvasWidth || 1200,
                canvasHeight: body.canvasHeight || 800,
                backgroundColor: body.backgroundColor || '#ffffff',
                gridSize: body.gridSize || 20,
                vipPrice: body.vipPrice || 0,
                premiumPrice: body.premiumPrice || 0,
                generalPrice: body.generalPrice || 0,
                totalCapacity: body.totalCapacity || 0,
                vipCapacity: body.vipCapacity || 0,
                premiumCapacity: body.premiumCapacity || 0,
                generalCapacity: body.generalCapacity || 0,
                menCapacity: body.menCapacity || 0,
                womenCapacity: body.womenCapacity || 0,
                layoutData: body.layoutData || {},
                status: body.status || 'DRAFT'
            }
        })

        const responseData = {
            ...newFloorPlan,
            id: newFloorPlan.id,
            eventId: id,
        }

        console.log('✅ [FloorPlan POST] Success:', newFloorPlan.id)

        return NextResponse.json({
            message: 'Floor plan created successfully',
            floorPlan: responseData
        }, { status: 201 })

    } catch (error: any) {
        console.error('❌ [FloorPlan POST] Error:', error)
        return NextResponse.json({
            message: 'Failed to create floor plan',
            error: error.message
        }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        console.log('📌 [FloorPlan PUT] Updating event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        console.log('📌 [FloorPlan PUT] Plan ID:', body.id)

        if (!body.id) {
            return NextResponse.json({ message: 'Floor plan ID is required' }, { status: 400 })
        }

        const updatedFloorPlan = await prisma.floorPlan.update({
            where: { id: body.id },
            data: {
                name: body.name,
                description: body.description,
                canvasWidth: body.canvasWidth,
                canvasHeight: body.canvasHeight,
                backgroundColor: body.backgroundColor,
                gridSize: body.gridSize,
                vipPrice: body.vipPrice,
                premiumPrice: body.premiumPrice,
                generalPrice: body.generalPrice,
                totalCapacity: body.totalCapacity,
                vipCapacity: body.vipCapacity,
                premiumCapacity: body.premiumCapacity,
                generalCapacity: body.generalCapacity,
                menCapacity: body.menCapacity,
                womenCapacity: body.womenCapacity,
                layoutData: body.layoutData,
                status: body.status,
                version: { increment: 1 }
            }
        })

        const responseData = {
            ...updatedFloorPlan,
            eventId: id
        }

        console.log('✅ [FloorPlan PUT] Success:', body.id)

        return NextResponse.json({
            message: 'Floor plan updated successfully',
            floorPlan: responseData
        })
    } catch (error: any) {
        console.error('❌ [FloorPlan PUT] Error:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}
