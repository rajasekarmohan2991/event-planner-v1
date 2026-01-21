
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function checkEvent(eventId: number) {
    console.log(`\n🔍 Checking Event ID: ${eventId}`)

    // 1. Check Event Existence & Price
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) {
        console.error('❌ Event not found!')
        return
    }
    console.log('✅ Event Found:', event.name)
    console.log('💰 Price (INR):', event.priceInr)
    console.log('   (If price is 0, payment will be skipped)')

    // 2. Check Floor Plan (Config)
    const configs = await prisma.$queryRaw<any[]>`
    SELECT id, plan_name, total_seats FROM floor_plan_configs WHERE event_id = ${eventId}::bigint
  `

    // 3. Check Floor Plan (Legacy)
    const legacy = await prisma.floorPlan.findFirst({ where: { eventId } })

    if (configs.length > 0) {
        console.log('✅ Floor Plan (Config) Found:', configs[0])
    } else if (legacy) {
        console.log('✅ Floor Plan (Legacy) Found:', legacy.id)
    } else {
        console.error('❌ NO FLOOR PLAN FOUND for this event.')
        console.log('   (This explains why Seat Selector is skipped)')
    }

    // 4. Check Seat Inventory
    const seats = await prisma.seatInventory.count({ where: { eventId: BigInt(eventId) } })
    console.log('💺 Total Seats Generated:', seats)

    if (seats === 0 && (configs.length > 0 || legacy)) {
        console.log('⚠️ Floor plan exists but 0 seats generated. System should auto-generate or redirect to seat selector.')
    }
}

const args = process.argv.slice(2)
if (args.length === 0) {
    console.log('Usage: npx tsx apps/web/debug-event-status.ts <eventId>')
} else {
    checkEvent(parseInt(args[0])).catch(console.error).finally(() => prisma.$disconnect())
}
