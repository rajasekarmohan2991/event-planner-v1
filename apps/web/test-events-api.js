// Test script to check events API
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'postgresql://postgres.zaglxgicnpnlquxqvqu:Limca%400852@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres'
        }
    }
})

async function testEventsQuery() {
    console.log('🔍 Testing events query...\n')

    try {
        // 1. Count total events
        const totalEvents = await prisma.event.count()
        console.log(`✅ Total events in database: ${totalEvents}`)

        // 2. Get all events (no filter)
        const allEvents = await prisma.event.findMany({
            select: {
                id: true,
                name: true,
                status: true,
                tenantId: true,
            },
            take: 20
        })

        console.log(`\n📋 Events found:`)
        allEvents.forEach((event, i) => {
            console.log(`  ${i + 1}. ${event.name} (Status: ${event.status}, Tenant: ${event.tenantId})`)
        })

        // 3. Check what the API WHERE clause would be for SUPER_ADMIN
        console.log(`\n🔑 For SUPER_ADMIN, WHERE clause should be: {}`)
        console.log(`   (empty = show all events)`)

        const superAdminEvents = await prisma.event.findMany({
            where: {}, // Empty WHERE = all events
            select: {
                id: true,
                name: true,
                status: true,
            },
            take: 20
        })

        console.log(`\n✅ SUPER_ADMIN should see: ${superAdminEvents.length} events`)

    } catch (error) {
        console.error('❌ Error:', error.message)
    } finally {
        await prisma.$disconnect()
    }
}

testEventsQuery()
