import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting Demo Data Seeding...')

  // 1. Create Demo Tenant
  console.log('Creating Tenant...')
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-corp' },
    update: {},
    create: {
      slug: 'demo-corp',
      name: 'Demo Corporation',
      subdomain: 'demo',
      status: 'ACTIVE'
    }
  })

  // 2. Create Demo User
  console.log('Creating User...')
  const password = await bcrypt.hash('Password123!', 10)
  const user = await prisma.user.upsert({
    where: { email: 'demo@eventplanner.com' },
    update: { password },
    create: {
      email: 'demo@eventplanner.com',
      name: 'Demo Admin',
      password,
      role: 'ADMIN',
      createdAt: new Date(),
    }
  })

  // 3. Link them
  console.log('Linking User to Tenant...')
  await prisma.tenantMember.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: user.id,
      role: 'OWNER'
    }
  })

  // 4. Create Event
  console.log('Creating Event...')
  const event = await prisma.event.create({
    data: {
      tenantId: tenant.id,
      name: 'Future Tech Summit 2026',
      description: 'The premier conference for AI and Robotics, featuring world-class speakers and hands-on workshops.',
      startsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      endsAt: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000),
      status: 'PUBLISHED',
      venue: 'Moscone Center',
      city: 'San Francisco',
      address: '747 Howard St',
      priceInr: 25000,
      latitude: 37.7843,
      longitude: -122.4007,
      category: 'Conference',
      eventMode: 'HYBRID',
      budgetInr: 5000000,
      expectedAttendees: 5000,
      bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80',

      // Create Speakers
      speakers: {
        create: [
          {
            name: 'Dr. Sarah Connor',
            title: 'Chief Scientist, Skynet',
            bio: 'Leading researcher in autonomous systems and neural networks.',
            photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
            email: 'sarah@skynet.ai',
            tenantId: tenant.id
          },
          {
            name: 'James Bond',
            title: 'Security Consultant',
            bio: 'Expert in cyber-security and high-stakes negotiation.',
            photoUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
            email: 'james@mi6.gov.uk',
            tenantId: tenant.id
          }
        ]
      },

      // Create Sponsors
      sponsors: {
        create: [
          {
            name: 'CyberDyne Systems',
            logo: 'https://ui-avatars.com/api/?name=CyberDyne&background=0D8ABC&color=fff',
            tier: 'Platinum',
            website: 'https://cyberdyne.com',
            description: 'Building a better future.'
          },
          {
            name: 'Acme Corp',
            logo: 'https://ui-avatars.com/api/?name=Acme&background=random',
            tier: 'Gold',
            description: 'Everything you need.'
          }
        ]
      }
    }
  })

  // 5. Promo Codes
  console.log('Creating Promo Codes...')
  await prisma.promoCode.create({
    data: {
      eventId: event.id,
      code: 'DEMO2026',
      type: 'PERCENT',
      amount: 15,
      maxRedemptions: 100,
      description: 'E2E Demo Discount',
      isActive: true
    }
  })

  // 6. User Preferences
  console.log('Setting Preferences...')
  await prisma.userPreference.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      language: 'en',
      preferences: {
        smsNotifications: true,
        theme: 'light',
        timeZone: 'Asia/Kolkata'
      }
    }
  })

  console.log('🎉 Seed completed successfully!')
  console.log('------------------------------------------------')
  console.log('Login URL:    /auth/login')
  console.log('Email:        demo@eventplanner.com')
  console.log('Password:     Password123!')
  console.log('Tenant Slug:  demo-corp')
  console.log('Top Event:    Future Tech Summit 2026')
  console.log('------------------------------------------------')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
