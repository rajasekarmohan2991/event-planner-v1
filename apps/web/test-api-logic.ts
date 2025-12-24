import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const eventId = BigInt(22)
    console.log('🧪 Testing GET /api/events/22/design/floor-plan logic...\n')

    try {
        // Simulate what the API does
        const floorPlans = await prisma.floorPlan.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                eventId: true,
                name: true,
                description: true,
                layoutData: true,
                createdAt: true,
                updatedAt: true,
                vipCapacity: true,
                premiumCapacity: true,
                generalCapacity: true,
                totalCapacity: true
            }
        })

        // Serialize BigInt fields
        const serialized = floorPlans.map(fp => ({
            id: fp.id,
            eventId: fp.eventId.toString(),
            name: fp.name,
            createdAt: fp.createdAt,
            config: {
                guestCount: fp.totalCapacity,
                vipSeats: fp.vipCapacity,
                premiumSeats: fp.premiumCapacity,
                generalSeats: fp.generalCapacity
            }
        }))

        console.log('✅ API would return:')
        console.log(JSON.stringify(serialized, null, 2))

        console.log(`\n✅ Array.isArray check: ${Array.isArray(serialized)}`)
        console.log(`✅ Length: ${serialized.length}`)

    } catch (e: any) {
        console.error('❌ Error:', e.message)
        console.error(e.stack)
    }

    await prisma.$disconnect()
}

main()
