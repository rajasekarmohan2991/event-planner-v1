import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key');

    // Simple protection
    if (key !== 'fix_finance_tables_2026') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const results = [];

        // 1. Fix Tenant Table
        try {
            await prisma.$executeRawUnsafe(`
        ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo" TEXT;
        ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "digital_signature_url" TEXT;
        ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
        ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
      `);
            results.push('✅ Tenant table updated');
        } catch (e: any) {
            results.push(`⚠️ Tenant update skipped: ${e.message}`);
        }

        // 2. Create TaxStructure
        try {
            await prisma.$executeRawUnsafe(`
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
            results.push('✅ TaxStructure table created');
        } catch (e: any) {
            results.push(`⚠️ TaxStructure creation skipped: ${e.message}`);
        }

        // 3. Create Invoices
        try {
            await prisma.$executeRawUnsafe(`
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
            results.push('✅ Invoices table created');
        } catch (e: any) {
            results.push(`⚠️ Invoices creation skipped: ${e.message}`);
        }

        return NextResponse.json({
            success: true,
            message: 'Database repair attempted',
            results
        });

    } catch (error: any) {
        console.error('Repair failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
