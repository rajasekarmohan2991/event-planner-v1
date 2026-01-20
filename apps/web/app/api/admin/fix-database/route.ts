import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Running comprehensive database fix...')
        const results: string[] = []

        // 1. Fix tenants table - add missing columns
        const tenantColumns = [
            { name: 'currency', type: 'TEXT', default: "'USD'" },
            { name: 'country', type: 'TEXT', default: "'US'" },
            { name: 'timezone', type: 'TEXT', default: "'UTC'" },
            { name: 'locale', type: 'TEXT', default: "'en'" },
            { name: 'date_format', type: 'TEXT', default: "'MM/DD/YYYY'" },
        ]

        for (const col of tenantColumns) {
            try {
                await prisma.$executeRawUnsafe(`
                    ALTER TABLE tenants 
                    ADD COLUMN IF NOT EXISTS ${col.name} ${col.type} DEFAULT ${col.default}
                `)
                results.push(`✅ tenants.${col.name} column ensured`)
            } catch (error: any) {
                results.push(`⚠️ tenants.${col.name}: ${error.message}`)
            }
        }

        // 2. Fix lookup tables
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS lookup_categories (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    code TEXT UNIQUE NOT NULL,
                    description TEXT,
                    is_global BOOLEAN DEFAULT TRUE,
                    is_system BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ lookup_categories table ensured')
        } catch (error: any) {
            results.push(`⚠️ lookup_categories: ${error.message}`)
        }

        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS lookup_values (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    category_id TEXT NOT NULL,
                    value TEXT NOT NULL,
                    label TEXT NOT NULL,
                    description TEXT,
                    color_code TEXT,
                    icon TEXT,
                    sort_order INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT TRUE,
                    is_default BOOLEAN DEFAULT FALSE,
                    is_system BOOLEAN DEFAULT FALSE,
                    metadata JSONB,
                    tenant_id TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ lookup_values table ensured')
        } catch (error: any) {
            results.push(`⚠️ lookup_values: ${error.message}`)
        }

        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS lookup_audit_log (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    category_id TEXT,
                    value_id TEXT,
                    action TEXT NOT NULL,
                    old_data JSONB,
                    new_data JSONB,
                    changed_by TEXT,
                    changed_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ lookup_audit_log table ensured')
        } catch (error: any) {
            results.push(`⚠️ lookup_audit_log: ${error.message}`)
        }

        // 3. Fix finance_settings table
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS finance_settings (
                    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                    tenant_id TEXT NOT NULL UNIQUE,
                    default_tax_rate DECIMAL(5,2) DEFAULT 0,
                    tax_registration_number TEXT,
                    invoice_prefix TEXT DEFAULT 'INV',
                    default_currency TEXT DEFAULT 'USD',
                    default_payment_terms INTEGER DEFAULT 30,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ finance_settings table ensured')
        } catch (error: any) {
            results.push(`⚠️ finance_settings: ${error.message}`)
        }

        // 4. Fix tax_structures table
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS tax_structures (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    rate DECIMAL(5,2) NOT NULL,
                    description TEXT,
                    is_default BOOLEAN DEFAULT FALSE,
                    is_custom BOOLEAN DEFAULT TRUE,
                    global_template_id TEXT,
                    tenant_id TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ tax_structures table ensured')
        } catch (error: any) {
            results.push(`⚠️ tax_structures: ${error.message}`)
        }

        // 5. Fix invoices table
        try {
            await prisma.$executeRawUnsafe(`
                CREATE TABLE IF NOT EXISTS invoices (
                    id TEXT PRIMARY KEY,
                    tenant_id TEXT NOT NULL,
                    event_id TEXT,
                    number TEXT NOT NULL,
                    date TIMESTAMP DEFAULT NOW(),
                    due_date TIMESTAMP,
                    payment_terms TEXT DEFAULT 'NET_30',
                    recipient_type TEXT DEFAULT 'INDIVIDUAL',
                    recipient_name TEXT,
                    recipient_email TEXT,
                    recipient_tax_id TEXT,
                    currency TEXT DEFAULT 'USD',
                    status TEXT DEFAULT 'DRAFT',
                    subtotal DECIMAL(12,2) DEFAULT 0,
                    tax_total DECIMAL(12,2) DEFAULT 0,
                    discount_total DECIMAL(12,2) DEFAULT 0,
                    grand_total DECIMAL(12,2) DEFAULT 0,
                    sent_at TIMESTAMP,
                    sent_to TEXT,
                    paid_at TIMESTAMP,
                    payment_method TEXT,
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT NOW(),
                    updated_at TIMESTAMP DEFAULT NOW()
                )
            `)
            results.push('✅ invoices table ensured')
        } catch (error: any) {
            results.push(`⚠️ invoices: ${error.message}`)
        }

        // 6. Seed lookup categories if empty
        const categoryCount = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*)::int as count FROM lookup_categories
        `
        
        if (categoryCount[0]?.count === 0) {
            const categories = [
                { id: 'cat_template_for', name: 'Template For', code: 'template_for', description: 'Entity types for document templates' },
                { id: 'cat_document_type', name: 'Document Type', code: 'document_type', description: 'Types of legal documents' },
                { id: 'cat_booth_type', name: 'Booth Type', code: 'booth_type', description: 'Categories of exhibitor booths' },
            ]

            for (const cat of categories) {
                await prisma.$executeRawUnsafe(`
                    INSERT INTO lookup_categories (id, name, code, description, is_global, is_system)
                    VALUES ($1, $2, $3, $4, TRUE, FALSE)
                    ON CONFLICT (code) DO NOTHING
                `, cat.id, cat.name, cat.code, cat.description)
            }
            results.push('✅ Seeded lookup categories')

            // Seed template_for values
            const templateForValues = [
                { value: 'VENDOR', label: 'Vendor' },
                { value: 'SPONSOR', label: 'Sponsor' },
                { value: 'EXHIBITOR', label: 'Exhibitor' },
                { value: 'SPEAKER', label: 'Speaker' },
                { value: 'ATTENDEE', label: 'Attendee' },
                { value: 'STAFF', label: 'Staff' },
            ]

            for (let i = 0; i < templateForValues.length; i++) {
                const val = templateForValues[i]
                await prisma.$executeRawUnsafe(`
                    INSERT INTO lookup_values (id, category_id, value, label, sort_order, is_active, is_system)
                    VALUES ($1, 'cat_template_for', $2, $3, $4, TRUE, FALSE)
                    ON CONFLICT DO NOTHING
                `, `lv_tf_${i}`, val.value, val.label, i + 1)
            }
            results.push('✅ Seeded template_for values')

            // Seed booth_type values
            const boothTypes = [
                { value: 'STANDARD', label: 'Standard' },
                { value: 'PREMIUM', label: 'Premium' },
                { value: 'ISLAND', label: 'Island' },
                { value: 'CUSTOM', label: 'Custom' },
            ]

            for (let i = 0; i < boothTypes.length; i++) {
                const val = boothTypes[i]
                await prisma.$executeRawUnsafe(`
                    INSERT INTO lookup_values (id, category_id, value, label, sort_order, is_active, is_system)
                    VALUES ($1, 'cat_booth_type', $2, $3, $4, TRUE, FALSE)
                    ON CONFLICT DO NOTHING
                `, `lv_bt_${i}`, val.value, val.label, i + 1)
            }
            results.push('✅ Seeded booth_type values')
        }

        // 7. Update all existing lookup values to is_system = FALSE so they can be deleted
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE lookup_values SET is_system = FALSE WHERE is_system = TRUE
            `)
            results.push('✅ Updated all lookup values to be deletable (is_system = FALSE)')
        } catch (error: any) {
            results.push(`⚠️ Update lookup values: ${error.message}`)
        }

        // 8. Verify tenants table has currency column
        const tenantCheck = await prisma.$queryRaw<any[]>`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tenants' 
            AND column_name = 'currency'
        `
        
        if (tenantCheck.length > 0) {
            results.push(`✅ Verified: tenants.currency column exists (type: ${tenantCheck[0].data_type})`)
        } else {
            results.push('❌ WARNING: tenants.currency column NOT found!')
        }

        return NextResponse.json({
            success: true,
            message: 'Database fix completed',
            results
        })

    } catch (error: any) {
        console.error('❌ Database fix error:', error)
        return NextResponse.json({
            error: 'Failed to fix database',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
