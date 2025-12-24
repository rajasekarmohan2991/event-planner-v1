import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const eventId = BigInt(22)
    console.log('🔍 Checking registrations for event 22...\n')

    try {
        const registrations = await prisma.registration.findMany({
            where: { eventId },
            orderBy: { createdAt: 'desc' },
            take: 10
        })

        console.log(`Found ${registrations.length} registration(s):\n`)

        registrations.forEach((reg, index) => {
            console.log(`Registration ${index + 1}:`)
            console.log(`  ID: ${reg.id}`)
            console.log(`  Name: ${reg.firstName} ${reg.lastName}`)
            console.log(`  Email: ${reg.email}`)
            console.log(`  Phone: ${reg.phone}`)
            console.log(`  Status: ${reg.status}`)
            console.log(`  Created: ${reg.createdAt}`)
            console.log('')
        })

        if (registrations.length === 0) {
            console.log('❌ No registrations found!')
            console.log('\nChecking if there are ANY registrations in the table...')

            const allRegs = await prisma.registration.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            })

            console.log(`\nTotal registrations in database: ${allRegs.length}`)
            if (allRegs.length > 0) {
                console.log('\nRecent registrations (any event):')
                allRegs.forEach(r => {
                    console.log(`  - Event ${r.eventId.toString()}: ${r.firstName} ${r.lastName} (${r.email})`)
                })
            }
        }

    } catch (e: any) {
        console.error('❌ Error:', e.message)
    }

    await prisma.$disconnect()
}

main()
