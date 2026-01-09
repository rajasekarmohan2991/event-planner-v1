import prisma from '@/lib/prisma'

export async function ensureSchema() {
  console.log('🔧 Running self-healing schema update...')
  try {
    // Test database connection first
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')
    
    console.log('📝 Step 1: Updating tenants table...')
    // 0. Tenants Table - Add country column (wrapped in DO block to handle missing table)
    await prisma.$executeRawUnsafe(`
      DO $$ 
      BEGIN 
          BEGIN
              ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'US';
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
              ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';
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
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'NOT_CHECKED_IN';
                ALTER TABLE registrations ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMP WITH TIME ZONE;
            EXCEPTION
                WHEN undefined_table THEN
                    RAISE NOTICE 'Table registrations does not exist yet';
            END;
        END $$;
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

    // 15. Add payment_terms, sent_at, sent_to columns to invoices table if exists
    await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN 
            BEGIN
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_terms INTEGER DEFAULT 30;
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP;
                ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sent_to TEXT;
            EXCEPTION
                WHEN undefined_table THEN
                    RAISE NOTICE 'Table invoices does not exist yet';
            END;
        END $$;
    `)

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

    console.log('✅ Self-healing schema update complete (including finance tables and signatures).')
    return true
  } catch (error: any) {
    console.error('❌ Self-healing schema failed:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error code:', error.code)
    throw error // Re-throw to get full details in API response
  }
}
