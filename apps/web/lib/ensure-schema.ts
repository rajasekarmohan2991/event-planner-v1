import prisma from '@/lib/prisma'

export async function ensureSchema() {
    console.log('🔧 Running self-healing schema update...')
    try {
        // Test database connection first
        await prisma.$queryRaw`SELECT 1 as test`
        console.log('✅ Database connection successful')

        console.log('📝 Step 1: Updating tenants table...')
        // 0. Tenants Table - Add country column and subscription modules (wrapped in DO block to handle missing table)
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
          BEGIN
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS finance_mode TEXT DEFAULT 'legacy';
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS module_vendor_management BOOLEAN DEFAULT false;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS module_sponsor_management BOOLEAN DEFAULT false;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS module_exhibitor_management BOOLEAN DEFAULT false;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS provider_commission_rate DECIMAL(5,2) DEFAULT 15.00;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS provider_settings JSONB DEFAULT '{}'::jsonb;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS banner TEXT;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT;
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE';
          EXCEPTION
              WHEN undefined_table THEN
                  RAISE NOTICE 'Table tenants does not exist yet';
          END;
      END $$;
    `)

        // 1. Sponsors Table Columns
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
          BEGIN
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
          EXCEPTION
              WHEN undefined_table THEN
                  RAISE NOTICE 'Table sponsors does not exist yet';
          END;
      END $$;
    `)

        // 2. Events Table Columns
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
          BEGIN
              ALTER TABLE events
              ADD COLUMN IF NOT EXISTS promote_data JSONB DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS engagement_data JSONB DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
              ADD COLUMN IF NOT EXISTS price_inr INTEGER DEFAULT 0,
              ADD COLUMN IF NOT EXISTS expected_attendees INTEGER DEFAULT 0,
              ADD COLUMN IF NOT EXISTS event_manager_email TEXT;
          EXCEPTION
              WHEN undefined_table THEN
                  RAISE NOTICE 'Table events does not exist yet';
          END;
      END $$;
    `)

        // 3. Event Vendors Table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_vendors (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        tenant_id TEXT,
        name TEXT NOT NULL,
        category TEXT,
        budget DECIMAL(10,2) DEFAULT 0,
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
          ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2) DEFAULT 0;
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

        // 3.5 Order Table (MixedCase for Prisma compatibility)
        console.log('📝 Step 3.5: Creating Order table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Order" (
        "id" TEXT PRIMARY KEY,
        "eventId" TEXT NOT NULL,
        "tenantId" TEXT,
        "userId" BIGINT,
        "email" TEXT,
        "buyerEmail" TEXT,
        "status" TEXT DEFAULT 'CREATED',
        "paymentStatus" TEXT DEFAULT 'PENDING',
        "totalInr" INTEGER DEFAULT 0,
        "meta" JSONB,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      );
    `)

        // Add indexes for Order
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_eventId_idx" ON "Order"("eventId");`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Order_tenantId_idx" ON "Order"("tenantId");`)

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
            price_inr INTEGER DEFAULT 0,
            ticket_id TEXT,
            check_in_status TEXT DEFAULT 'NOT_CHECKED_IN',
            check_in_time TIMESTAMP WITH TIME ZONE,
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
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS price_inr INTEGER DEFAULT 0;
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'NOT_CHECKED_IN';
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
            EXCEPTION
                WHEN undefined_table THEN
                    RAISE NOTICE 'Table registrations does not exist yet';
            END;
        END $$;
    `)

        // 6.2 RSVPs Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS rsvps (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            user_id BIGINT,
            email TEXT,
            status TEXT DEFAULT 'INTERESTED',
            waitlisted BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tenant_id TEXT
        );
    `)

        // 6.3 Tickets Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tickets (
            id BIGINT PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
            event_id BIGINT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            price_in_minor INTEGER DEFAULT 0,
            currency TEXT DEFAULT 'INR',
            quantity INTEGER DEFAULT 0,
            sold INTEGER DEFAULT 0,
            status TEXT DEFAULT 'ACTIVE',
            is_free BOOLEAN DEFAULT false,
            group_id TEXT,
            requires_approval BOOLEAN DEFAULT false,
            sales_start_at TIMESTAMP WITH TIME ZONE,
            sales_end_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tenant_id TEXT
        );
    `)

        // 7. Registration Approvals Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS registration_approvals (
            id BIGSERIAL PRIMARY KEY,
            registration_id TEXT NOT NULL,
            event_id BIGINT NOT NULL,
            status TEXT DEFAULT 'PENDING',
            approved_by BIGINT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 8. Sessions Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS sessions (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE,
            end_time TIMESTAMP WITH TIME ZONE,
            location TEXT,
            room TEXT,
            track TEXT,
            stream_url TEXT,
            is_live BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // Add missing columns to sessions table
        await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            BEGIN ALTER TABLE sessions ADD COLUMN IF NOT EXISTS room TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
            BEGIN ALTER TABLE sessions ADD COLUMN IF NOT EXISTS track TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
            BEGIN ALTER TABLE sessions ADD COLUMN IF NOT EXISTS location TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
            BEGIN ALTER TABLE sessions ADD COLUMN IF NOT EXISTS stream_url TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
            BEGIN ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
        END $$;
    `)

        // 9. Session Speakers Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS session_speakers (
            id BIGSERIAL PRIMARY KEY,
            session_id BIGINT NOT NULL,
            speaker_id BIGINT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10. Speakers Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS speakers (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            title TEXT,
            bio TEXT,
            photo_url TEXT,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10.1 Exhibitors Table
        console.log('📝 Step 10.1: Creating exhibitors table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS exhibitors (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            company TEXT,
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            website TEXT,
            notes TEXT,
            first_name TEXT,
            last_name TEXT,
            job_title TEXT,
            business_address TEXT,
            company_description TEXT,
            products_services TEXT,
            booth_type TEXT,
            booth_option TEXT,
            booth_area TEXT,
            electrical_access BOOLEAN DEFAULT FALSE,
            display_tables BOOLEAN DEFAULT FALSE,
            status TEXT DEFAULT 'PENDING_CONFIRMATION',
            email_confirmed BOOLEAN DEFAULT FALSE,
            payment_amount DECIMAL(10,2) DEFAULT 0,
            payment_status TEXT DEFAULT 'PENDING',
            paid_at TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10.2 Exhibitor Registrations Table (for invoices)
        console.log('📝 Step 10.2: Creating exhibitor_registrations table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS exhibitor_registrations (
            id TEXT PRIMARY KEY,
            event_id TEXT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            company_name TEXT,
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            booth_number TEXT,
            booth_type TEXT,
            payment_amount DECIMAL(10,2) DEFAULT 0,
            payment_status TEXT DEFAULT 'PENDING',
            paid_at TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10.3 Sponsor Registrations Table (for invoices)
        console.log('📝 Step 10.3: Creating sponsor_registrations table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS sponsor_registrations (
            id TEXT PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            name TEXT NOT NULL,
            tier TEXT DEFAULT 'BRONZE',
            contact_name TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            payment_amount DECIMAL(10,2) DEFAULT 0,
            payment_status TEXT DEFAULT 'PENDING',
            paid_at TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10.4 Event Team Members Table
        console.log('📝 Step 10.4: Creating event_team_members table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS event_team_members (
            id TEXT PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            user_id BIGINT,
            name TEXT NOT NULL,
            email TEXT,
            role TEXT DEFAULT 'MEMBER',
            status TEXT DEFAULT 'ACTIVE',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 10.4.1 Event Team Invitations Table (for pending invites)
        console.log('📝 Step 10.4.1: Creating event_team_invitations table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS event_team_invitations (
            id BIGSERIAL PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id TEXT,
            email TEXT NOT NULL,
            role TEXT DEFAULT 'STAFF',
            token TEXT,
            invited_by BIGINT,
            status TEXT DEFAULT 'PENDING',
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(event_id, email)
        );
    `)

        // Create index for faster lookups
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_event_team_invitations_event ON event_team_invitations(event_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_event_team_invitations_token ON event_team_invitations(token);
    `)

        // 10.5 Promo Codes Table
        console.log('📝 Step 10.5: Creating promo_codes table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS promo_codes (
            id BIGSERIAL PRIMARY KEY,
            event_id TEXT NOT NULL,
            tenant_id TEXT,
            code TEXT NOT NULL,
            discount_type TEXT DEFAULT 'PERCENT',
            discount_amount DECIMAL(10,2) DEFAULT 0,
            max_uses INTEGER,
            current_uses INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            valid_from TIMESTAMP,
            valid_until TIMESTAMP,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `)

        // 11. Finance Tables - Payouts
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS payouts (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            recipient_type TEXT NOT NULL,
            recipient_id TEXT,
            recipient_name TEXT NOT NULL,
            recipient_email TEXT,
            bank_name TEXT,
            account_number TEXT,
            ifsc_code TEXT,
            account_holder TEXT,
            upi_id TEXT,
            amount DOUBLE PRECISION NOT NULL,
            currency TEXT DEFAULT 'USD' NOT NULL,
            method TEXT NOT NULL,
            reference TEXT,
            status TEXT DEFAULT 'PENDING' NOT NULL,
            scheduled_date TIMESTAMP NOT NULL,
            processed_date TIMESTAMP,
            description TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_payouts_tenant ON payouts(tenant_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_payouts_event ON payouts(event_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
    `)

        // 11.5 Lookup Tables (Self-Healing)
        console.log('📝 Step 11.5: Creating lookup tables...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lookup_groups (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            label TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            tenant_id TEXT
        );
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_lookup_groups_tenant ON lookup_groups(tenant_id);
    `)

        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lookup_options (
            id TEXT PRIMARY KEY,
            group_id TEXT NOT NULL,
            tenant_id TEXT,
            value TEXT NOT NULL,
            label TEXT NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            is_default BOOLEAN DEFAULT false,
            is_system BOOLEAN DEFAULT false,
            metadata JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(group_id, value)
        );
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_lookup_options_group ON lookup_options(group_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_lookup_options_tenant ON lookup_options(tenant_id);
    `)

        // Seed some initial lookup groups if empty
        const groupCount = await prisma.$queryRaw<any[]>`SELECT count(*) as count FROM lookup_groups`;
        const count = Number(groupCount[0]?.count || 0);

        if (count === 0) {
            console.log('🌱 Seeding initial lookup groups...')
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_groups (id, name, label, description, is_active) VALUES 
                ('lg_event_category', 'event_category', 'Event Category', 'Types of events (Conference, Workshop, etc.)', true),
                ('lg_event_mode', 'event_mode', 'Event Mode', 'Online, In-Person, Hybrid', true),
                ('lg_ticket_type', 'ticket_type', 'Ticket Type', 'VIP, General, Early Bird', true),
                ('lg_vendor_category', 'vendor_category', 'Vendor Category', 'Catering, Audio/Visual, Decoration', true);
            `);

            // Seed Event Modes
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_options (id, group_id, value, label, sort_order, is_system) VALUES
                ('lo_mode_1', 'lg_event_mode', 'ONLINE', 'Online', 1, true),
                ('lo_mode_2', 'lg_event_mode', 'OFFLINE', 'In-Person', 2, true),
                ('lo_mode_3', 'lg_event_mode', 'HYBRID', 'Hybrid', 3, true);
            `);
        }

        // 12. Finance Tables - Charges
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS charges (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            currency TEXT DEFAULT 'USD' NOT NULL,
            status TEXT DEFAULT 'PENDING' NOT NULL,
            applied_date TIMESTAMP,
            invoice_id TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_charges_tenant ON charges(tenant_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_charges_event ON charges(event_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
    `)

        // 13. Finance Tables - Credits
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS credits (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            currency TEXT DEFAULT 'USD' NOT NULL,
            status TEXT DEFAULT 'PENDING' NOT NULL,
            applied_date TIMESTAMP,
            expiry_date TIMESTAMP,
            reference_id TEXT,
            reference_type TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_credits_tenant ON credits(tenant_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_credits_event ON credits(event_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
    `)

        // 14. Finance Tables - Finance Settings
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS finance_settings (
            id TEXT PRIMARY KEY,
            tenant_id TEXT UNIQUE NOT NULL,
            enable_invoicing BOOLEAN DEFAULT true NOT NULL,
            enable_payouts BOOLEAN DEFAULT true NOT NULL,
            enable_charges BOOLEAN DEFAULT true NOT NULL,
            default_currency TEXT DEFAULT 'USD' NOT NULL,
            default_payment_terms INTEGER DEFAULT 30 NOT NULL,
            default_tax_rate DOUBLE PRECISION DEFAULT 0 NOT NULL,
            tax_registration_number TEXT,
            bank_name TEXT,
            account_number TEXT,
            ifsc_code TEXT,
            account_holder TEXT,
            digital_signature_url TEXT,
            invoice_prefix TEXT DEFAULT 'INV' NOT NULL,
            invoice_footer TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 15. Invoices Table
        console.log('📝 Step 15: Creating invoices table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            number TEXT NOT NULL,
            date TIMESTAMP NOT NULL,
            due_date TIMESTAMP NOT NULL,
            recipient_type TEXT NOT NULL,
            recipient_id TEXT,
            recipient_name TEXT NOT NULL,
            recipient_email TEXT,
            recipient_address TEXT,
            recipient_tax_id TEXT,
            status TEXT DEFAULT 'DRAFT' NOT NULL,
            currency TEXT DEFAULT 'USD' NOT NULL,
            subtotal DOUBLE PRECISION DEFAULT 0 NOT NULL,
            tax_total DOUBLE PRECISION DEFAULT 0 NOT NULL,
            discount_total DOUBLE PRECISION DEFAULT 0 NOT NULL,
            grand_total DOUBLE PRECISION DEFAULT 0 NOT NULL,
            notes TEXT,
            terms TEXT,
            is_signed BOOLEAN DEFAULT FALSE,
            signature_url TEXT,
            payment_terms INTEGER DEFAULT 30,
            sent_at TIMESTAMP,
            sent_to TEXT,
            exchange_rate DOUBLE PRECISION DEFAULT 1,
            base_currency TEXT DEFAULT 'USD',
            base_currency_amount DOUBLE PRECISION,
            platform_commission DOUBLE PRECISION DEFAULT 0,
            platform_commission_rate DOUBLE PRECISION DEFAULT 0,
            net_to_organizer DOUBLE PRECISION,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // Create unique index for invoice number per tenant
        await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS invoices_tenant_id_number_key ON invoices(tenant_id, number);
    `)

        // 15.1 Invoice Line Items Table
        console.log('📝 Step 15.1: Creating invoice_line_items table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoice_line_items (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            description TEXT NOT NULL,
            quantity INTEGER DEFAULT 1 NOT NULL,
            unit_price DOUBLE PRECISION DEFAULT 0 NOT NULL,
            tax_rate DOUBLE PRECISION DEFAULT 0,
            tax_amount DOUBLE PRECISION DEFAULT 0,
            discount DOUBLE PRECISION DEFAULT 0,
            total DOUBLE PRECISION DEFAULT 0 NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 15.2 Payment Records Table
        console.log('📝 Step 15.2: Creating payment_records table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS payment_records (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            method TEXT NOT NULL,
            reference TEXT,
            status TEXT DEFAULT 'COMPLETED' NOT NULL,
            paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            notes TEXT,
            currency TEXT DEFAULT 'USD',
            exchange_rate DOUBLE PRECISION DEFAULT 1,
            gateway TEXT,
            gateway_transaction_id TEXT,
            gateway_fee DOUBLE PRECISION DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 15.3 Receipts Table
        console.log('📝 Step 15.3: Creating receipts table...')
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS receipts (
            id TEXT PRIMARY KEY,
            invoice_id TEXT NOT NULL,
            payment_id TEXT NOT NULL,
            number TEXT NOT NULL,
            amount DOUBLE PRECISION NOT NULL,
            issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // Add indexes for invoices
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoices_event ON invoices(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_line_items_invoice ON invoice_line_items(invoice_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_records_invoice ON payment_records(invoice_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_receipts_invoice ON receipts(invoice_id);`)

        console.log('📝 Step 16: Creating signature_requests table...')
        // 16. Digital Signatures Table (DocuSign Integration)
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS signature_requests (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            document_type TEXT NOT NULL,
            document_title TEXT NOT NULL,
            signer_email TEXT NOT NULL,
            signer_name TEXT NOT NULL,
            signer_type TEXT NOT NULL,
            signer_id TEXT,
            envelope_id TEXT,
            signing_url TEXT,
            status TEXT DEFAULT 'PENDING' NOT NULL,
            sent_at TIMESTAMP,
            viewed_at TIMESTAMP,
            signed_at TIMESTAMP,
            completed_at TIMESTAMP,
            signed_document_url TEXT,
            signature_image_url TEXT,
            signer_ip TEXT,
            user_agent TEXT,
            custom_fields JSONB,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // Create indexes for signature_requests
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_signature_requests_tenant ON signature_requests(tenant_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_signature_requests_event ON signature_requests(event_id);
    `)
        await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
    `)

        console.log('📝 Step 17: Creating finance module tables...')

        // 17. TDS/Withholding Tax Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tds_deductions (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            payout_id TEXT,
            recipient_type TEXT NOT NULL,
            recipient_id TEXT,
            recipient_name TEXT NOT NULL,
            recipient_pan TEXT,
            section TEXT,
            tds_rate DOUBLE PRECISION NOT NULL DEFAULT 10,
            gross_amount DOUBLE PRECISION NOT NULL,
            tds_amount DOUBLE PRECISION NOT NULL,
            net_amount DOUBLE PRECISION NOT NULL,
            currency TEXT DEFAULT 'INR',
            status TEXT DEFAULT 'PENDING',
            deducted_at TIMESTAMP,
            deposited_at TIMESTAMP,
            certificate_number TEXT,
            certificate_issued_at TIMESTAMP,
            financial_year TEXT,
            quarter TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 18. Legal Consent Tracking Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS legal_consents (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            user_id BIGINT,
            entity_type TEXT,
            entity_id TEXT,
            entity_email TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            document_type TEXT NOT NULL,
            document_version TEXT NOT NULL,
            document_hash TEXT,
            document_url TEXT,
            consent_method TEXT NOT NULL,
            typed_name TEXT,
            signature_url TEXT,
            otp_verified BOOLEAN DEFAULT FALSE,
            ip_address TEXT,
            user_agent TEXT,
            consent_given_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            is_revoked BOOLEAN DEFAULT FALSE,
            revoked_at TIMESTAMP,
            revocation_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 19. Finance Audit Log Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS finance_audit_logs (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            action_type TEXT NOT NULL,
            action_description TEXT,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            previous_state JSONB,
            new_state JSONB,
            amount DOUBLE PRECISION,
            currency TEXT,
            performed_by_user_id BIGINT,
            performed_by_name TEXT,
            performed_by_email TEXT,
            ip_address TEXT,
            user_agent TEXT,
            request_id TEXT,
            external_reference TEXT,
            webhook_event_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 20. Platform Commission Config Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS platform_commission_config (
            id TEXT PRIMARY KEY,
            commission_type TEXT NOT NULL,
            rate_type TEXT NOT NULL,
            percentage_rate DOUBLE PRECISION DEFAULT 0,
            fixed_amount DOUBLE PRECISION DEFAULT 0,
            tiered_rates JSONB,
            currency TEXT DEFAULT 'USD',
            min_commission DOUBLE PRECISION DEFAULT 0,
            max_commission DOUBLE PRECISION,
            country TEXT,
            subscription_plan TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            effective_until TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 21. Invoice Number Sequence Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoice_sequences (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL UNIQUE,
            invoice_sequence INT DEFAULT 0,
            receipt_sequence INT DEFAULT 0,
            payout_sequence INT DEFAULT 0,
            invoice_prefix TEXT DEFAULT 'INV',
            receipt_prefix TEXT DEFAULT 'REC',
            payout_prefix TEXT DEFAULT 'PAY',
            year_format TEXT DEFAULT 'YYYY',
            include_month BOOLEAN DEFAULT FALSE,
            padding_length INT DEFAULT 4,
            reset_yearly BOOLEAN DEFAULT TRUE,
            last_reset_year INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 22. Country Tax Config Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS country_tax_config (
            id TEXT PRIMARY KEY,
            country_code TEXT NOT NULL,
            country_name TEXT NOT NULL,
            tax_type TEXT NOT NULL,
            tax_name TEXT NOT NULL,
            default_rate DOUBLE PRECISION NOT NULL,
            category_rates JSONB,
            registration_required BOOLEAN DEFAULT TRUE,
            registration_label TEXT,
            registration_format TEXT,
            has_withholding_tax BOOLEAN DEFAULT FALSE,
            withholding_rates JSONB,
            has_reverse_charge BOOLEAN DEFAULT FALSE,
            reverse_charge_threshold DOUBLE PRECISION,
            has_state_taxes BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 23. Payment Gateway Config Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS payment_gateway_config (
            id TEXT PRIMARY KEY,
            gateway_name TEXT NOT NULL,
            display_name TEXT NOT NULL,
            environment TEXT NOT NULL DEFAULT 'sandbox',
            api_key TEXT,
            secret_key TEXT,
            webhook_secret TEXT,
            supported_currencies JSONB,
            supported_payment_methods JSONB,
            supported_countries JSONB,
            processing_fee_percentage DOUBLE PRECISION DEFAULT 0,
            processing_fee_fixed DOUBLE PRECISION DEFAULT 0,
            is_active BOOLEAN DEFAULT TRUE,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 24. Payment Webhook Logs Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS payment_webhook_logs (
            id TEXT PRIMARY KEY,
            gateway TEXT NOT NULL,
            event_type TEXT NOT NULL,
            event_id TEXT NOT NULL,
            payload JSONB NOT NULL,
            headers JSONB,
            processed BOOLEAN DEFAULT FALSE,
            processed_at TIMESTAMP,
            processing_error TEXT,
            retry_count INT DEFAULT 0,
            tenant_id TEXT,
            invoice_id TEXT,
            payment_id TEXT,
            signature_valid BOOLEAN,
            received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        // 25. Refund Requests Table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS refund_requests (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            event_id BIGINT,
            payment_id TEXT NOT NULL,
            invoice_id TEXT,
            order_id TEXT,
            requester_type TEXT NOT NULL,
            requester_id TEXT,
            requester_name TEXT NOT NULL,
            requester_email TEXT NOT NULL,
            original_amount DOUBLE PRECISION NOT NULL,
            refund_amount DOUBLE PRECISION NOT NULL,
            currency TEXT NOT NULL,
            reason_category TEXT,
            reason_description TEXT,
            status TEXT DEFAULT 'PENDING',
            approved_by_user_id BIGINT,
            approved_at TIMESTAMP,
            rejection_reason TEXT,
            gateway_refund_id TEXT,
            processed_at TIMESTAMP,
            processing_error TEXT,
            is_partial BOOLEAN DEFAULT FALSE,
            partial_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `)

        console.log('📝 Step 26: Adding multi-currency columns to existing tables...')

        // Add multi-currency columns to invoices
        await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_currency_amount DOUBLE PRECISION;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_commission DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_commission_rate DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_to_organizer DOUBLE PRECISION;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'NET_30';
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_to TEXT;
            ALTER TABLE invoices ADD COLUMN IF NOT EXISTS finance_version TEXT DEFAULT 'v1';
        EXCEPTION WHEN undefined_table THEN NULL; END $$;
    `)

        // Add multi-currency columns to payouts
        await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS base_currency_amount DOUBLE PRECISION;
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tds_rate DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tds_amount DOUBLE PRECISION DEFAULT 0;
            ALTER TABLE payouts ADD COLUMN IF NOT EXISTS gross_amount DOUBLE PRECISION;
        EXCEPTION WHEN undefined_table THEN NULL; END $$;
    `)

        // Add gateway columns to payment_records
        await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
            ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
            ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway TEXT;
            ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
            ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway_fee DOUBLE PRECISION DEFAULT 0;
        EXCEPTION WHEN undefined_table THEN NULL; END $$;
    `)

        console.log('📝 Step 27: Creating indexes for finance tables...')

        // Create indexes
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tds_deductions_tenant ON tds_deductions(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_legal_consents_tenant ON legal_consents(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_finance_audit_tenant ON finance_audit_logs(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_refund_requests_tenant ON refund_requests(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);`)

        console.log('📝 Step 28: Creating global_tax_templates table...')

        // Create global tax templates table for super admin
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS global_tax_templates (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            rate DOUBLE PRECISION NOT NULL,
            description TEXT,
            tax_type VARCHAR(50) DEFAULT 'GST',
            country_code VARCHAR(2),
            
            is_active BOOLEAN DEFAULT true,
            
            effective_from TIMESTAMP,
            effective_until TIMESTAMP,
            
            applies_to VARCHAR(50) DEFAULT 'ALL',
            is_compound BOOLEAN DEFAULT false,
            
            created_by BIGINT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `)

        // Create indexes for global_tax_templates
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_global_tax_templates_country ON global_tax_templates(country_code);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_global_tax_templates_active ON global_tax_templates(is_active);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_global_tax_templates_effective ON global_tax_templates(effective_from);`)

        console.log('📝 Step 29: Enhancing tax_structures table...')

        // Add enhanced columns to tax_structures
        await prisma.$executeRawUnsafe(`
        DO $$ BEGIN
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS country_code VARCHAR(2);
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS tax_type VARCHAR(50) DEFAULT 'STANDARD';
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS is_compound BOOLEAN DEFAULT false;
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS applies_to VARCHAR(50) DEFAULT 'ALL';
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_from DATE;
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_until DATE;
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS tax_registration_number VARCHAR(100);
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS global_template_id VARCHAR(255);
            ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false;
        EXCEPTION WHEN undefined_table THEN NULL; END $$;
    `)

        // Create index for global template linking
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tax_structures_global_template ON tax_structures(global_template_id);`)

        console.log('📝 Step 30: Creating event_tax_settings table...')

        // Create event tax settings table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS event_tax_settings (
            id VARCHAR(255) PRIMARY KEY,
            event_id BIGINT NOT NULL,
            tenant_id VARCHAR(255) NOT NULL,
            
            use_custom_tax BOOLEAN DEFAULT false,
            tax_structure_id VARCHAR(255),
            custom_tax_rate DOUBLE PRECISION,
            custom_tax_name VARCHAR(100),
            
            is_tax_exempt BOOLEAN DEFAULT false,
            exemption_reason TEXT,
            exemption_certificate_url VARCHAR(500),
            
            tax_invoice_prefix VARCHAR(20),
            include_tax_breakdown BOOLEAN DEFAULT true,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `)

        // Create indexes for event_tax_settings
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_tax_settings_event ON event_tax_settings(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_tax_settings_tenant ON event_tax_settings(tenant_id);`)

        console.log('📝 Step 31: Creating convenience_fee_config table...')

        // Create convenience fee configuration table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS convenience_fee_config (
            id VARCHAR(255) PRIMARY KEY,
            tenant_id VARCHAR(255) NOT NULL,
            event_id BIGINT,
            
            fee_type VARCHAR(20) DEFAULT 'PERCENTAGE',
            percentage_fee DOUBLE PRECISION DEFAULT 0,
            fixed_fee DOUBLE PRECISION DEFAULT 0,
            
            applies_to VARCHAR(50) DEFAULT 'ALL',
            pass_fee_to_customer BOOLEAN DEFAULT true,
            
            minimum_fee DOUBLE PRECISION,
            maximum_fee DOUBLE PRECISION,
            
            display_name VARCHAR(100) NOT NULL,
            description TEXT,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `)

        // Create indexes for convenience_fee_config
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_convenience_fee_tenant ON convenience_fee_config(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_convenience_fee_event ON convenience_fee_config(event_id);`)

        console.log('📝 Step 32: Creating document_templates table...')

        // Create document templates table for digital signatures
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS document_templates (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            tenant_id VARCHAR(255) NOT NULL,
            
            template_type VARCHAR(50) NOT NULL,
            document_name VARCHAR(255) NOT NULL,
            document_type VARCHAR(50) NOT NULL,
            
            content TEXT NOT NULL,
            version INTEGER DEFAULT 1,
            is_active BOOLEAN DEFAULT true,
            
            created_by BIGINT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            
            CONSTRAINT fk_document_templates_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
        );
    `)

        // Create indexes for document_templates
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON document_templates(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);`)

        console.log('📝 Step 33: Creating subscription_plans table...')

        // Create subscription plans table for managing pricing tiers
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            price DOUBLE PRECISION NOT NULL DEFAULT 0,
            currency VARCHAR(10) DEFAULT 'USD',
            billing_period VARCHAR(50) DEFAULT 'MONTHLY',
            max_events INTEGER,
            max_users INTEGER,
            max_attendees INTEGER,
            features JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT true,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `)

        // Create indexes for subscription_plans
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscription_plans_slug ON subscription_plans(slug);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);`)

        console.log('📝 Step 34: Creating ticket_class_offers table...')

        // Create ticket class offers table for special pricing
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ticket_class_offers (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            ticket_id BIGINT NOT NULL,
            event_id BIGINT NOT NULL,
            tenant_id VARCHAR(255) NOT NULL,
            
            offer_name VARCHAR(255) NOT NULL,
            offer_type VARCHAR(50) NOT NULL DEFAULT 'PERCENTAGE',
            offer_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
            
            min_quantity INTEGER DEFAULT 1,
            max_quantity INTEGER,
            
            valid_from TIMESTAMP,
            valid_until TIMESTAMP,
            
            is_active BOOLEAN DEFAULT true,
            usage_count INTEGER DEFAULT 0,
            max_usage INTEGER,
            
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
    `)

        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_ticket_offers_ticket ON ticket_class_offers(ticket_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_ticket_offers_event ON ticket_class_offers(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_ticket_offers_active ON ticket_class_offers(is_active);`)

        console.log('📝 Step 35: Enhancing tickets table with validation fields...')

        // Add validation fields to tickets table
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE tickets ADD COLUMN IF NOT EXISTS min_purchase INTEGER DEFAULT 1;
          ALTER TABLE tickets ADD COLUMN IF NOT EXISTS max_purchase INTEGER;
          ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sales_start_date TIMESTAMP;
          ALTER TABLE tickets ADD COLUMN IF NOT EXISTS sales_end_date TIMESTAMP;
          ALTER TABLE tickets ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
        EXCEPTION
          WHEN undefined_table THEN
            RAISE NOTICE 'Table tickets does not exist yet';
        END;
      END $$;
    `)

        console.log('📝 Step 36: Creating registration_approvals table...')

        // Create registration approvals table
        await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS registration_approvals (
            id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
            registration_id VARCHAR(255) NOT NULL,
            event_id BIGINT NOT NULL,
            
            status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
            reviewed_by BIGINT,
            reviewed_at TIMESTAMP,
            review_notes TEXT,
            
            created_at TIMESTAMP DEFAULT NOW(),
            
            CONSTRAINT fk_registration_approvals_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
        );
    `)

        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_registration_approvals_registration ON registration_approvals(registration_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_registration_approvals_event ON registration_approvals(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_registration_approvals_status ON registration_approvals(status);`)

        console.log('📝 Step 37: Adding stream_url to events table...')

        // Add stream URL field to events table
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_url TEXT;
          ALTER TABLE events ADD COLUMN IF NOT EXISTS stream_enabled BOOLEAN DEFAULT false;
        EXCEPTION
          WHEN undefined_table THEN
            RAISE NOTICE 'Table events does not exist yet';
        END;
      END $$;
    `)

        console.log('📝 Step 38: Adding template_for and document_type to document_templates...')

        // Add template_for and document_type fields to document_templates
        await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS template_for VARCHAR(100);
          ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS document_type_category VARCHAR(100);
        EXCEPTION
          WHEN undefined_table THEN
            RAISE NOTICE 'Table document_templates does not exist yet';
        END;
      END $$;
    `)

        console.log('📝 Step 39: Creating sponsors table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS sponsors (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        name TEXT,
        tier TEXT DEFAULT 'BRONZE',
        logo_url TEXT,
        website TEXT,
        contact_data JSONB DEFAULT '{}',
        payment_data JSONB DEFAULT '{}',
        branding_online JSONB DEFAULT '{}',
        branding_offline JSONB DEFAULT '{}',
        event_presence JSONB DEFAULT '{}',
        giveaway_data JSONB DEFAULT '{}',
        legal_data JSONB DEFAULT '{}',
        timeline_data JSONB DEFAULT '{}',
        post_event_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_sponsors_event_id ON sponsors(event_id);`)

        console.log('📝 Step 40: Creating event_vendors table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_vendors (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        tenant_id TEXT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        budget DOUBLE PRECISION DEFAULT 0,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        contract_amount DOUBLE PRECISION DEFAULT 0,
        paid_amount DOUBLE PRECISION DEFAULT 0,
        payment_status TEXT DEFAULT 'PENDING',
        payment_due_date TIMESTAMP WITH TIME ZONE,
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
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_event_vendors_event_id ON event_vendors(event_id);`)

        console.log('📝 Step 41: Creating exhibitors table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS exhibitors (
        id TEXT PRIMARY KEY,
        event_id BIGINT NOT NULL,
        tenant_id TEXT,
        name TEXT,
        company TEXT,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        website TEXT,
        notes TEXT,
        first_name TEXT,
        last_name TEXT,
        job_title TEXT,
        business_address TEXT,
        company_description TEXT,
        products_services TEXT,
        booth_type TEXT,
        booth_option TEXT,
        booth_area TEXT,
        electrical_access BOOLEAN DEFAULT FALSE,
        display_tables BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'PENDING_CONFIRMATION',
        email_confirmed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_exhibitors_event_id ON exhibitors(event_id);`)


        console.log('📝 Step 42: Creating seat_inventory table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS seat_inventory (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        section TEXT,
        row_number TEXT,
        seat_number TEXT,
        seat_type TEXT,
        base_price DECIMAL(10,2) DEFAULT 0,
        x_coordinate DECIMAL(10,2) DEFAULT 0,
        y_coordinate DECIMAL(10,2) DEFAULT 0,
        is_available BOOLEAN DEFAULT TRUE,
        tenant_id TEXT,
        status TEXT DEFAULT 'AVAILABLE', 
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_seat_inventory_event_id ON seat_inventory(event_id);`)

        console.log('📝 Step 43: Creating floor_plan_configs table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS floor_plan_configs (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        plan_name TEXT,
        layout_data JSONB,
        total_seats INTEGER DEFAULT 0,
        sections JSONB,
        tenant_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_floor_plan_configs_event_id ON floor_plan_configs(event_id);`)

        console.log('📝 Step 44: Creating seat_pricing_rules table...')
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS seat_pricing_rules (
        id BIGSERIAL PRIMARY KEY,
        event_id BIGINT NOT NULL,
        section TEXT,
        row_pattern TEXT,
        seat_type TEXT,
        base_price DECIMAL(10,2),
        multiplier DECIMAL(5,2) DEFAULT 1.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_seat_pricing_rules_event_id ON seat_pricing_rules(event_id);`)

        console.log('📝 Step 45: Updating event_vendors schema (missing columns)...')
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS budget DOUBLE PRECISION DEFAULT 0;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS bank_name TEXT;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS account_number TEXT;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS ifsc_code TEXT;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS account_holder_name TEXT;`)
        await prisma.$executeRawUnsafe(`ALTER TABLE event_vendors ADD COLUMN IF NOT EXISTS upi_id TEXT;`)

        console.log('📝 Step 46: Creating provider portal tables (tenant-scoped)...')
        // Service Providers Table - Now tenant-scoped for company-level management
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS service_providers (
                id BIGSERIAL PRIMARY KEY,
                tenant_id VARCHAR(255) NOT NULL,
                provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
                company_name VARCHAR(255) NOT NULL,
                business_registration_number VARCHAR(100),
                tax_id VARCHAR(100),
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                website VARCHAR(255),
                address_line1 VARCHAR(255),
                address_line2 VARCHAR(255),
                city VARCHAR(100),
                state VARCHAR(100),
                country VARCHAR(100) DEFAULT 'India',
                postal_code VARCHAR(20),
                description TEXT,
                year_established INTEGER,
                team_size VARCHAR(50),
                verification_status VARCHAR(50) DEFAULT 'PENDING',
                verification_documents JSONB DEFAULT '[]'::jsonb,
                verification_notes TEXT,
                verified_at TIMESTAMP,
                verified_by BIGINT,
                is_active BOOLEAN DEFAULT true,
                rating DECIMAL(3,2) DEFAULT 0.00,
                total_reviews INTEGER DEFAULT 0,
                total_bookings INTEGER DEFAULT 0,
                completed_bookings INTEGER DEFAULT 0,
                cancelled_bookings INTEGER DEFAULT 0,
                total_revenue DECIMAL(15,2) DEFAULT 0.00,
                logo_url VARCHAR(500),
                banner_url VARCHAR(500),
                gallery JSONB DEFAULT '[]'::jsonb,
                commission_rate DECIMAL(5,2) DEFAULT 15.00,
                payment_terms VARCHAR(50) DEFAULT 'NET_30',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(tenant_id, email)
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_providers_tenant ON service_providers(tenant_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_providers_type ON service_providers(provider_type);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_providers_status ON service_providers(verification_status);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_providers_city ON service_providers(city);`)

        // Provider Categories
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS provider_categories (
                id BIGSERIAL PRIMARY KEY,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                category VARCHAR(100) NOT NULL,
                subcategory VARCHAR(100),
                is_primary BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(provider_id, category, subcategory)
            );
        `)

        // Provider Services
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS provider_services (
                id BIGSERIAL PRIMARY KEY,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                service_name VARCHAR(255) NOT NULL,
                description TEXT,
                base_price DECIMAL(15,2),
                pricing_model VARCHAR(50) DEFAULT 'FIXED',
                currency VARCHAR(10) DEFAULT 'INR',
                min_order_value DECIMAL(15,2),
                max_capacity INTEGER,
                features JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                display_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)

        // Vendor Bookings
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS vendor_bookings (
                id BIGSERIAL PRIMARY KEY,
                booking_number VARCHAR(50) UNIQUE NOT NULL,
                event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                tenant_id VARCHAR(255) NOT NULL,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id),
                service_id BIGINT REFERENCES provider_services(id),
                booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
                service_date_from DATE NOT NULL,
                service_date_to DATE NOT NULL,
                attendee_count INTEGER,
                quoted_amount DECIMAL(15,2) NOT NULL,
                negotiated_amount DECIMAL(15,2),
                final_amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                commission_rate DECIMAL(5,2) NOT NULL,
                commission_amount DECIMAL(15,2) NOT NULL,
                provider_payout DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                payment_status VARCHAR(50) DEFAULT 'UNPAID',
                terms_and_conditions TEXT,
                special_requirements TEXT,
                contract_url VARCHAR(500),
                signed_at TIMESTAMP,
                created_by BIGINT,
                approved_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event ON vendor_bookings(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_vendor_bookings_provider ON vendor_bookings(provider_id);`)

        // Sponsor Deals
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS sponsor_deals (
                id BIGSERIAL PRIMARY KEY,
                deal_number VARCHAR(50) UNIQUE NOT NULL,
                event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                tenant_id VARCHAR(255) NOT NULL,
                sponsor_id BIGINT NOT NULL REFERENCES service_providers(id),
                sponsorship_tier VARCHAR(50),
                sponsorship_package VARCHAR(255),
                benefits JSONB DEFAULT '[]'::jsonb,
                deliverables JSONB DEFAULT '[]'::jsonb,
                sponsorship_amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                commission_rate DECIMAL(5,2) NOT NULL,
                commission_amount DECIMAL(15,2) NOT NULL,
                sponsor_payout DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'PROPOSED',
                payment_status VARCHAR(50) DEFAULT 'UNPAID',
                contract_url VARCHAR(500),
                signed_at TIMESTAMP,
                visibility_metrics JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_sponsor_deals_event ON sponsor_deals(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_sponsor_deals_sponsor ON sponsor_deals(sponsor_id);`)

        // Exhibitor Bookings
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS exhibitor_bookings (
                id BIGSERIAL PRIMARY KEY,
                booking_number VARCHAR(50) UNIQUE NOT NULL,
                event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                tenant_id VARCHAR(255) NOT NULL,
                exhibitor_id BIGINT NOT NULL REFERENCES service_providers(id),
                booth_number VARCHAR(50),
                booth_size VARCHAR(50),
                booth_type VARCHAR(50),
                booth_location VARCHAR(255),
                floor_plan_position JSONB,
                booth_rental_fee DECIMAL(15,2) NOT NULL,
                additional_services JSONB DEFAULT '[]'::jsonb,
                total_amount DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                commission_rate DECIMAL(5,2) NOT NULL,
                commission_amount DECIMAL(15,2) NOT NULL,
                exhibitor_payout DECIMAL(15,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'PENDING',
                payment_status VARCHAR(50) DEFAULT 'UNPAID',
                setup_date TIMESTAMP,
                teardown_date TIMESTAMP,
                special_requirements TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_event ON exhibitor_bookings(event_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_exhibitor ON exhibitor_bookings(exhibitor_id);`)

        // Provider Reviews
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS provider_reviews (
                id BIGSERIAL PRIMARY KEY,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                booking_id BIGINT,
                booking_type VARCHAR(50),
                tenant_id VARCHAR(255) NOT NULL,
                reviewer_id BIGINT,
                overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
                quality_rating INTEGER,
                communication_rating INTEGER,
                value_rating INTEGER,
                professionalism_rating INTEGER,
                review_title VARCHAR(255),
                review_text TEXT,
                pros TEXT,
                cons TEXT,
                images JSONB DEFAULT '[]'::jsonb,
                is_verified BOOLEAN DEFAULT false,
                is_featured BOOLEAN DEFAULT false,
                is_public BOOLEAN DEFAULT true,
                provider_response TEXT,
                provider_response_date TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON provider_reviews(provider_id);`)

        // Commission Transactions
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS commission_transactions (
                id BIGSERIAL PRIMARY KEY,
                transaction_number VARCHAR(50) UNIQUE NOT NULL,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id),
                booking_id BIGINT,
                booking_type VARCHAR(50),
                event_id BIGINT,
                tenant_id VARCHAR(255) NOT NULL,
                booking_amount DECIMAL(15,2) NOT NULL,
                commission_rate DECIMAL(5,2) NOT NULL,
                commission_amount DECIMAL(15,2) NOT NULL,
                provider_payout DECIMAL(15,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'INR',
                status VARCHAR(50) DEFAULT 'PENDING',
                payment_method VARCHAR(50),
                payment_reference VARCHAR(255),
                payment_gateway_fee DECIMAL(15,2) DEFAULT 0.00,
                paid_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_commission_transactions_provider ON commission_transactions(provider_id);`)

        // Provider Users
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS provider_users (
                id BIGSERIAL PRIMARY KEY,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                user_id BIGINT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
                role VARCHAR(50) DEFAULT 'MEMBER',
                permissions JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT true,
                invited_by BIGINT,
                invited_at TIMESTAMP DEFAULT NOW(),
                joined_at TIMESTAMP,
                UNIQUE(provider_id, user_id)
            );
        `)

        // Saved Providers
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS saved_providers (
                id BIGSERIAL PRIMARY KEY,
                tenant_id VARCHAR(255) NOT NULL,
                provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
                saved_by BIGINT,
                notes TEXT,
                tags JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(tenant_id, provider_id)
            );
        `)

        console.log('✅ Provider portal tables created successfully')

        // ============ LOOKUP MANAGEMENT TABLES ============
        console.log('📝 Creating Lookup Management tables...')

        // Lookup Categories Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS lookup_categories (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name VARCHAR(255) NOT NULL,
                code VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                is_global BOOLEAN DEFAULT true,
                is_system BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)

        // Lookup Values Table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS lookup_values (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                category_id VARCHAR(255) NOT NULL,
                tenant_id VARCHAR(255),
                value VARCHAR(255) NOT NULL,
                label VARCHAR(255) NOT NULL,
                description TEXT,
                color_code VARCHAR(50),
                icon VARCHAR(100),
                sort_order INTEGER DEFAULT 0,
                is_active BOOLEAN DEFAULT true,
                is_default BOOLEAN DEFAULT false,
                is_system BOOLEAN DEFAULT false,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_lookup_values_category ON lookup_values(category_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_lookup_values_tenant ON lookup_values(tenant_id);`)

        // Lookup Audit Log
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS lookup_audit_log (
                id BIGSERIAL PRIMARY KEY,
                category_id VARCHAR(255),
                value_id VARCHAR(255),
                action VARCHAR(50) NOT NULL,
                old_data JSONB,
                new_data JSONB,
                changed_by BIGINT,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `)

        // Seed default lookup categories if empty
        const existingCategories = await prisma.$queryRaw<any[]>`SELECT COUNT(*) as count FROM lookup_categories`
        if (existingCategories[0]?.count == 0) {
            console.log('📝 Seeding default lookup categories...')
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_categories (id, name, code, description, is_global, is_system) VALUES
                ('cat_event_type', 'Event Types', 'EVENT_TYPE', 'Types of events', true, true),
                ('cat_event_category', 'Event Categories', 'EVENT_CATEGORY', 'Event categories', true, true),
                ('cat_ticket_type', 'Ticket Types', 'TICKET_TYPE', 'Types of tickets', true, true),
                ('cat_payment_method', 'Payment Methods', 'PAYMENT_METHOD', 'Payment methods', true, true),
                ('cat_currency', 'Currencies', 'CURRENCY', 'Supported currencies', true, true),
                ('cat_country', 'Countries', 'COUNTRY', 'Countries list', true, true),
                ('cat_vendor_category', 'Vendor Categories', 'VENDOR_CATEGORY', 'Vendor service categories', true, false),
                ('cat_sponsor_tier', 'Sponsor Tiers', 'SPONSOR_TIER', 'Sponsorship tiers', true, false)
                ON CONFLICT (code) DO NOTHING;
            `)

            // Seed some default values
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_values (id, category_id, value, label, sort_order, is_active, is_system) VALUES
                ('val_conference', 'cat_event_type', 'CONFERENCE', 'Conference', 1, true, true),
                ('val_workshop', 'cat_event_type', 'WORKSHOP', 'Workshop', 2, true, true),
                ('val_seminar', 'cat_event_type', 'SEMINAR', 'Seminar', 3, true, true),
                ('val_wedding', 'cat_event_type', 'WEDDING', 'Wedding', 4, true, true),
                ('val_corporate', 'cat_event_type', 'CORPORATE', 'Corporate Event', 5, true, true),
                ('val_birthday', 'cat_event_type', 'BIRTHDAY', 'Birthday Party', 6, true, true),
                ('val_catering', 'cat_vendor_category', 'CATERING', 'Catering', 1, true, false),
                ('val_decoration', 'cat_vendor_category', 'DECORATION', 'Decoration', 2, true, false),
                ('val_photography', 'cat_vendor_category', 'PHOTOGRAPHY', 'Photography', 3, true, false),
                ('val_entertainment', 'cat_vendor_category', 'ENTERTAINMENT', 'Entertainment', 4, true, false),
                ('val_platinum', 'cat_sponsor_tier', 'PLATINUM', 'Platinum', 1, true, false),
                ('val_gold', 'cat_sponsor_tier', 'GOLD', 'Gold', 2, true, false),
                ('val_silver', 'cat_sponsor_tier', 'SILVER', 'Silver', 3, true, false),
                ('val_bronze', 'cat_sponsor_tier', 'BRONZE', 'Bronze', 4, true, false)
                ON CONFLICT DO NOTHING;
            `)
        }

        console.log('✅ Lookup Management tables created successfully')

        // ============ SUBSCRIPTION PLANS TABLE ============
        console.log('📝 Creating Subscription Plans table...')
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS subscription_plans (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name VARCHAR(255) NOT NULL,
                slug VARCHAR(100) NOT NULL UNIQUE,
                description TEXT,
                price DECIMAL(15,2) DEFAULT 0,
                currency VARCHAR(10) DEFAULT 'USD',
                billing_period VARCHAR(50) DEFAULT 'MONTHLY',
                max_events INTEGER,
                max_users INTEGER,
                max_attendees INTEGER,
                max_storage_gb INTEGER,
                features JSONB DEFAULT '[]'::jsonb,
                modules JSONB DEFAULT '{}'::jsonb,
                is_active BOOLEAN DEFAULT true,
                is_featured BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                stripe_price_id VARCHAR(255),
                razorpay_plan_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `)

        // Add modules column if not exists
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '{}'::jsonb;
            EXCEPTION WHEN duplicate_column THEN NULL;
            END $$;
        `)

        console.log('✅ Subscription Plans table created successfully')

        // ============ FINANCE MIGRATION TABLES ============
        console.log('📝 Creating Invoice Tax Snapshots table for finance migration...')
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS invoice_tax_snapshots (
                id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                invoice_id VARCHAR(255) NOT NULL,
                line_item_id VARCHAR(255),
                tax_id VARCHAR(255),
                tax_source VARCHAR(50) NOT NULL,
                tax_name VARCHAR(255) NOT NULL,
                tax_type VARCHAR(50) NOT NULL,
                tax_rate DOUBLE PRECISION NOT NULL,
                base_amount DOUBLE PRECISION NOT NULL,
                tax_amount DOUBLE PRECISION NOT NULL,
                is_compound BOOLEAN DEFAULT false,
                snapshot_date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `)

        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_tax_snapshots_invoice ON invoice_tax_snapshots(invoice_id);`)
        await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_invoice_tax_snapshots_tax ON invoice_tax_snapshots(tax_id);`)

        // Add finance_settings enhanced columns
        console.log('📝 Adding enhanced finance settings columns...')
        await prisma.$executeRawUnsafe(`
            DO $$ BEGIN
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS supported_currencies TEXT[] DEFAULT ARRAY['USD'];
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS invoice_sequence INTEGER DEFAULT 1;
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS receipt_sequence INTEGER DEFAULT 1;
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS auto_apply_tax BOOLEAN DEFAULT true;
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS tax_calculation_mode VARCHAR(20) DEFAULT 'exclusive';
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS allow_tax_override BOOLEAN DEFAULT false;
                ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT false;
            EXCEPTION WHEN undefined_table THEN NULL;
            END $$;
        `)

        console.log('✅ Finance Migration tables created successfully')
        console.log('✅ Self-healing schema update complete (including provider portal system).')
        return true
    } catch (error: any) {
        console.error('❌ Self-healing schema failed:', error)
        console.error('❌ Error message:', error.message)
        console.error('❌ Error stack:', error.stack)
        console.error('❌ Error code:', error.code)
        throw error // Re-throw to get full details in API response
    }
}
