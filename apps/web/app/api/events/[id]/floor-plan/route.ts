import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

// Production schema: eventId is BIGINT (camelCase, unquoted)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(params.id)
        const body = await req.json()

        console.log('📐 Creating floor plan for event:', params.id)

        // 1. Get Event to find tenantId
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { tenantId: true }
        })

        if (!event) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 })
        }

        // 2. Create Floor Plan using Prisma Client (Handles types/mapping automatically)
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
                layoutData: body.layoutData || {}, // Prisma handles JSON conversion
                status: body.status || 'DRAFT'
            }
        })

        // Convert BigInt to string for response
        const responseData = {
            ...newFloorPlan,
            id: newFloorPlan.id,
            eventId: params.id, // Return string
        }

        console.log('✅ Floor plan created:', newFloorPlan.id)

        return NextResponse.json({
            message: 'Floor plan created successfully',
            floorPlan: responseData
        }, { status: 201 })

    } catch (error: any) {
        console.error('❌ Error creating floor plan:', error)

        // Auto-heal
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            await ensureSchema()
            return NextResponse.json({ message: 'Database schema repaired. Please retry.' }, { status: 503 })
        }

        return NextResponse.json({
            message: 'Failed to create floor plan',
            error: error.message
        }, { status: 500 })
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(params.id)
        const body = await req.json()

        console.log('📐 Updating floor plan for event:', params.id, 'Floor plan ID:', body.id)

        if (!body.id) {
            return NextResponse.json({ message: 'Floor plan ID is required for update' }, { status: 400 })
        }

        // Update Floor Plan
        const updatedFloorPlan = await prisma.floorPlan.update({
            where: {
                id: body.id
            },
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
            eventId: params.id
        }

        console.log('✅ Floor plan updated:', body.id)

        return NextResponse.json({
            message: 'Floor plan updated successfully',
            floorPlan: responseData
        })

    } catch (error: any) {
        console.error('❌ Error updating floor plan:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}
