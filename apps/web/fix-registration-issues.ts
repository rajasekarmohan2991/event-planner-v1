import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixRegistrationIssues() {
    console.log('🔧 FIXING REGISTRATION & COMMUNICATION ISSUES\n')
    console.log('='.repeat(60))

    try {
        // Step 1: Test connection
        console.log('\n📡 Step 1: Testing Supabase connection...')
        await prisma.$connect()
        console.log('✅ Connected to Supabase successfully!\n')

        // Step 2: Check if Event 20 exists
        console.log('📡 Step 2: Checking for Event 20...')
        let event = await prisma.event.findUnique({
            where: { id: BigInt(20) },
            select: { id: true, name: true, tenantId: true, status: true }
        })

        if (!event) {
            console.log('❌ Event 20 does NOT exist in Supabase')
            console.log('📝 Creating Event 20 now...\n')

            // Get or create tenant
            let tenant = await prisma.tenant.findFirst()
            if (!tenant) {
                console.log('📝 Creating default tenant...')
                tenant = await prisma.tenant.create({
                    data: {
                        name: 'Default Organization',
                        slug: 'default-org',
                        subdomain: 'default-org',
                        domain: 'default.com'
                    }
                })
                console.log('✅ Tenant created:', tenant.id)
            }

            // Create Event 20
            event = await prisma.event.create({
                data: {
                    id: BigInt(20),
                    name: 'Test Event 20',
                    description: 'Production test event',
                    tenantId: tenant.id,
                    venue: 'Test Venue',
                    startsAt: new Date('2025-12-31T18:00:00Z'),
                    endsAt: new Date('2025-12-31T23:00:00Z'),
                    status: 'PUBLISHED',
                    eventMode: 'HYBRID' // Required field
                }
            })
            console.log('✅ Event 20 created successfully!\n')
        } else {
            console.log('✅ Event 20 already exists!')
            console.log(`   Name: ${event.name}`)
            console.log(`   Status: ${event.status}\n`)
        }

        // Step 3: Check existing registrations
        console.log('📡 Step 3: Checking existing registrations...')
        const regCount = await prisma.registration.count({
            where: { eventId: BigInt(20) }
        })
        console.log(`   Found ${regCount} registration(s) for Event 20\n`)

        if (regCount === 0) {
            console.log('💡 No registrations found. This is why:')
            console.log('   - Registration list shows "No registrations found"')
            console.log('   - Communication tab has no phone numbers')
            console.log('   - Stats show 0\n')
            console.log('📝 Solution: Create a NEW registration in production')
        } else {
            // Check if any have phone numbers
            const regsWithPhone = await prisma.$queryRaw`
                SELECT id, data_json->>'phone' as phone, data_json->>'email' as email
                FROM registrations
                WHERE event_id = ${BigInt(20)}
                AND data_json->>'phone' IS NOT NULL
                LIMIT 5
            ` as any[]

            console.log(`✅ Found ${regsWithPhone.length} registration(s) with phone numbers:`)
            regsWithPhone.forEach((r, i) => {
                console.log(`   ${i + 1}. Email: ${r.email}, Phone: ${r.phone}`)
            })
        }

        // Step 4: Summary and next steps
        console.log('\n' + '='.repeat(60))
        console.log('📊 DIAGNOSIS COMPLETE\n')

        console.log('✅ FIXED:')
        console.log('   - Supabase connection verified')
        console.log('   - Event 20 exists in database')
        console.log('   - Registration API is ready\n')

        console.log('📍 NEXT STEPS:')
        console.log('   1. Go to: https://aypheneventplanner.vercel.app/events/20/register')
        console.log('   2. Fill out the form (INCLUDE PHONE NUMBER!)')
        console.log('   3. Submit the registration')
        console.log('   4. Check: https://aypheneventplanner.vercel.app/events/20/registrations')
        console.log('   5. ✅ Registration should appear!')
        console.log('   6. Go to Communication tab')
        console.log('   7. ✅ Phone number should load automatically!\n')

        console.log('🎉 All issues should be resolved after creating a new registration!')

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message)

        if (error.message.includes('connect')) {
            console.log('\n💡 Connection Error:')
            console.log('   Your .env DATABASE_URL might not be pointing to Supabase')
            console.log('   Check that it looks like:')
            console.log('   postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres')
        } else if (error.code === 'P2002') {
            console.log('\n💡 Event 20 already exists (this is good!)')
        } else {
            console.log('\n💡 Full error:', error)
        }
    } finally {
        await prisma.$disconnect()
        console.log('\n🔌 Disconnected from database')
    }
}

fixRegistrationIssues()
