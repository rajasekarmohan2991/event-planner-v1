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
        bank_name TEXT,
        account_number TEXT,
        ifsc_code TEXT,
        account_holder_name TEXT,
        upi_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // 3.1 Check and add missing columns for event_vendors if table exists
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS account_number TEXT;
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS ifsc_code TEXT;
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS account_holder_name TEXT;
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS upi_id TEXT;
        EXCEPTION
          WHEN undefined_table THEN
            RAISE NOTICE 'Table event_vendors does not exist yet';
        END;
      END $$;
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

    // 4.1 Check and add missing columns for floor_plans
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "eventId" BIGINT;
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "layoutData" JSONB DEFAULT '{}';
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "vipPrice" DECIMAL(10,2) DEFAULT 0;
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "premiumPrice" DECIMAL(10,2) DEFAULT 0;
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "generalPrice" DECIMAL(10,2) DEFAULT 0;
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "canvasWidth" INTEGER DEFAULT 1200;
          ALTER TABLE floor_plans ADD COLUMN IF NOT EXISTS "canvasHeight" INTEGER DEFAULT 800;
        EXCEPTION
          WHEN undefined_table THEN
            RAISE NOTICE 'Table floor_plans does not exist yet';
        END;
      END $$;
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

    // 6. Registrations Table Columns (Self-Healing)
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS registrations (
            id TEXT PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            data_json JSONB DEFAULT '{}',
            type TEXT DEFAULT 'GENERAL',
            email TEXT,
            status TEXT DEFAULT 'PENDING',
            ticket_id TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

    // 6.1 Check and add missing columns for registrations
    await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN 
            BEGIN
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS ticket_id TEXT;
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS data_json JSONB DEFAULT '{}';
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'GENERAL';
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';
            EXCEPTION
                WHEN undefined_table THEN
                    RAISE NOTICE 'Table registrations does not exist yet';
            END;
        END $$;
    `)

    console.log('✅ Self-healing schema update complete.')
    return true
  } catch (error) {
    console.error('❌ Self-healing schema failed:', error)
    return false
  }
}
