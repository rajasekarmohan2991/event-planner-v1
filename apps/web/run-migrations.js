// Migration runner script
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

async function runMigrations() {
    console.log('🔄 Running custom SQL migrations...\n')

    try {
        // Migration 1: Event Feed Posts
        console.log('1️⃣ Creating event_feed_posts table...')
        const feedSql = fs.readFileSync(
            path.join(__dirname, 'prisma/migrations/create_event_feed_posts.sql'),
            'utf8'
        )

        // Split and execute each statement
        const feedStatements = feedSql.split(';').filter(s => s.trim())
        for (const statement of feedStatements) {
            if (statement.trim()) {
                await prisma.$executeRawUnsafe(statement)
            }
        }
        console.log('✅ event_feed_posts table created\n')

        // Migration 2: Seats
        console.log('2️⃣ Creating seats table...')
        const seatsSql = fs.readFileSync(
            path.join(__dirname, 'prisma/migrations/create_seats_table.sql'),
            'utf8'
        )

        // Split and execute each statement
        const seatsStatements = seatsSql.split(';').filter(s => s.trim())
        for (const statement of seatsStatements) {
            if (statement.trim()) {
                await prisma.$executeRawUnsafe(statement)
            }
        }
        console.log('✅ seats table created\n')

        console.log('🎉 All migrations completed successfully!')
    } catch (error) {
        if (error.message.includes('already exists')) {
            console.log('ℹ️ Tables already exist - skipping')
        } else {
            console.error('❌ Migration error:', error.message)
            console.error('Full error:', error)
        }
    } finally {
        await prisma.$disconnect()
    }
}

runMigrations()
