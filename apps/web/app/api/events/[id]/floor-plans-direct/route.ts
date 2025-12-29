import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const eventId = BigInt(params.id)

        console.log('[FLOOR PLANS] Fetching for eventId:', eventId.toString())

        // Use raw SQL to bypass tenant middleware
        const plans = await prisma.$queryRaw`
            SELECT 
                id, name, "eventId", "createdAt",
                status, "totalCapacity",
                "vipCapacity", "premiumCapacity",
                "generalCapacity", "canvasWidth",
                "canvasHeight", "backgroundColor",
                "gridSize", "vipPrice",
                "premiumPrice", "generalPrice",
                "layoutData"
            FROM floor_plans
            WHERE "eventId" = ${eventId}
            ORDER BY "createdAt" DESC
        ` as any[]

        console.log('[FLOOR PLANS] Found:', plans.length, 'plans')

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
                objects: objects,
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
