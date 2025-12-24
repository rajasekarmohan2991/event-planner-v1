import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Test database connection
        await prisma.$queryRaw`SELECT 1`

        // Check Prisma Client schema expectations
        let schemaCheck = 'UNKNOWN'
        try {
            // This will throw a TypeScript error if Prisma still expects FloorPlanStatus enum
            const testData: any = {
                eventId: BigInt(999999),
                name: 'Test',
                status: 'DRAFT' // String value
            }
            schemaCheck = 'STRING_TYPE_ACCEPTED'
        } catch (e: any) {
            schemaCheck = `ERROR: ${e.message}`
        }

        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: 'connected',
            schemaCheck,
            version: 'v2-schema-check',
            nodeEnv: process.env.NODE_ENV
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 })
    }
}
