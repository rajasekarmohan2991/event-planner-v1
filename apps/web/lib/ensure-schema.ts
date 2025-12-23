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
      ADD COLUMN IF NOT EXISTS engagement_data JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
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

    // 4. Floor Plans Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS floor_plans (
        id TEXT PRIMARY KEY,
        "eventId" BIGINT NOT NULL, 
        tenant_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        "canvasWidth" INTEGER DEFAULT 1200,
        "canvasHeight" INTEGER DEFAULT 800,
        "backgroundColor" TEXT DEFAULT '#ffffff',
        "gridSize" INTEGER DEFAULT 20,
        "vipPrice" DECIMAL(10,2) DEFAULT 0,
        "premiumPrice" DECIMAL(10,2) DEFAULT 0,
        "generalPrice" DECIMAL(10,2) DEFAULT 0,
        "totalCapacity" INTEGER DEFAULT 0,
        "vipCapacity" INTEGER DEFAULT 0,
        "premiumCapacity" INTEGER DEFAULT 0,
        "generalCapacity" INTEGER DEFAULT 0,
        "menCapacity" INTEGER DEFAULT 0,
        "womenCapacity" INTEGER DEFAULT 0,
        "layoutData" JSONB DEFAULT '{}',
        status TEXT DEFAULT 'DRAFT',
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // 5. Exchange Rates Table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id TEXT PRIMARY KEY,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        rate DOUBLE PRECISION NOT NULL,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(from_currency, to_currency)
      );
    `)

    console.log('✅ Self-healing schema update complete.')
    return true
  } catch (error) {
    console.error('❌ Self-healing schema failed:', error)
    return false
  }
}
