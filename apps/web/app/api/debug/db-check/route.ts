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

        // Check Speaker table
        let speakerCount = -1;
        try {
            speakerCount = await (prisma as any).speaker.count();
        } catch (e) { console.log('Speaker check failed:', e) }

        // Check Vendor table
        let vendorCount = -1;
        try {
            vendorCount = await (prisma as any).eventVendor.count();
        } catch (e) { console.log('Vendor check failed:', e) }

        // Check Team table
        let teamCount = -1;
        try {
            teamCount = await (prisma as any).eventRoleAssignment.count();
        } catch (e) { console.log('Team check failed:', e) }


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
            databaseUrl: maskedUrl.substring(0, 80) + '...',
            diagnostics: {
                speakerCount,
                vendorCount,
                teamCount
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            error: error.message,
            stack: error.stack?.substring(0, 500)
        }, { status: 500 })
    }
}
