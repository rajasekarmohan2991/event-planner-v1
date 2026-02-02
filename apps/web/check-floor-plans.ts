import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const eventId = BigInt(22)
    console.log('🔍 Checking floor plans for event 22...\n')

    try {
        const plans = await prisma.floorPlan.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' }
        })

        console.log(`Found ${plans.length} floor plan(s):\n`)

        plans.forEach((plan, index) => {
            console.log(`Plan ${index + 1}:`)
            console.log(`  ID: ${plan.id}`)
            console.log(`  Name: ${plan.name}`)
            console.log(`  EventId: ${plan.eventId.toString()}`)
            console.log(`  Created: ${plan.createdAt}`)
            console.log(`  Status: ${plan.status}`)
            console.log(`  Total Capacity: ${plan.totalCapacity}`)
            console.log('')
        })

        if (plans.length === 0) {
            console.log('❌ No floor plans found in database!')
            console.log('\nChecking if there are ANY floor plans in the table...')

            const allPlans = await prisma.floorPlan.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            })

            console.log(`\nTotal floor plans in database: ${allPlans.length}`)
            if (allPlans.length > 0) {
                console.log('\nRecent floor plans (any event):')
                allPlans.forEach(p => {
                    console.log(`  - Event ${p.eventId.toString()}: "${p.name}" (ID: ${p.id})`)
                })
            }
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    }

    await prisma.$disconnect()
}

main()
