import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function seedLookups() {
  console.log('Seeding lookup values...')
  
  // Event Types
  const eventTypes = [
    { code: 'CONFERENCE', label: 'Conference', colorCode: '#3498db', sortOrder: 1 },
    { code: 'WORKSHOP', label: 'Workshop', colorCode: '#3498db', sortOrder: 2 },
    { code: 'MEETUP', label: 'Meetup', colorCode: '#3498db', sortOrder: 3 },
    { code: 'WEBINAR', label: 'Webinar', colorCode: '#3498db', sortOrder: 4 },
    { code: 'EXHIBITION', label: 'Exhibition', colorCode: '#3498db', sortOrder: 5 },
    { code: 'CONCERT', label: 'Concert', colorCode: '#3498db', sortOrder: 6 },
    { code: 'FESTIVAL', label: 'Festival', colorCode: '#3498db', sortOrder: 7 },
    { code: 'OTHER', label: 'Other', colorCode: '#95a5a6', sortOrder: 99 },
  ]
  
  for (const type of eventTypes) {
    await prisma.lookup.upsert({
      where: { category_code: { category: 'EVENT_TYPE', code: type.code } },
      update: {},
      create: {
        category: 'EVENT_TYPE',
        ...type,
        isSystem: true,
      }
    })
  }
  
  // Event Categories
  const categories = [
    { code: 'BUSINESS', label: 'Business', colorCode: '#2ecc71', sortOrder: 1 },
    { code: 'TECHNOLOGY', label: 'Technology', colorCode: '#2ecc71', sortOrder: 2 },
    { code: 'ART', label: 'Art', colorCode: '#2ecc71', sortOrder: 3 },
    { code: 'MUSIC', label: 'Music', colorCode: '#2ecc71', sortOrder: 4 },
    { code: 'FOOD', label: 'Food', colorCode: '#2ecc71', sortOrder: 5 },
    { code: 'SPORTS', label: 'Sports', colorCode: '#2ecc71', sortOrder: 6 },
    { code: 'HEALTH', label: 'Health', colorCode: '#2ecc71', sortOrder: 7 },
    { code: 'EDUCATION', label: 'Education', colorCode: '#2ecc71', sortOrder: 8 },
    { code: 'OTHER', label: 'Other', colorCode: '#95a5a6', sortOrder: 99 },
  ]
  
  for (const category of categories) {
    await prisma.lookup.upsert({
      where: { category_code: { category: 'EVENT_CATEGORY', code: category.code } },
      update: {},
      create: {
        category: 'EVENT_CATEGORY',
        ...category,
        isSystem: true,
      }
    })
  }
  
  // Event Modes
  const eventModes = [
    { code: 'IN_PERSON', label: 'In Person', colorCode: '#3498db', sortOrder: 1 },
    { code: 'VIRTUAL', label: 'Virtual', colorCode: '#9b59b6', sortOrder: 2 },
    { code: 'HYBRID', label: 'Hybrid', colorCode: '#e67e22', sortOrder: 3 },
  ]
  
  for (const mode of eventModes) {
    await prisma.lookup.upsert({
      where: { category_code: { category: 'EVENT_MODE', code: mode.code } },
      update: {},
      create: {
        category: 'EVENT_MODE',
        ...mode,
        isSystem: true,
      }
    })
  }
  
  // Timezones
  const timezones = [
    { code: 'UTC', label: 'UTC', colorCode: '#f39c12', sortOrder: 1 },
    { code: 'PST', label: 'PST (Pacific)', colorCode: '#f39c12', sortOrder: 2 },
    { code: 'EST', label: 'EST (Eastern)', colorCode: '#f39c12', sortOrder: 3 },
    { code: 'CET', label: 'CET (Central European)', colorCode: '#f39c12', sortOrder: 4 },
    { code: 'IST', label: 'IST (India)', colorCode: '#f39c12', sortOrder: 5 },
    { code: 'JST', label: 'JST (Japan)', colorCode: '#f39c12', sortOrder: 6 },
    { code: 'AEST', label: 'AEST (Australian Eastern)', colorCode: '#f39c12', sortOrder: 7 },
  ]
  
  for (const tz of timezones) {
    await prisma.lookup.upsert({
      where: { category_code: { category: 'TIMEZONE', code: tz.code } },
      update: {},
      create: {
        category: 'TIMEZONE',
        ...tz,
        isSystem: true,
      }
    })
  }
  
  // User Roles
  const userRoles = [
    { code: 'USER', label: 'User', colorCode: '#8b4513', sortOrder: 1 },
    { code: 'ORGANIZER', label: 'Organizer', colorCode: '#8b4513', sortOrder: 2 },
    { code: 'ADMIN', label: 'Admin', colorCode: '#c0392b', sortOrder: 3 },
  ]
  
  for (const role of userRoles) {
    await prisma.lookup.upsert({
      where: { category_code: { category: 'USER_ROLE', code: role.code } },
      update: {},
      create: {
        category: 'USER_ROLE',
        ...role,
        isSystem: true,
      }
    })
  }
  
  console.log('✅ Lookup values seeded successfully')
}

// Run if called directly
if (require.main === module) {
  seedLookups()
    .then(() => {
      console.log('Seed completed')
      process.exit(0)
    })
    .catch((e) => {
      console.error('Seed failed:', e)
      process.exit(1)
    })
    .finally(() => prisma.$disconnect())
}
