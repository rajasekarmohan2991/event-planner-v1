import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedLookups() {
  console.log('🌱 Seeding lookup data...')

  // Define lookup groups and their options
  const lookupData = [
    {
      group: {
        name: 'event_category',
        label: 'Event Category',
        description: 'Categories for events',
      },
      options: [
        { value: 'CONFERENCE', label: 'Conference', sortOrder: 1, isDefault: true },
        { value: 'WORKSHOP', label: 'Workshop', sortOrder: 2 },
        { value: 'SEMINAR', label: 'Seminar', sortOrder: 3 },
        { value: 'WEBINAR', label: 'Webinar', sortOrder: 4 },
        { value: 'MEETUP', label: 'Meetup', sortOrder: 5 },
        { value: 'NETWORKING', label: 'Networking', sortOrder: 6 },
        { value: 'TRAINING', label: 'Training', sortOrder: 7 },
        { value: 'EXHIBITION', label: 'Exhibition', sortOrder: 8 },
        { value: 'CONCERT', label: 'Concert', sortOrder: 9 },
        { value: 'SPORTS', label: 'Sports', sortOrder: 10 },
        { value: 'OTHER', label: 'Other', sortOrder: 11 },
      ],
    },
    {
      group: {
        name: 'event_type',
        label: 'Event Type',
        description: 'Types of events',
      },
      options: [
        { value: 'IN_PERSON', label: 'In-Person', sortOrder: 1, isDefault: true },
        { value: 'VIRTUAL', label: 'Virtual', sortOrder: 2 },
        { value: 'HYBRID', label: 'Hybrid', sortOrder: 3 },
      ],
    },
    {
      group: {
        name: 'ticket_type',
        label: 'Ticket Type',
        description: 'Types of tickets',
      },
      options: [
        { value: 'GENERAL', label: 'General Admission', sortOrder: 1, isDefault: true },
        { value: 'VIP', label: 'VIP', sortOrder: 2 },
        { value: 'PREMIUM', label: 'Premium', sortOrder: 3 },
        { value: 'EARLY_BIRD', label: 'Early Bird', sortOrder: 4 },
        { value: 'STUDENT', label: 'Student', sortOrder: 5 },
        { value: 'GROUP', label: 'Group', sortOrder: 6 },
        { value: 'COMPLIMENTARY', label: 'Complimentary', sortOrder: 7 },
      ],
    },
    {
      group: {
        name: 'registration_status',
        label: 'Registration Status',
        description: 'Status of registrations',
      },
      options: [
        { value: 'PENDING', label: 'Pending', sortOrder: 1, isDefault: true },
        { value: 'CONFIRMED', label: 'Confirmed', sortOrder: 2 },
        { value: 'CANCELLED', label: 'Cancelled', sortOrder: 3 },
        { value: 'WAITLISTED', label: 'Waitlisted', sortOrder: 4 },
        { value: 'CHECKED_IN', label: 'Checked In', sortOrder: 5 },
      ],
    },
    {
      group: {
        name: 'payment_status',
        label: 'Payment Status',
        description: 'Status of payments',
      },
      options: [
        { value: 'PENDING', label: 'Pending', sortOrder: 1, isDefault: true },
        { value: 'COMPLETED', label: 'Completed', sortOrder: 2 },
        { value: 'FAILED', label: 'Failed', sortOrder: 3 },
        { value: 'REFUNDED', label: 'Refunded', sortOrder: 4 },
        { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded', sortOrder: 5 },
      ],
    },
    {
      group: {
        name: 'gender',
        label: 'Gender',
        description: 'Gender options',
      },
      options: [
        { value: 'MALE', label: 'Male', sortOrder: 1 },
        { value: 'FEMALE', label: 'Female', sortOrder: 2 },
        { value: 'NON_BINARY', label: 'Non-Binary', sortOrder: 3 },
        { value: 'PREFER_NOT_TO_SAY', label: 'Prefer Not to Say', sortOrder: 4, isDefault: true },
        { value: 'OTHER', label: 'Other', sortOrder: 5 },
      ],
    },
    {
      group: {
        name: 'invite_category',
        label: 'Invite Category',
        description: 'Categories for event invites',
      },
      options: [
        { value: 'VIP', label: 'VIP', sortOrder: 1 },
        { value: 'SPEAKER', label: 'Speaker', sortOrder: 2 },
        { value: 'SPONSOR', label: 'Sponsor', sortOrder: 3 },
        { value: 'MEDIA', label: 'Media', sortOrder: 4 },
        { value: 'STAFF', label: 'Staff', sortOrder: 5 },
        { value: 'GENERAL', label: 'General', sortOrder: 6, isDefault: true },
      ],
    },
    {
      group: {
        name: 'booth_size',
        label: 'Booth Size',
        description: 'Sizes for exhibitor booths',
      },
      options: [
        { value: 'SMALL', label: 'Small (3x3m)', sortOrder: 1 },
        { value: 'MEDIUM', label: 'Medium (6x3m)', sortOrder: 2, isDefault: true },
        { value: 'LARGE', label: 'Large (9x3m)', sortOrder: 3 },
        { value: 'EXTRA_LARGE', label: 'Extra Large (12x3m)', sortOrder: 4 },
      ],
    },
    {
      group: {
        name: 'dietary_preference',
        label: 'Dietary Preference',
        description: 'Dietary preferences for catering',
      },
      options: [
        { value: 'NONE', label: 'No Preference', sortOrder: 1, isDefault: true },
        { value: 'VEGETARIAN', label: 'Vegetarian', sortOrder: 2 },
        { value: 'VEGAN', label: 'Vegan', sortOrder: 3 },
        { value: 'HALAL', label: 'Halal', sortOrder: 4 },
        { value: 'KOSHER', label: 'Kosher', sortOrder: 5 },
        { value: 'GLUTEN_FREE', label: 'Gluten Free', sortOrder: 6 },
        { value: 'DAIRY_FREE', label: 'Dairy Free', sortOrder: 7 },
        { value: 'NUT_ALLERGY', label: 'Nut Allergy', sortOrder: 8 },
      ],
    },
    {
      group: {
        name: 'seat_section',
        label: 'Seat Section',
        description: 'Sections for seat inventory',
      },
      options: [
        { value: 'VIP', label: 'VIP Section', sortOrder: 1 },
        { value: 'PREMIUM', label: 'Premium Section', sortOrder: 2 },
        { value: 'GENERAL', label: 'General Section', sortOrder: 3, isDefault: true },
        { value: 'BALCONY', label: 'Balcony', sortOrder: 4 },
        { value: 'FLOOR', label: 'Floor', sortOrder: 5 },
      ],
    },
  ]

  for (const { group, options } of lookupData) {
    console.log(`\n📋 Creating group: ${group.label}`)

    // Create or update group
    const lookupGroup = await prisma.lookupGroup.upsert({
      where: { name: group.name },
      update: {
        label: group.label,
        description: group.description,
      },
      create: {
        name: group.name,
        label: group.label,
        description: group.description,
        isActive: true,
      },
    })

    console.log(`   ✅ Group created: ${lookupGroup.id}`)

    // Create options
    for (const option of options) {
      const lookupOption = await prisma.lookupOption.upsert({
        where: {
          groupId_value: {
            groupId: lookupGroup.id,
            value: option.value,
          },
        },
        update: {
          label: option.label,
          sortOrder: option.sortOrder,
          isDefault: option.isDefault || false,
        },
        create: {
          groupId: lookupGroup.id,
          value: option.value,
          label: option.label,
          sortOrder: option.sortOrder,
          isActive: true,
          isSystem: true, // Mark as system to prevent deletion
          isDefault: option.isDefault || false,
        },
      })

      console.log(`   ✓ ${option.label}`)
    }
  }

  console.log('\n✅ Lookup data seeded successfully!')
}

seedLookups()
  .catch((e) => {
    console.error('❌ Error seeding lookups:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
