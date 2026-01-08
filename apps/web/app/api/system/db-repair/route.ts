
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    // Simple protection
    if (key !== 'fix_finance_now') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const migrations = [
        // 1. Fix Tenant Table (Now confirmed as "tenants")
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "digital_signature_url" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#3B82F6';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#10B981';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT DEFAULT 'MM/DD/YYYY';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'en';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'TRIAL';`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "maxEvents" INTEGER DEFAULT 10;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT 5;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "maxStorage" INTEGER DEFAULT 1024;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emailFromName" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emailFromAddress" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "emailReplyTo" TEXT;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "features" JSONB;`,
        `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "metadata" JSONB;`,

        // 2. Fix Event/Speaker Text Fields (Truncation Issue)
        `ALTER TABLE "events" ALTER COLUMN "description" TYPE TEXT;`,
        `ALTER TABLE "events" ALTER COLUMN "termsAndConditions" TYPE TEXT;`,
        `ALTER TABLE "events" ALTER COLUMN "disclaimer" TYPE TEXT;`,
        `ALTER TABLE "speakers" ALTER COLUMN "bio" TYPE TEXT;`,

        // 3. Create TaxStructure Table
        `CREATE TABLE IF NOT EXISTS "tax_structures" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "rate" DOUBLE PRECISION NOT NULL,
            "description" TEXT,
            "is_default" BOOLEAN NOT NULL DEFAULT false,
            "tenant_id" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "tax_structures_pkey" PRIMARY KEY ("id")
        );`,

        // 3b. FK for TaxStructure
        `DO $$ BEGIN
             ALTER TABLE "tax_structures" ADD CONSTRAINT "tax_structures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        // 4. Create Invoice Table
        `CREATE TABLE IF NOT EXISTS "invoices" (
            "id" TEXT NOT NULL,
            "tenant_id" TEXT NOT NULL,
            "event_id" BIGINT,
            "number" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "due_date" TIMESTAMP(3) NOT NULL,
            "recipientType" TEXT NOT NULL,
            "recipient_id" TEXT,
            "recipient_name" TEXT NOT NULL,
            "recipient_email" TEXT,
            "recipient_address" TEXT,
            "recipient_tax_id" TEXT,
            "currency" TEXT NOT NULL DEFAULT 'USD',
            "status" TEXT NOT NULL DEFAULT 'DRAFT',
            "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "tax_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "discount_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "grand_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "notes" TEXT,
            "terms" TEXT,
            "is_signed" BOOLEAN NOT NULL DEFAULT false,
            "signature_url" TEXT,
            "signed_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
        );`,

        // 4b. FKs for Invoice
        `CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_id_number_key" ON "invoices"("tenant_id", "number");`,

        `DO $$ BEGIN
             ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        `DO $$ BEGIN
             ALTER TABLE "invoices" ADD CONSTRAINT "invoices_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        // 5. Create InvoiceLineItem Table
        `CREATE TABLE IF NOT EXISTS "invoice_line_items" (
            "id" TEXT NOT NULL,
            "invoice_id" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL DEFAULT 1,
            "unit_price" DOUBLE PRECISION NOT NULL,
            "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "total" DOUBLE PRECISION NOT NULL,
            CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
        );`,

        `DO $$ BEGIN
             ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        // 6. Create Payment Table
        `CREATE TABLE IF NOT EXISTS "payments" (
            "id" TEXT NOT NULL,
            "invoice_id" TEXT NOT NULL,
            "amount" DOUBLE PRECISION NOT NULL,
            "method" TEXT NOT NULL,
            "reference" TEXT,
            "notes" TEXT,
            "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "recorded_by" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
        );`,

        `DO $$ BEGIN
             ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        // 7. Create Receipt Table
        `CREATE TABLE IF NOT EXISTS "receipts" (
            "id" TEXT NOT NULL,
            "payment_id" TEXT NOT NULL,
            "invoice_id" TEXT NOT NULL,
            "number" TEXT NOT NULL,
            "url" TEXT,
            "sent_to" TEXT,
            "sent_at" TIMESTAMP(3),
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
        );`,

        `DO $$ BEGIN
             ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`,

        `DO $$ BEGIN
             ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        EXCEPTION
             WHEN duplicate_object THEN null;
        END $$;`
    ];

    let results = [];
    let errors = [];

    for (const sql of migrations) {
        try {
            await prisma.$executeRawUnsafe(sql);
            results.push({ status: 'success', sql: sql.substring(0, 50) + '...' });
        } catch (e: any) {
            console.error("Migration failed:", e);
            // Ignore "column already exists" errors
            if (e.message.includes('already exists')) {
                results.push({ status: 'skipped (exists)', sql: sql.substring(0, 50) + '...' });
            } else {
                errors.push({ sql: sql.substring(0, 50) + '...', error: e.message });
            }
        }
    }

    const html = `
    <html>
      <head>
        <title>Database Repair Tool</title>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.5; }
          .success { color: green; }
          .error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
          .skipped { color: gray; }
          h1 { border-bottom: 2px solid #eee; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>Database Repair Report</h1>
        
        ${errors.length > 0 ? `
          <div class="error">
            <h2>❌ Errors Found</h2>
            <ul>
              ${errors.map(e => `<li><strong>${e.error}</strong><br><code>${e.sql}</code></li>`).join('')}
            </ul>
          </div>
        ` : `
          <div class="success">
            <h2>✅ Success! Database Repaired.</h2>
            <p>All missing tables and columns have been added.</p>
          </div>
        `}

        <h3>Migration Log:</h3>
        <ul>
          ${results.map(r => `<li class="${r.status === 'success' ? 'success' : 'skipped'}">[${r.status}] ${r.sql}</li>`).join('')}
        </ul>

        <br>
        <a href="/auth/login" style="display: inline-block; padding: 10px 20px; background: blue; color: white; text-decoration: none; border-radius: 5px;">Go to Login</a>
      </body>
    </html>
    `;

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
