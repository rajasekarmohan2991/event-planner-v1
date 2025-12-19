import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        // 1. Count all events using Prisma
        const totalEvents = await prisma.event.count()

        // 2. Get first 10 events with minimal fields
        const sampleEvents = await prisma.event.findMany({
            take: 10,
            select: {
                id: true,
                name: true,
                tenantId: true,
                status: true
            }
        })

        // 3. Check tenants
        const tenants = await prisma.tenant.findMany({
            take: 10,
            select: { id: true, name: true, slug: true }
        })

        // 4. Count users
        const totalUsers = await prisma.user.count()

        // 5. Try raw SQL to check events table directly
        let rawEventCount = 0
        try {
            const result = await prisma.$queryRaw`SELECT COUNT(*) as count FROM events` as any[]
            rawEventCount = Number(result[0]?.count || 0)
        } catch (e: any) {
            console.log('Raw SQL failed:', e.message)
        }

        // 6. Check database URL (masked)
        const dbUrl = process.env.DATABASE_URL || 'NOT SET'
        const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')

        return NextResponse.json({
            message: 'Database Diagnostic',
            prismaEventCount: totalEvents,
            rawSqlEventCount: rawEventCount,
            sampleEvents,
            tenantCount: tenants.length,
            tenants,
            userCount: totalUsers,
            databaseUrl: maskedUrl.substring(0, 80) + '...'
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.substring(0, 500)
        }, { status: 500 })
    }
}
