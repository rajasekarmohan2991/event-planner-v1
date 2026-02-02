import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Check registrations for event 24
        const registrations = await prisma.registration.findMany({
            where: { eventId: BigInt(24) },
            select: {
                id: true,
                email: true,
                createdAt: true,
                status: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Check floor plans for event 24
        const floorPlans = await prisma.floorPlan.findMany({
            where: { eventId: BigInt(24) },
            select: {
                id: true,
                name: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        // Check database connection info
        const dbInfo = {
            databaseUrl: process.env.DATABASE_URL ? 'SET (hidden for security)' : 'NOT SET',
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV
        }

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            database: dbInfo,
            event24: {
                registrations: {
                    count: registrations.length,
                    items: registrations.map(r => ({
                        id: r.id,
                        email: r.email,
                        createdAt: r.createdAt,
                        status: r.status
                    }))
                },
                floorPlans: {
                    count: floorPlans.length,
                    items: floorPlans.map(fp => ({
                        id: fp.id,
                        name: fp.name,
                        createdAt: fp.createdAt
                    }))
                }
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
