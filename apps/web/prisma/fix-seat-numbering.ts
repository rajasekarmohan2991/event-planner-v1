import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixSeatNumbering() {
  console.log('🔧 Fixing seat numbering...\n')

  // Get all events with seats
  const events = await prisma.$queryRaw<any[]>`
    SELECT DISTINCT event_id
    FROM seat_inventory
    ORDER BY event_id
  `

  if (events.length === 0) {
    console.log('No events with seats found.')
    return
  }

  console.log(`Found ${events.length} event(s) with seats\n`)

  for (const event of events) {
    const eventId = Number(event.event_id)
    console.log(`📊 Processing Event ID: ${eventId}`)

    // Get all seats for this event, ordered properly
    const seats = await prisma.$queryRaw<any[]>`
      SELECT 
        id::text,
        section,
        row_number,
        seat_number
      FROM seat_inventory
      WHERE event_id = ${eventId}
      ORDER BY 
        CASE section
          WHEN 'VIP' THEN 1
          WHEN 'Premium' THEN 2
          WHEN 'General' THEN 3
          ELSE 4
        END,
        row_number,
        seat_number::int
    `

    console.log(`   Found ${seats.length} seats`)

    // Update with sequential numbering
    let updated = 0
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i]
      const newSeatNumber = String(i + 1)

      // Only update if different
      if (seat.seat_number !== newSeatNumber) {
        await prisma.$executeRaw`
          UPDATE seat_inventory
          SET seat_number = ${newSeatNumber}
          WHERE id = ${BigInt(seat.id)}
        `
        updated++
      }
    }

    console.log(`   ✅ Updated ${updated} seats (1-${seats.length})\n`)
  }

  console.log('✅ Seat numbering fixed successfully!')
}

fixSeatNumbering()
  .catch((e) => {
    console.error('❌ Error fixing seat numbering:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
