import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions as any);
        
        // Only allow SUPER_ADMIN to run this
        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 });
        }

        console.log('🔧 Creating finance tables...');

        // Create payouts table
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
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_payouts_tenant ON payouts(tenant_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_payouts_event ON payouts(event_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
        `);

        console.log('✅ Payouts table created');

        // Create charges table
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
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_charges_tenant ON charges(tenant_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_charges_event ON charges(event_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_charges_status ON charges(status);
        `);

        console.log('✅ Charges table created');

        // Create credits table
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
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_credits_tenant ON credits(tenant_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_credits_event ON credits(event_id);
        `);

        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS idx_credits_status ON credits(status);
        `);

        console.log('✅ Credits table created');

        // Create finance_settings table
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
        `);

        console.log('✅ Finance Settings table created');

        return NextResponse.json({
            success: true,
            message: 'All finance tables created successfully',
            tables: ['payouts', 'charges', 'credits', 'finance_settings']
        });

    } catch (error: any) {
        console.error('❌ Failed to create finance tables:', error);
        return NextResponse.json({
            error: 'Failed to create finance tables',
            details: error.message
        }, { status: 500 });
    }
}
