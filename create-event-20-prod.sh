#!/bin/bash

echo "🚀 Creating Event 20 in PRODUCTION Database"
echo "=============================================="
echo ""
echo "⚠️  IMPORTANT: This will create Event 20 in your PRODUCTION database on Vercel"
echo ""
echo "Before running this script, you need to:"
echo "1. Get your PRODUCTION database URL from Vercel"
echo "2. Set it as an environment variable"
echo ""
echo "To get your production DATABASE_URL:"
echo "  1. Go to https://vercel.com/dashboard"
echo "  2. Select your project (aypheneventplanner)"
echo "  3. Go to Settings → Environment Variables"
echo "  4. Find DATABASE_URL and copy its value"
echo ""
echo "Then run this script with:"
echo "  PROD_DATABASE_URL='your_production_url' ./create-event-20-prod.sh"
echo ""

if [ -z "$PROD_DATABASE_URL" ]; then
    echo "❌ ERROR: PROD_DATABASE_URL is not set"
    echo ""
    echo "Please run:"
    echo "  PROD_DATABASE_URL='your_production_database_url' ./create-event-20-prod.sh"
    echo ""
    exit 1
fi

echo "✅ Production DATABASE_URL is set"
echo ""
echo "Creating Event 20..."
echo ""

# Run the Node.js script with production database URL
DATABASE_URL="$PROD_DATABASE_URL" npx tsx << 'EOF'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createEvent20() {
    try {
        console.log('🔍 Checking if Event 20 exists in PRODUCTION...\n')
        
        const existing = await prisma.event.findUnique({
            where: { id: BigInt(20) }
        })
        
        if (existing) {
            console.log('✅ Event 20 already exists in production!')
            console.log('   Name:', existing.name)
            console.log('   ID:', existing.id.toString())
            console.log('\n🎉 You can now use Event 20 in production!')
            await prisma.$disconnect()
            return
        }
        
        console.log('📝 Event 20 not found. Creating it now...\n')
        
        // Get or create a tenant
        let tenant = await prisma.tenant.findFirst()
        
        if (!tenant) {
            console.log('📝 No tenant found. Creating default tenant...')
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Organization',
                    slug: 'default-org',
                    domain: 'default.com'
                }
            })
            console.log('✅ Tenant created:', tenant.id)
        } else {
            console.log('✅ Using existing tenant:', tenant.id)
        }
        
        console.log('\n📝 Creating Event 20...')
        
        const event = await prisma.event.create({
            data: {
                id: BigInt(20),
                name: 'Test Event 20',
                slug: 'test-event-20',
                description: 'Test event for production testing - created automatically',
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
        
        console.log('\n✅ SUCCESS! Event 20 created in PRODUCTION database!')
        console.log('   ID:', event.id.toString())
        console.log('   Name:', event.name)
        console.log('   Slug:', event.slug)
        console.log('   Tenant ID:', event.tenantId)
        console.log('   Venue:', event.venue)
        console.log('   Status:', event.status)
        console.log('\n🎉 You can now test in production:')
        console.log('   - Registrations: https://aypheneventplanner.vercel.app/events/20/register')
        console.log('   - Floor Plan: https://aypheneventplanner.vercel.app/events/20/design/floor-plan')
        console.log('   - Registration List: https://aypheneventplanner.vercel.app/events/20/registrations')
        console.log('   - Communication: https://aypheneventplanner.vercel.app/events/20/communicate')
        
    } catch (error: any) {
        console.error('\n❌ ERROR:', error.message)
        if (error.code === 'P2002') {
            console.log('   Event 20 already exists (unique constraint violation)')
        } else if (error.code === 'P2003') {
            console.log('   Foreign key constraint error - check tenant_id')
        } else {
            console.log('   Full error:', error)
        }
    } finally {
        await prisma.$disconnect()
    }
}

createEvent20()
EOF

echo ""
echo "✅ Script completed!"
