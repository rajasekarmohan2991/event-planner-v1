import prisma from '@/lib/prisma'

export async function ensureSchema() {
    console.log('🔧 Running self-healing schema update...')
    try {
        // 1. Sponsors Table Columns
        await prisma.$executeRawUnsafe(`
      ALTER TABLE sponsors 
      ADD COLUMN IF NOT EXISTS contact_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS branding_online JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS branding_offline JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS event_presence JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS giveaway_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS legal_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS post_event_data JSONB DEFAULT '{}';
    `)

        // 2. Events Table Columns
        await prisma.$executeRawUnsafe(`
      ALTER TABLE events
      ADD COLUMN IF NOT EXISTS promote_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS engagement_data JSONB DEFAULT '{}';
    `)

        // 3. Event Vendors Table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_vendors (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        tenant_id TEXT,
        name TEXT NOT NULL,
        category TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        contract_amount DECIMAL(10,2) DEFAULT 0,
        paid_amount DECIMAL(10,2) DEFAULT 0,
        payment_status TEXT DEFAULT 'PENDING',
        payment_due_date DATE,
        status TEXT DEFAULT 'ACTIVE',
        notes TEXT,
        contract_url TEXT,
        invoice_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

        console.log('✅ Self-healing schema update complete.')
        return true
    } catch (error) {
        console.error('❌ Self-healing schema failed:', error)
        return false
    }
}
