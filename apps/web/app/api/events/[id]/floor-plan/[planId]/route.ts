import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get a specific floor plan
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; planId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        console.log('📐 Fetching floor plan:', planId)

        // Fetch floor plan with objects
        const floorPlan = await (prisma as any).floorPlan?.findUnique({
            where: { id: planId },
            include: {
                objects: true,
                event: {
                    select: {
                        id: true,
                        name: true,
                        expectedAttendees: true
                    }
                }
            }
        })

        if (!floorPlan) {
            return NextResponse.json({ message: 'Floor plan not found' }, { status: 404 })
        }

        console.log('✅ Floor plan found:', floorPlan.name)

        return NextResponse.json({ floorPlan })
    } catch (error: any) {
        console.error('❌ Error fetching floor plan:', error)
        return NextResponse.json({
            message: 'Failed to load floor plan',
            error: error.message
        }, { status: 500 })
    }
}

// PUT - Update a floor plan
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string; planId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        const body = await req.json()

        console.log('📐 Updating floor plan:', planId)

        // Check if floor plan exists
        const existing = await (prisma as any).floorPlan?.findUnique({
            where: { id: planId }
        })

        if (!existing) {
            return NextResponse.json({ message: 'Floor plan not found' }, { status: 404 })
        }

        // Update floor plan
        const floorPlan = await (prisma as any).floorPlan.update({
            where: { id: planId },
            data: {
                name: body.name !== undefined ? body.name : existing.name,
                description: body.description !== undefined ? body.description : existing.description,
                canvasWidth: body.canvasWidth !== undefined ? body.canvasWidth : existing.canvasWidth,
                canvasHeight: body.canvasHeight !== undefined ? body.canvasHeight : existing.canvasHeight,
                backgroundColor: body.backgroundColor !== undefined ? body.backgroundColor : existing.backgroundColor,
                gridSize: body.gridSize !== undefined ? body.gridSize : existing.gridSize,
                vipPrice: body.vipPrice !== undefined ? body.vipPrice : existing.vipPrice,
                premiumPrice: body.premiumPrice !== undefined ? body.premiumPrice : existing.premiumPrice,
                generalPrice: body.generalPrice !== undefined ? body.generalPrice : existing.generalPrice,
                totalCapacity: body.totalCapacity !== undefined ? body.totalCapacity : existing.totalCapacity,
                vipCapacity: body.vipCapacity !== undefined ? body.vipCapacity : existing.vipCapacity,
                premiumCapacity: body.premiumCapacity !== undefined ? body.premiumCapacity : existing.premiumCapacity,
                generalCapacity: body.generalCapacity !== undefined ? body.generalCapacity : existing.generalCapacity,
                menCapacity: body.menCapacity !== undefined ? body.menCapacity : existing.menCapacity,
                womenCapacity: body.womenCapacity !== undefined ? body.womenCapacity : existing.womenCapacity,
                layoutData: body.layoutData !== undefined ? body.layoutData : existing.layoutData,
                status: body.status !== undefined ? body.status : existing.status,
                version: existing.version + 1
            }
        })

        console.log('✅ Floor plan updated:', floorPlan.id)

        return NextResponse.json({
            message: 'Floor plan updated successfully',
            floorPlan
        })
    } catch (error: any) {
        console.error('❌ Error updating floor plan:', error)
        return NextResponse.json({
            message: 'Failed to update floor plan',
            error: error.message
        }, { status: 500 })
    }
}

// DELETE - Delete a floor plan
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; planId: string } }
) {
    try {
        const session = await getServerSession(authOptions as any)
        if (!session) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { planId } = params
        console.log('📐 Deleting floor plan:', planId)

        // Check if floor plan exists
        const existing = await (prisma as any).floorPlan?.findUnique({
            where: { id: planId }
        })

        if (!existing) {
            return NextResponse.json({ message: 'Floor plan not found' }, { status: 404 })
        }

        // Delete floor plan (cascade will delete objects)
        await (prisma as any).floorPlan.delete({
            where: { id: planId }
        })

        console.log('✅ Floor plan deleted:', planId)

        return NextResponse.json({
            message: 'Floor plan deleted successfully'
        })
    } catch (error: any) {
        console.error('❌ Error deleting floor plan:', error)
        return NextResponse.json({
            message: 'Failed to delete floor plan',
            error: error.message
        }, { status: 500 })
    }
}
