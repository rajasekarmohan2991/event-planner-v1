// Simple Event Deletion Test Script
// This bypasses all the complex logic and just tries to delete the event directly

import prisma from '../lib/prisma'

async function testDeleteEvent(eventId: number) {
    console.log(`Testing deletion of event ${eventId}...`)

    try {
        const eventIdBigInt = BigInt(eventId)

        // Try direct deletion
        console.log('Attempting direct deletion...')
        const result = await prisma.$executeRaw`DELETE FROM events WHERE id = ${eventIdBigInt}`

        console.log(`✅ Success! Deleted ${result} event(s)`)
    } catch (error: any) {
        console.error('❌ Error:', error.message)
        console.error('Error code:', error.code)
        console.error('Error meta:', error.meta)

        if (error.code === 'P2003' || error.code === '23503') {
            console.log('\n⚠️ Foreign key constraint violation detected!')
            console.log('The event has related data that must be deleted first.')
            console.log('Related tables might include:')
            console.log('- registrations')
            console.log('- orders')
            console.log('- tickets')
            console.log('- floor_plans')
            console.log('- exhibitors')
            console.log('- etc.')
        }
    }
}

// Run test
testDeleteEvent(16)
