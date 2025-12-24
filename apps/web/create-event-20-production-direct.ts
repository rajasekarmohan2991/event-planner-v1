/**
 * Create Event 20 in Production Database
 * 
 * This script creates Event 20 directly in your production database.
 * 
 * USAGE:
 * 1. Get your production DATABASE_URL from Vercel:
 *    - Go to https://vercel.com/dashboard
 *    - Select your project → Settings → Environment Variables
 *    - Copy the DATABASE_URL value
 * 
 * 2. Run this script:
 *    PROD_DB="your_production_url" npx tsx create-event-20-production-direct.ts
 */

import { PrismaClient } from '@prisma/client'

// Use PROD_DB environment variable if provided, otherwise use default DATABASE_URL
const databaseUrl = process.env.PROD_DB || process.env.DATABASE_URL

if (!databaseUrl) {
    console.error('❌ ERROR: No database URL provided')
    console.log('\nPlease run:')
    console.log('  PROD_DB="your_production_database_url" npx tsx create-event-20-production-direct.ts')
    console.log('\nTo get your production DATABASE_URL:')
    console.log('  1. Go to https://vercel.com/dashboard')
    console.log('  2. Select your project (aypheneventplanner)')
    console.log('  3. Go to Settings → Environment Variables')
    console.log('  4. Find DATABASE_URL and copy its value')
    process.exit(1)
}

console.log('🔗 Connecting to database...')
console.log('   URL:', databaseUrl.substring(0, 30) + '...')

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
})

async function main() {
    try {
        console.log('\n🔍 Checking if Event 20 exists...\n')

        const existing = await prisma.event.findUnique({
            where: { id: BigInt(20) }
        })

        if (existing) {
            console.log('✅ Event 20 ALREADY EXISTS!')
            console.log('   ID:', existing.id.toString())
            console.log('   Name:', existing.name)
            console.log('   Slug:', existing.slug)
            console.log('   Status:', existing.status)
            console.log('\n🎉 You can use Event 20 in production now!')
            return
        }

        console.log('📝 Event 20 not found. Creating it...\n')

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
            console.log('✅ Tenant created:', tenant.id, '\n')
        } else {
            console.log('✅ Using existing tenant:', tenant.id, '\n')
        }

        console.log('📝 Creating Event 20 in production database...')

        const event = await prisma.event.create({
            data: {
                id: BigInt(20),
                name: 'Test Event 20',
                slug: 'test-event-20',
                description: 'Production test event - created automatically',
                tenantId: tenant.id,
                venue: 'Production Test Venue',
                capacity: 100,
                status: 'PUBLISHED',
                visibility: 'PUBLIC',
                startsAt: new Date('2025-12-31T18:00:00Z'),
                endsAt: new Date('2025-12-31T23:00:00Z'),
                timezone: 'Asia/Kolkata',
                currency: 'INR'
            }
        })

        console.log('\n✅ SUCCESS! Event 20 created in PRODUCTION!')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('   ID:', event.id.toString())
        console.log('   Name:', event.name)
        console.log('   Slug:', event.slug)
        console.log('   Venue:', event.venue)
        console.log('   Status:', event.status)
        console.log('   Tenant ID:', event.tenantId)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        console.log('\n🎉 Event 20 is now live in production!')
        console.log('\n📍 Test these URLs:')
        console.log('   • Registrations:')
        console.log('     https://aypheneventplanner.vercel.app/events/20/register')
        console.log('   • Floor Plan:')
        console.log('     https://aypheneventplanner.vercel.app/events/20/design/floor-plan')
        console.log('   • Registration List:')
        console.log('     https://aypheneventplanner.vercel.app/events/20/registrations')
        console.log('   • Communication:')
        console.log('     https://aypheneventplanner.vercel.app/events/20/communicate')
        console.log('\n✅ All features will now work in production!')

    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message)

        if (error.code === 'P2002') {
            console.log('\n💡 Event 20 already exists (unique constraint)')
            console.log('   This is actually good - you can use it now!')
        } else if (error.code === 'P2003') {
            console.log('\n💡 Foreign key error - tenant issue')
            console.log('   Try creating a tenant first')
        } else if (error.message?.includes('connect')) {
            console.log('\n💡 Connection error')
            console.log('   Check your DATABASE_URL is correct')
            console.log('   Make sure it includes all connection parameters')
        } else {
            console.log('\n💡 Full error details:')
            console.log(error)
        }
    } finally {
        await prisma.$disconnect()
        console.log('\n🔌 Disconnected from database')
    }
}

main()
