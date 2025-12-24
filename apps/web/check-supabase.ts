import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSupabase() {
    try {
        console.log('🔍 Testing connection to Supabase...\n')

        await prisma.$connect()
        console.log('✅ Connected to database successfully!\n')

        // Check Event 20
        console.log('🔍 Checking for Event 20...')
        const event = await prisma.event.findUnique({
            where: { id: BigInt(20) },
            select: { id: true, name: true, slug: true, status: true, tenantId: true }
        })

        if (event) {
            console.log('✅ Event 20 EXISTS in Supabase!')
            console.log('   ID:', event.id.toString())
            console.log('   Name:', event.name)
            console.log('   Slug:', event.slug)
            console.log('   Status:', event.status)
            console.log('   Tenant ID:', event.tenantId)
        } else {
            console.log('❌ Event 20 does NOT exist in Supabase')
            console.log('   Creating it now...\n')
            await createEvent20()
            return
        }

        // Check all events
        console.log('\n🔍 Checking all events in Supabase...')
        const allEvents = await prisma.event.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { id: 'asc' },
            take: 10
        })

        console.log(`✅ Found ${allEvents.length} event(s):`)
        allEvents.forEach(e => {
            console.log(`   - Event ${e.id}: ${e.name} (${e.slug})`)
        })

        // Check registrations
        console.log('\n🔍 Checking registrations for Event 20...')
        const regs = await prisma.registration.count({
            where: { eventId: BigInt(20) }
        })
        console.log(`   Found ${regs} registration(s) for Event 20`)

        console.log('\n✅ All checks complete!')
        console.log('\n📍 You can now test:')
        console.log('   • Production: https://aypheneventplanner.vercel.app/events/20/register')
        console.log('   • Local: http://localhost:3001/events/20/register')
        console.log('   Both will use the SAME Supabase database!')

    } catch (error: any) {
        console.error('\n❌ Error:', error.message)
        if (error.message.includes('connect')) {
            console.log('\n💡 Connection failed!')
            console.log('   Check your DATABASE_URL in .env points to Supabase')
        }
    } finally {
        await prisma.$disconnect()
    }
}

async function createEvent20() {
    try {
        // Get or create tenant
        let tenant = await prisma.tenant.findFirst()

        if (!tenant) {
            console.log('📝 Creating default tenant...')
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Organization',
                    slug: 'default-org',
                    domain: 'default.com'
                }
            })
        }

        console.log('📝 Creating Event 20 in Supabase...')
        const event = await prisma.event.create({
            data: {
                id: BigInt(20),
                name: 'Test Event 20',
                slug: 'test-event-20',
                description: 'Test event for production - created automatically',
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

        console.log('\n✅ Event 20 created successfully!')
        console.log('   ID:', event.id.toString())
        console.log('   Name:', event.name)
        console.log('\n🎉 You can now test in production and locally!')

    } catch (error: any) {
        console.error('❌ Error creating Event 20:', error.message)
        if (error.code === 'P2002') {
            console.log('   Event 20 already exists!')
        }
    }
}

checkSupabase()
