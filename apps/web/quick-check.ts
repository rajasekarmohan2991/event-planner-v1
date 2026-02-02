import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function quickCheck() {
    console.log('🔍 Quick Supabase Connection Test\n')

    try {
        // Simple query with timeout
        const result = await Promise.race([
            prisma.$queryRaw`SELECT 1 as test`,
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ])

        console.log('✅ Connected to Supabase successfully!')
        console.log('   Database is responding\n')

        // Quick event count
        const eventCount = await prisma.event.count()
        console.log(`📊 Total events in database: ${eventCount}`)

        // Check Event 20
        const event20 = await prisma.event.findUnique({
            where: { id: BigInt(20) },
            select: { id: true, name: true }
        })

        if (event20) {
            console.log(`✅ Event 20 exists: ${event20.name}`)
        } else {
            console.log('❌ Event 20 does not exist')
        }

        console.log('\n🎉 Supabase is connected and working!')
        console.log('   You can now test registrations in production')

    } catch (error: any) {
        console.error('❌ Connection failed:', error.message)
        console.log('\n💡 Troubleshooting:')
        console.log('   1. Check your DATABASE_URL in .env')
        console.log('   2. Make sure it points to Supabase (not localhost)')
        console.log('   3. Verify the password is correct')
        console.log('   4. Check your internet connection')
    } finally {
        await prisma.$disconnect()
    }
}

quickCheck()
