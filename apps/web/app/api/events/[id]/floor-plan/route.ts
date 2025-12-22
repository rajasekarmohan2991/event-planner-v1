import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Production schema: eventId is BIGINT (camelCase, unquoted)

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(params.id)
        console.log('📐 Fetching floor plans for event:', eventId)

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

        const floorPlans = floorPlansRaw.map(fp => ({
            ...fp,
            objects: fp.layoutData?.objects || []
        }))

        console.log(`✅ Found ${floorPlans.length} floor plans`)

        return NextResponse.json({
            floorPlans,
            total: floorPlans.length
        })
    } catch (error: any) {
        console.error('❌ Error fetching floor plans:', error)
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

        console.log('📐 Creating floor plan for event:', eventId)

        // Fetch Event
        const events = await prisma.$queryRaw`
            SELECT id, tenant_id as "tenantId" 
            FROM events 
            WHERE id = ${eventId} 
            LIMIT 1
        ` as any[]

        if (events.length === 0) {
            return NextResponse.json({ message: 'Event not found' }, { status: 404 })
        }

        const event = events[0]
        const tenantId = event.tenantId
        const newId = randomUUID()

        // Insert Floor Plan
        await prisma.$executeRawUnsafe(`
            INSERT INTO floor_plans (
                id, "eventId", tenant_id,
                name, description, 
                "canvasWidth", "canvasHeight", "backgroundColor", "gridSize",
                "vipPrice", "premiumPrice", "generalPrice",
                "totalCapacity", "vipCapacity", "premiumCapacity", "generalCapacity",
                "menCapacity", "womenCapacity",
                "layoutData", status, version,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3,
                $4, $5,
                $6, $7, $8, $9,
                $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18,
                $19, $20, 1,
                NOW(), NOW()
            )
        `,
            newId,
            eventId,
            tenantId,
            body.name || 'New Floor Plan',
            body.description || null,
            body.canvasWidth || 1200,
            body.canvasHeight || 800,
            body.backgroundColor || '#ffffff',
            body.gridSize || 20,
            body.vipPrice || 0,
            body.premiumPrice || 0,
            body.generalPrice || 0,
            body.totalCapacity || 0,
            body.vipCapacity || 0,
            body.premiumCapacity || 0,
            body.generalCapacity || 0,
            body.menCapacity || 0,
            body.womenCapacity || 0,
            body.layoutData ? JSON.stringify(body.layoutData) : null,
            body.status || 'DRAFT'
        )

        console.log('✅ Floor plan created:', newId)

        return NextResponse.json({
            message: 'Floor plan created successfully',
            floorPlan: { id: newId, eventId: eventId.toString(), tenantId, ...body }
        }, { status: 201 })

    } catch (error: any) {
        console.error('❌ Error creating floor plan:', error)
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

        console.log('📐 Updating floor plan for event:', eventId, 'Floor plan ID:', body.id)

        if (!body.id) {
            return NextResponse.json({ message: 'Floor plan ID is required for update' }, { status: 400 })
        }

        // Update Floor Plan
        await prisma.$executeRawUnsafe(`
            UPDATE floor_plans SET
                name = $1,
                description = $2,
                "canvasWidth" = $3,
                "canvasHeight" = $4,
                "backgroundColor" = $5,
                "gridSize" = $6,
                "vipPrice" = $7,
                "premiumPrice" = $8,
                "generalPrice" = $9,
                "totalCapacity" = $10,
                "vipCapacity" = $11,
                "premiumCapacity" = $12,
                "generalCapacity" = $13,
                "menCapacity" = $14,
                "womenCapacity" = $15,
                "layoutData" = $16,
                status = $17,
                version = version + 1,
                updated_at = NOW()
            WHERE id = $18 AND "eventId" = $19
        `,
            body.name || 'Floor Plan',
            body.description || null,
            body.canvasWidth || 1200,
            body.canvasHeight || 800,
            body.backgroundColor || '#ffffff',
            body.gridSize || 20,
            body.vipPrice || 0,
            body.premiumPrice || 0,
            body.generalPrice || 0,
            body.totalCapacity || 0,
            body.vipCapacity || 0,
            body.premiumCapacity || 0,
            body.generalCapacity || 0,
            body.menCapacity || 0,
            body.womenCapacity || 0,
            body.layoutData ? JSON.stringify(body.layoutData) : null,
            body.status || 'DRAFT',
            body.id,
            eventId
        )

        console.log('✅ Floor plan updated:', body.id)

        return NextResponse.json({
            message: 'Floor plan updated successfully',
            floorPlan: { id: body.id, eventId: eventId.toString(), ...body }
        })

    } catch (error: any) {
        console.error('❌ Error updating floor plan:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}
