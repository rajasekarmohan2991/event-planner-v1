import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createEvent20InProduction() {
    try {
        console.log('🔍 Checking if Event 20 already exists...')

        const existing = await prisma.event.findUnique({
            where: { id: BigInt(20) }
        })

        if (existing) {
            console.log('✅ Event 20 already exists!')
            console.log('   Name:', existing.name)
            console.log('   ID:', existing.id.toString())
            return
        }

        console.log('📝 Creating Event 20 in production database...')

        // Get a tenant ID (use the first available tenant or create one)
        let tenant = await prisma.tenant.findFirst()

        if (!tenant) {
            console.log('📝 Creating a default tenant first...')
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Organization',
                    slug: 'default-org',
                    domain: 'default.com'
                }
            })
        }

        const event = await prisma.event.create({
            data: {
                id: BigInt(20),
                name: 'Test Event 20',
                slug: 'test-event-20',
                description: 'Test event for production testing',
                tenantId: tenant.id,
                venue: 'Test Venue',
                capacity: 100,
                status: 'PUBLISHED',
                visibility: 'PUBLIC',
                startsAt: new Date('2025-12-31T18:00:00Z'),
                endsAt: new Date('2025-12-31T23:00:00Z'),
                timezone: 'Asia/Kolkata',
                currency: 'INR'
            }
        })

        console.log('✅ Event 20 created successfully!')
        console.log('   ID:', event.id.toString())
        console.log('   Name:', event.name)
        console.log('   Tenant ID:', event.tenantId)
        console.log('\n🎉 You can now use Event 20 in production!')

    } catch (error: any) {
        console.error('❌ Error:', error.message)
        if (error.code === 'P2002') {
            console.log('   Event 20 already exists (unique constraint)')
        }
    } finally {
        await prisma.$disconnect()
    }
}

createEvent20InProduction()
