import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// POST /api/admin/setup-lookups - Create lookup tables and populate defaults
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        // Only SUPER_ADMIN can run this
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Setting up lookup tables...')

        // Read the migration file
        const migrationPath = path.join(process.cwd(), 'apps/web/prisma/migrations/create_lookup_tables.sql')
        const sql = fs.readFileSync(migrationPath, 'utf8')

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'))

        let executed = 0
        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement)
                executed++
            } catch (error: any) {
                // Ignore "already exists" errors
                if (!error.message.includes('already exists') && !error.message.includes('duplicate key')) {
                    console.warn('Statement warning:', error.message.substring(0, 100))
                }
            }
        }

        console.log(`✅ Executed ${executed} statements`)

        // Verify tables were created
        const categories = await prisma.$queryRaw<any[]>`
      SELECT id, name, code FROM lookup_categories LIMIT 10
    `

        const values = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM lookup_values
    `

        return NextResponse.json({
            success: true,
            message: 'Lookup tables setup complete',
            stats: {
                statementsExecuted: executed,
                categoriesCreated: categories.length,
                valuesCreated: values[0]?.count || 0
            },
            categories: categories
        })

    } catch (error: any) {
        console.error('❌ Error setting up lookups:', error)
        return NextResponse.json({
            error: 'Failed to setup lookups',
            details: error.message
        }, { status: 500 })
    }
}
