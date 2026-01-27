
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Debugging Analytics ---')

    // 1. Check Events
    const eventsCount = await prisma.event.count()
    console.log(`Total Events: ${eventsCount}`)

    // 2. Check Registrations Count Total
    const regsCount = await prisma.registration.count()
    console.log(`Total Registrations (Raw): ${regsCount}`)

    // 3. Check Registration Status Distribution
    const regsByStatus: any = await prisma.$queryRaw`
    SELECT status, COUNT(*) as count, SUM(price_inr) as sum_price 
    FROM registrations 
    GROUP BY status
  `
    console.log('Registrations by Status:', regsByStatus)

    // 4. Check Events Tenant Distribution (to verify super admin assumption)
    const eventsByTenant: any = await prisma.event.groupBy({
        by: ['tenantId'],
        _count: { id: true }
    })
    console.log('Events by Tenant:', eventsByTenant)

    // 5. Test the EXACT query used in the API
    const isSuperAdmin = true // Simulating the failing case
    try {
        const result: any = await prisma.$queryRaw`
        SELECT 
            COUNT(*)::int as count, 
            COALESCE(SUM(price_inr), 0)::int as revenue 
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
        AND r.status IN ('APPROVED', 'CONFIRMED', 'SUCCESS')
    `
        console.log('API Query Result (Super Admin):', result)
    } catch (e: any) {
        console.error('API Query Failed:', e.message)
    }

    // 6. Test with just 'APPROVED' (The valid enum)
    try {
        const result2: any = await prisma.$queryRaw`
        SELECT 
            COUNT(*)::int as count, 
            COALESCE(SUM(price_inr), 0)::int as revenue 
        FROM registrations r
        JOIN events e ON r.event_id = e.id
        WHERE 1=1
        AND r.status = 'APPROVED'
    `
        console.log("Query with strictly 'APPROVED':", result2)
    } catch (e) {
        console.error(e)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })
