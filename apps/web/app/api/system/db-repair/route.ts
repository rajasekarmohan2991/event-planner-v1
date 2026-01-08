import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');

    // Support both the original and the one user preferred
    const validKeys = ['fix_finance_tables_2026', 'fix_finance_now', 'repair_db'];
    if (!key || !validKeys.includes(key)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results: string[] = [];

    async function safeExecute(name: string, sql: string) {
        try {
            await prisma.$executeRawUnsafe(sql);
            results.push(`✅ ${name} completed successfully`);
        } catch (e: any) {
            console.error(`Error during ${name}:`, e.message);
            results.push(`⚠️ ${name} skipped: ${e.message}`);
        }
    }

    // 1. Fix Tenant Table - Add columns individually to avoid complete failure if one exists
    await safeExecute('Add Tenant logo', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo" TEXT;');
    await safeExecute('Add Tenant digital_signature_url', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "digital_signature_url" TEXT;');
    await safeExecute('Add Tenant currency', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT \'USD\';');
    await safeExecute('Add Tenant metadata', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB;');
    await safeExecute('Add Tenant primaryColor', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;');
    await safeExecute('Add Tenant secondaryColor', 'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;');

    // 2. Create TaxStructure
    await safeExecute('Create tax_structures table', `
        CREATE TABLE IF NOT EXISTS "tax_structures" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "rate" DOUBLE PRECISION NOT NULL,
            "description" TEXT,
            "is_default" BOOLEAN NOT NULL DEFAULT false,
            "tenant_id" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "tax_structures_pkey" PRIMARY KEY ("id")
        );
    `);

    // 3. Create Invoices
    await safeExecute('Create invoices table', `
        CREATE TABLE IF NOT EXISTS "invoices" (
            "id" TEXT NOT NULL,
            "tenant_id" TEXT NOT NULL,
            "number" TEXT NOT NULL,
            "date" TIMESTAMP(3) NOT NULL,
            "due_date" TIMESTAMP(3) NOT NULL,
            "recipientType" TEXT NOT NULL,
            "recipient_name" TEXT NOT NULL,
            "currency" TEXT DEFAULT 'USD',
            "status" TEXT DEFAULT 'DRAFT',
            "subtotal" DOUBLE PRECISION DEFAULT 0,
            "grand_total" DOUBLE PRECISION DEFAULT 0,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
        );
    `);

    // 4. Create Invoice Items
    await safeExecute('Create invoice_line_items table', `
        CREATE TABLE IF NOT EXISTS "invoice_line_items" (
            "id" TEXT NOT NULL,
            "invoice_id" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "quantity" INTEGER NOT NULL DEFAULT 1,
            "unit_price" DOUBLE PRECISION NOT NULL,
            "total" DOUBLE PRECISION NOT NULL,
            CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
        );
    `);

    return NextResponse.json({
        success: true,
        message: 'Database repair attempted in granular mode',
        timestamp: new Date().toISOString(),
        results
    });
}
