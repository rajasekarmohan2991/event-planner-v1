import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'


export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params
        const id = params.id
        console.log('🔍 [FloorPlan GET] Starting for event:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            console.warn('⚠️ [FloorPlan GET] Unauthorized access attempt')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const eventId = BigInt(id)

        // Use queryRawUnsafe to be robust against schema mismatches (e.g. nullable fields)
        const plans = await prisma.$queryRawUnsafe(`
            SELECT 
                id, 
                "eventId", 
                tenant_id as "tenantId", 
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
                status,
                version,
                created_at as "createdAt",
                updated_at as "updatedAt",
                "layoutData"
            FROM floor_plans
            WHERE "eventId" = $1
            ORDER BY created_at DESC
        `, eventId) as any[]

        console.log(`✅ [FloorPlan GET] Found ${plans.length} plans in database`)

        // Explicit serialization
        const serialized = plans.map(fp => ({
            id: fp.id,
            eventId: fp.eventId ? fp.eventId.toString() : eventId.toString(),
            tenantId: fp.tenantId,
            name: fp.name,
            description: fp.description,
            canvasWidth: fp.canvasWidth,
            canvasHeight: fp.canvasHeight,
            backgroundColor: fp.backgroundColor,
            gridSize: fp.gridSize,
            vipPrice: String(fp.vipPrice || 0),
            premiumPrice: String(fp.premiumPrice || 0),
            generalPrice: String(fp.generalPrice || 0),
            totalCapacity: fp.totalCapacity,
            vipCapacity: fp.vipCapacity,
            premiumCapacity: fp.premiumCapacity,
            generalCapacity: fp.generalCapacity,
            menCapacity: fp.menCapacity,
            womenCapacity: fp.womenCapacity,
            status: fp.status,
            version: fp.version,
            createdAt: fp.createdAt,
            updatedAt: fp.updatedAt,
            objects: (fp.layoutData as any)?.objects || []
        }))

        return NextResponse.json({
            floorPlans: serialized,
            total: serialized.length
        })

    } catch (error: any) {
        console.error('❌ [FloorPlan GET] Fatal Error:', error)

        // Attempt self-repair
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log('🔧 [FloorPlan GET] Attempting schema repair...')
            await ensureSchema()
            return NextResponse.json({ message: 'Database schema repaired. Please retry.' }, { status: 503 })
        }

        return NextResponse.json({
            message: 'Failed to load floor plans',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, { status: 500 })
    }
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    console.log('🚀 [FloorPlan POST] Handler invoked')

    try {
        const params = await context.params
        const id = params.id
        console.log('📌 [FloorPlan POST] Event ID:', id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) {
            console.warn('⚠️ [FloorPlan POST] No session')
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }
        console.log('✅ [FloorPlan POST] Session validated')

        let body: any
        try {
            body = await req.json()
            console.log('✅ [FloorPlan POST] Body parsed, keys:', Object.keys(body))
        } catch (parseError: any) {
            console.error('❌ [FloorPlan POST] JSON parse error:', parseError.message)
            return NextResponse.json({
                message: 'Invalid JSON',
                error: parseError.message
            }, { status: 400 })
        }

        let eventId: bigint
        try {
            eventId = BigInt(id)
            console.log('✅ [FloorPlan POST] EventId as BigInt:', eventId.toString())
        } catch (bigintError: any) {
            console.error('❌ [FloorPlan POST] BigInt conversion error:', bigintError.message)
            return NextResponse.json({
                message: 'Invalid event ID',
                error: bigintError.message
            }, { status: 400 })
        }

        // Get tenant ID with robust error handling
        let tenantId = null
        try {
            const event = await prisma.event.findFirst({
                where: { id: eventId },
                select: { tenantId: true }
            })
            tenantId = event?.tenantId || null
            console.log('✅ [FloorPlan POST] TenantId:', tenantId)
        } catch (eventError: any) {
            console.warn('⚠️ [FloorPlan POST] Event fetch error:', eventError.message)
            // Continue with null tenantId
        }

        console.log('📝 [FloorPlan POST] Preparing data for creation...')

        const createData = {
            id: body.id && !body.id.startsWith('fp-') ? body.id : undefined,
            eventId: eventId,
            tenantId: tenantId,
            name: body.name || 'New Floor Plan',
            description: body.description || null,
            canvasWidth: Number(body.canvasWidth || body.width) || 1200,
            canvasHeight: Number(body.canvasHeight || body.height) || 800,
            backgroundColor: body.backgroundColor || '#ffffff',
            gridSize: Number(body.gridSize) || 20,
            vipPrice: Number(body.vipPrice) || 0,
            premiumPrice: Number(body.premiumPrice) || 0,
            generalPrice: Number(body.generalPrice) || 0,
            totalCapacity: Number(body.totalCapacity) || 0,
            vipCapacity: Number(body.vipCapacity) || 0,
            premiumCapacity: Number(body.premiumCapacity) || 0,
            generalCapacity: Number(body.generalCapacity) || 0,
            menCapacity: Number(body.menCapacity) || 0,
            womenCapacity: Number(body.womenCapacity) || 0,
            layoutData: body.layoutData || body.objects ? { objects: body.objects } : {},
            status: 'DRAFT' as any
        }

        console.log('📝 [FloorPlan POST] Data prepared:', {
            hasId: !!createData.id,
            eventId: createData.eventId.toString(),
            name: createData.name,
            status: createData.status
        })

        let newFloorPlan: any
        try {
            console.log('💾 [FloorPlan POST] Calling prisma.floorPlan.create...')
            newFloorPlan = await prisma.floorPlan.create({
                data: createData
            })
            console.log('✅ [FloorPlan POST] Created successfully, ID:', newFloorPlan.id)
        } catch (createError: any) {
            console.error('❌ [FloorPlan POST] Prisma create error:', {
                message: createError.message,
                code: createError.code,
                meta: createError.meta,
                stack: createError.stack?.split('\n').slice(0, 5)
            })
            return NextResponse.json({
                message: 'Database error',
                error: createError.message,
                code: createError.code,
                details: createError.meta
            }, { status: 500 })
        }

        // Serialize response
        console.log('📤 [FloorPlan POST] Preparing response...')
        try {
            const serialized = {
                ...newFloorPlan,
                eventId: newFloorPlan.eventId.toString(),
                vipPrice: String(newFloorPlan.vipPrice),
                premiumPrice: String(newFloorPlan.premiumPrice),
                generalPrice: String(newFloorPlan.generalPrice)
            }

            console.log('✅ [FloorPlan POST] Response serialized successfully')
            return NextResponse.json({
                message: 'Floor plan created successfully',
                floorPlan: serialized
            }, { status: 201 })
        } catch (serializeError: any) {
            console.error('❌ [FloorPlan POST] Serialization error:', serializeError.message)
            return NextResponse.json({
                message: 'Serialization error',
                error: serializeError.message
            }, { status: 500 })
        }

    } catch (error: any) {
        console.error('❌ [FloorPlan POST] FATAL ERROR:', {
            message: error.message,
            name: error.name
        })

        // Attempt self-repair
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
            console.log('🔧 [FloorPlan POST] Attempting schema repair...')
            await ensureSchema()
            return NextResponse.json({ message: 'Database schema repaired. Please retry.' }, { status: 503 })
        }

        return NextResponse.json({
            message: 'Fatal error in floor plan creation',
            error: error.message,
            type: error.name
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
        const body = await req.json()
        const eventId = BigInt(id)

        const session = await getServerSession(authOptions as any) as any
        if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

        if (!body.id) return NextResponse.json({ message: 'Floor plan ID is required' }, { status: 400 })

        console.log('📌 [FloorPlan PUT] Attempting upsert for:', body.id)

        // Use upsert to handle cases where the frontend thinks it's an update but record doesn't exist
        const updated = await prisma.floorPlan.upsert({
            where: { id: body.id },
            update: {
                name: body.name,
                description: body.description,
                canvasWidth: Number(body.canvasWidth),
                canvasHeight: Number(body.canvasHeight),
                backgroundColor: body.backgroundColor,
                gridSize: Number(body.gridSize),
                vipPrice: body.vipPrice,
                premiumPrice: body.premiumPrice,
                generalPrice: body.generalPrice,
                totalCapacity: Number(body.totalCapacity),
                vipCapacity: Number(body.vipCapacity),
                premiumCapacity: Number(body.premiumCapacity),
                generalCapacity: Number(body.generalCapacity),
                menCapacity: Number(body.menCapacity),
                womenCapacity: Number(body.womenCapacity),
                layoutData: body.layoutData,
                status: body.status,
                version: { increment: 1 }
            },
            create: {
                id: body.id.startsWith('fp-') ? undefined : body.id, // Handle mock IDs
                eventId: eventId,
                name: body.name || 'New Floor Plan',
                layoutData: body.layoutData || {},
                canvasWidth: Number(body.canvasWidth) || 1200,
                canvasHeight: Number(body.canvasHeight) || 800,
                backgroundColor: body.backgroundColor || '#ffffff',
                gridSize: Number(body.gridSize) || 20,
                status: body.status || 'DRAFT'
            }
        })

        console.log('✅ [FloorPlan PUT] Success')

        return NextResponse.json({
            message: 'Floor plan saved successfully',
            floorPlan: {
                ...updated,
                eventId: updated.eventId.toString(),
                vipPrice: String(updated.vipPrice),
                premiumPrice: String(updated.premiumPrice),
                generalPrice: String(updated.generalPrice)
            }
        })
    } catch (error: any) {
        console.error('❌ [FloorPlan PUT] Fatal Error:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}
