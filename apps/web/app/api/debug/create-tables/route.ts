import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * AUTO-MIGRATION ENDPOINT
 * Creates missing tables in production database
 * 
 * Access: /api/debug/create-tables
 * 
 * This will create:
 * - floor_plans (for seat selector - CRITICAL!)
 * - event_vendors
 */

export async function POST(req: NextRequest) {
    try {
        console.log('🔧 Creating missing tables...')

        // Create floor_plans table
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

        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_floor_plans_event ON floor_plans("eventId")
    `)
        console.log('✅ floor_plans index created')

        // Create event_vendors table
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

        await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_event_vendors_event ON event_vendors(event_id)
    `)
        console.log('✅ event_vendors index created')

        return NextResponse.json({
            success: true,
            message: 'Missing tables created successfully!',
            tables: ['floor_plans', 'event_vendors'],
            note: 'Floor plan API and Vendors API should now work'
        })

    } catch (error: any) {
        console.error('❌ Error creating tables:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        message: 'Use POST to create missing tables',
        tables_to_create: ['floor_plans', 'event_vendors']
    })
}
