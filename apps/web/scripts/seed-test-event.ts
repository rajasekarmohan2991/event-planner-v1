import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTestEvent() {
  try {
    console.log('🌱 Starting database seed...')

    // First, ensure we have a tenant
    let tenant = await prisma.tenant.findFirst()
    
    if (!tenant) {
      console.log('📦 Creating test tenant...')
      tenant = await prisma.tenant.create({
        data: {
          id: 'test-tenant-001',
          name: 'Test Event Organizer',
          email: 'organizer@test.com',
          plan: 'ENTERPRISE',
          maxEvents: 1000000,
          maxUsers: 1000000,
          maxStorageMb: 1000000,
        }
      })
      console.log('✅ Tenant created:', tenant.name)
    } else {
      console.log('✅ Using existing tenant:', tenant.name)
    }

    // Check if we already have events
    const existingEvents = await prisma.event.count()
    console.log(`📊 Current events in database: ${existingEvents}`)

    if (existingEvents === 0) {
      console.log('📝 Creating test events...')

      // Create multiple test events
      const events = [
        {
          name: 'Tech Conference 2025',
          description: 'Annual technology conference featuring the latest innovations in AI, Cloud Computing, and Web Development',
          startsAt: new Date('2025-03-15T09:00:00'),
          endsAt: new Date('2025-03-15T18:00:00'),
          status: 'PUBLISHED',
          venue: 'Chennai Convention Center',
          address: '123 Tech Park, Anna Salai',
          city: 'Chennai',
          latitude: 13.0827,
          longitude: 80.2707,
          priceInr: 2500,
          category: 'TECHNOLOGY',
          eventMode: 'IN_PERSON',
          expectedAttendees: 500,
          bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
          tenantId: tenant.id,
        },
        {
          name: 'Music Festival - Summer Vibes',
          description: 'Outdoor music festival featuring top artists from across India',
          startsAt: new Date('2025-04-20T16:00:00'),
          endsAt: new Date('2025-04-20T23:00:00'),
          status: 'PUBLISHED',
          venue: 'Marina Beach Amphitheater',
          address: 'Marina Beach Road',
          city: 'Chennai',
          latitude: 13.0499,
          longitude: 80.2824,
          priceInr: 1500,
          category: 'MUSIC',
          eventMode: 'IN_PERSON',
          expectedAttendees: 2000,
          bannerUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
          tenantId: tenant.id,
        },
        {
          name: 'Startup Networking Meetup',
          description: 'Connect with fellow entrepreneurs, investors, and startup enthusiasts',
          startsAt: new Date('2025-02-28T18:00:00'),
          endsAt: new Date('2025-02-28T21:00:00'),
          status: 'PUBLISHED',
          venue: 'T-Hub Innovation Center',
          address: 'Hitech City',
          city: 'Hyderabad',
          latitude: 17.4485,
          longitude: 78.3908,
          priceInr: 500,
          category: 'BUSINESS',
          eventMode: 'HYBRID',
          expectedAttendees: 150,
          bannerUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800',
          tenantId: tenant.id,
        },
        {
          name: 'Food & Wine Festival',
          description: 'Culinary experience featuring celebrity chefs and wine tasting',
          startsAt: new Date('2025-05-10T12:00:00'),
          endsAt: new Date('2025-05-10T22:00:00'),
          status: 'PUBLISHED',
          venue: 'Taj Hotel Grand Ballroom',
          address: 'Colaba',
          city: 'Mumbai',
          latitude: 18.9220,
          longitude: 72.8347,
          priceInr: 3500,
          category: 'FOOD',
          eventMode: 'IN_PERSON',
          expectedAttendees: 300,
          bannerUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
          tenantId: tenant.id,
        },
        {
          name: 'Yoga & Wellness Retreat',
          description: 'Weekend wellness retreat with yoga, meditation, and healthy living workshops',
          startsAt: new Date('2025-03-22T07:00:00'),
          endsAt: new Date('2025-03-24T18:00:00'),
          status: 'PUBLISHED',
          venue: 'Serenity Wellness Resort',
          address: 'Whitefield',
          city: 'Bangalore',
          latitude: 12.9716,
          longitude: 77.5946,
          priceInr: 8500,
          category: 'HEALTH',
          eventMode: 'IN_PERSON',
          expectedAttendees: 80,
          bannerUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800',
          tenantId: tenant.id,
        }
      ]

      for (const eventData of events) {
        const event = await prisma.event.create({
          data: eventData
        })
        console.log(`✅ Created event: ${event.name} (ID: ${event.id})`)
      }

      console.log(`\n🎉 Successfully seeded ${events.length} test events!`)
    } else {
      console.log('⚠️  Events already exist in database. Skipping seed.')
    }

    // Display summary
    const finalCount = await prisma.event.count()
    const publishedCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count FROM events WHERE status = 'PUBLISHED'
    ` as any[]

    console.log('\n📊 Database Summary:')
    console.log(`   Total Events: ${finalCount}`)
    console.log(`   Published Events: ${publishedCount[0]?.count || 0}`)
    console.log(`   Tenant: ${tenant.name}`)
    
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

seedTestEvent()
  .then(() => {
    console.log('\n✅ Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  })
