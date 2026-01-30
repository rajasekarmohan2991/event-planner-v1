import prisma from './lib/prisma'

async function checkSessions() {
    try {
        console.log('🔍 Checking sessions in database...\n')

        const sessions = await prisma.$queryRaw`
      SELECT id, title, event_id, start_time, end_time, created_at
      FROM sessions
      ORDER BY created_at DESC
      LIMIT 20
    ` as any[]

        console.log(`Found ${sessions.length} sessions:\n`)

        sessions.forEach((session, index) => {
            console.log(`${index + 1}. Session ID: ${session.id}`)
            console.log(`   Title: ${session.title}`)
            console.log(`   Event ID: ${session.event_id}`)
            console.log(`   Start: ${session.start_time}`)
            console.log(`   End: ${session.end_time}`)
            console.log(`   Created: ${session.created_at}`)
            console.log('')
        })

        // Also check events
        const events = await prisma.$queryRaw`
      SELECT id, name FROM events ORDER BY created_at DESC LIMIT 5
    ` as any[]

        console.log(`\n📅 Recent Events:`)
        events.forEach(event => {
            console.log(`   Event ID: ${event.id} - ${event.name}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

checkSessions()
