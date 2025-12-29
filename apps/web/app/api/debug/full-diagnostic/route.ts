import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    const results: any = {
        timestamp: new Date().toISOString(),
        environment: {
            nodeEnv: process.env.NODE_ENV,
            vercelEnv: process.env.VERCEL_ENV,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            databaseUrlFormat: process.env.DATABASE_URL ? 'SET (hidden)' : 'NOT SET'
        },
        tests: {}
    }

    // Test 1: Database Connection
    try {
        await prisma.$queryRaw`SELECT 1 as test`
        results.tests.connection = { status: 'SUCCESS', message: 'Database connection works' }
    } catch (error: any) {
        results.tests.connection = { status: 'FAILED', error: error.message }
        return NextResponse.json(results, { status: 500 })
    }

    // Test 2: Read Events (this works)
    try {
        const events = await prisma.event.findMany({
            where: { id: BigInt(24) },
            take: 1
        })
        results.tests.readEvents = {
            status: 'SUCCESS',
            found: events.length,
            eventName: events[0]?.name
        }
    } catch (error: any) {
        results.tests.readEvents = { status: 'FAILED', error: error.message }
    }

    // Test 3: Read Floor Plans
    try {
        const floorPlans = await prisma.floorPlan.findMany({
            where: { eventId: BigInt(24) },
            take: 5
        })
        results.tests.readFloorPlans = {
            status: 'SUCCESS',
            count: floorPlans.length,
            ids: floorPlans.map(fp => fp.id)
        }
    } catch (error: any) {
        results.tests.readFloorPlans = { status: 'FAILED', error: error.message }
    }

    // Test 4: Read Registrations
    try {
        const registrations = await prisma.registration.findMany({
            where: { eventId: BigInt(24) },
            take: 5
        })
        results.tests.readRegistrations = {
            status: 'SUCCESS',
            count: registrations.length,
            ids: registrations.map(r => r.id)
        }
    } catch (error: any) {
        results.tests.readRegistrations = { status: 'FAILED', error: error.message }
    }

    // Test 5: Write Floor Plan
    try {
        const testFP = await prisma.floorPlan.create({
            data: {
                eventId: BigInt(24),
                name: `DIAGNOSTIC TEST ${Date.now()}`,
                layoutData: { diagnostic: true },
                canvasWidth: 1200,
                canvasHeight: 800,
                totalCapacity: 1
            }
        })

        // Verify it was saved
        const verify = await prisma.floorPlan.findUnique({
            where: { id: testFP.id }
        })

        results.tests.writeFloorPlan = {
            status: verify ? 'SUCCESS' : 'FAILED',
            created: testFP.id,
            verified: !!verify
        }

        // Clean up
        await prisma.floorPlan.delete({ where: { id: testFP.id } })
    } catch (error: any) {
        results.tests.writeFloorPlan = {
            status: 'FAILED',
            error: error.message,
            code: error.code,
            meta: error.meta
        }
    }

    // Test 6: Write Registration using raw SQL (like the actual API does)
    try {
        const testRegId = `test-${Date.now()}`
        await prisma.$executeRaw`
      INSERT INTO registrations (
        id, event_id, tenant_id, data_json, type, email, created_at, updated_at, status
      ) VALUES (
        ${testRegId},
        ${BigInt(24)},
        ${'default-tenant'},
        ${'{"test": true}'}::jsonb,
        ${'GENERAL'},
        ${'test@example.com'},
        NOW(),
        NOW(),
        ${'APPROVED'}
      )
    `

        // Verify
        const verify = await prisma.registration.findUnique({
            where: { id: testRegId }
        })

        results.tests.writeRegistration = {
            status: verify ? 'SUCCESS' : 'FAILED',
            created: testRegId,
            verified: !!verify
        }

        // Clean up
        if (verify) {
            await prisma.registration.delete({ where: { id: testRegId } })
        }
    } catch (error: any) {
        results.tests.writeRegistration = {
            status: 'FAILED',
            error: error.message,
            code: error.code
        }
    }

    // Test 7: Check table permissions
    try {
        const tableCheck = await prisma.$queryRaw`
      SELECT 
        schemaname, 
        tablename, 
        tableowner
      FROM pg_tables 
      WHERE tablename IN ('events', 'registrations', 'floor_plans')
      ORDER BY tablename
    ` as any[]

        results.tests.tablePermissions = {
            status: 'SUCCESS',
            tables: tableCheck
        }
    } catch (error: any) {
        results.tests.tablePermissions = {
            status: 'FAILED',
            error: error.message
        }
    }

    return NextResponse.json(results)
}
