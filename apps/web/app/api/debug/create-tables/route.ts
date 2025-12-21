import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * AUTO-MIGRATION ENDPOINT
 * Creates missing tables and columns in production database
 * 
 * Access: /api/debug/create-tables
 */

export async function POST(req: NextRequest) {
    try {
        console.log('🔧 Running database migrations...')
        const results: any = {
            success: true,
            migrations: []
        }

        // 1. Add event_id column to speakers table (CRITICAL!)
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE speakers 
        ADD COLUMN IF NOT EXISTS event_id BIGINT
      `)
            console.log('✅ Added event_id column to speakers')
            results.migrations.push('speakers.event_id column added')
        } catch (e: any) {
            console.log('⚠️ speakers.event_id:', e.message)
            results.migrations.push(`speakers.event_id: ${e.message}`)
        }

        // 2. Create index on speakers.event_id
        try {
            await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_speakers_event ON speakers(event_id)
      `)
            console.log('✅ Created index on speakers.event_id')
            results.migrations.push('speakers index created')
        } catch (e: any) {
            console.log('⚠️ speakers index:', e.message)
        }

        // 3. Create floor_plans table
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS floor_plans (
            id TEXT PRIMARY KEY,
            "eventId" BIGINT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            "canvasWidth" INTEGER NOT NULL DEFAULT 1200,
            "canvasHeight" INTEGER NOT NULL DEFAULT 800,
            "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
            "gridSize" INTEGER NOT NULL DEFAULT 20,
            "vipPrice" NUMERIC NOT NULL DEFAULT 0,
            "premiumPrice" NUMERIC NOT NULL DEFAULT 0,
            "generalPrice" NUMERIC NOT NULL DEFAULT 0,
            "totalCapacity" INTEGER NOT NULL DEFAULT 0,
            "vipCapacity" INTEGER NOT NULL DEFAULT 0,
            "premiumCapacity" INTEGER NOT NULL DEFAULT 0,
            "generalCapacity" INTEGER NOT NULL DEFAULT 0,
            "menCapacity" INTEGER NOT NULL DEFAULT 0,
            "womenCapacity" INTEGER NOT NULL DEFAULT 0,
            "layoutData" JSONB,
            status TEXT NOT NULL DEFAULT 'DRAFT',
            version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
      `)
            console.log('✅ floor_plans table created')
            results.migrations.push('floor_plans table created')

            await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_floor_plans_event ON floor_plans("eventId")
      `)
            console.log('✅ floor_plans index created')
        } catch (e: any) {
            console.log('⚠️ floor_plans:', e.message)
            results.migrations.push(`floor_plans: ${e.message}`)
        }

        // 4. Create event_vendors table
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS event_vendors (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            contract_amount NUMERIC NOT NULL DEFAULT 0,
            paid_amount NUMERIC NOT NULL DEFAULT 0,
            payment_status TEXT NOT NULL DEFAULT 'PENDING',
            payment_due_date TIMESTAMP WITHOUT TIME ZONE,
            status TEXT NOT NULL DEFAULT 'ACTIVE',
            notes TEXT,
            contract_url TEXT,
            invoice_url TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
        )
      `)
            console.log('✅ event_vendors table created')
            results.migrations.push('event_vendors table created')

            await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_event_vendors_event ON event_vendors(event_id)
      `)
            console.log('✅ event_vendors index created')
        } catch (e: any) {
            console.log('⚠️ event_vendors:', e.message)
            results.migrations.push(`event_vendors: ${e.message}`)
        }

        return NextResponse.json({
            success: true,
            message: 'Database migrations completed!',
            migrations: results.migrations,
            note: 'All APIs should now work. Speakers will need event_id values populated.'
        })

    } catch (error: any) {
        console.error('❌ Migration error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to run database migrations',
        migrations: [
            'Add event_id column to speakers',
            'Create floor_plans table',
            'Create event_vendors table'
        ]
    })
}
