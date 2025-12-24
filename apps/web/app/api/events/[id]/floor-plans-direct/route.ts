import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const eventId = BigInt(params.id)

        const plans = await prisma.floorPlan.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        })

        const serialized = plans.map(p => {
            // Extract objects from layoutData if it exists
            const layoutData = p.layoutData as any
            const objects = layoutData?.objects || []

            return {
                id: p.id,
                name: p.name,
                eventId: p.eventId.toString(),
                createdAt: p.createdAt.toISOString(),
                status: p.status,
                totalCapacity: p.totalCapacity,
                vipCapacity: p.vipCapacity,
                premiumCapacity: p.premiumCapacity,
                generalCapacity: p.generalCapacity,
                canvasWidth: p.canvasWidth,
                canvasHeight: p.canvasHeight,
                backgroundColor: p.backgroundColor,
                gridSize: p.gridSize,
                vipPrice: Number(p.vipPrice),
                premiumPrice: Number(p.premiumPrice),
                generalPrice: Number(p.generalPrice),
                objects: objects, // Include the layout objects
                layoutData: p.layoutData
            }
        })

        return NextResponse.json({
            success: true,
            count: serialized.length,
            floorPlans: serialized
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
