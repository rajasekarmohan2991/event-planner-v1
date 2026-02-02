import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/setup-all - Setup lookups AND tenant columns
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Running complete setup...')
        const results: string[] = []

        // 1. Add tenant columns
        try {
            await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='tenants' AND column_name='currency') THEN
                ALTER TABLE tenants ADD COLUMN currency TEXT DEFAULT 'INR';
            END IF;
        END $$;
      `)
            await prisma.$executeRawUnsafe(`UPDATE tenants SET currency = 'INR' WHERE currency IS NULL`)
            results.push('✅ Currency column added')
        } catch (e: any) {
            results.push(`⚠️ Currency: ${e.message.substring(0, 50)}`)
        }

        try {
            await prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name='tenants' AND column_name='country') THEN
                ALTER TABLE tenants ADD COLUMN country TEXT DEFAULT 'IN';
            END IF;
        END $$;
      `)
            await prisma.$executeRawUnsafe(`UPDATE tenants SET country = 'IN' WHERE country IS NULL`)
            results.push('✅ Country column added')
        } catch (e: any) {
            results.push(`⚠️ Country: ${e.message.substring(0, 50)}`)
        }

        // 2. Create lookup tables
        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lookup_categories (
            id TEXT PRIMARY KEY DEFAULT ('lc_' || gen_random_uuid()::text),
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE,
            description TEXT,
            is_global BOOLEAN DEFAULT TRUE,
            is_system BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
            results.push('✅ lookup_categories table created')
        } catch (e: any) {
            results.push(`⚠️ Categories table: ${e.message.substring(0, 50)}`)
        }

        try {
            await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS lookup_values (
            id TEXT PRIMARY KEY DEFAULT ('lv_' || gen_random_uuid()::text),
            category_id TEXT NOT NULL REFERENCES lookup_categories(id) ON DELETE CASCADE,
            tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT unique_category_value UNIQUE(category_id, value, tenant_id)
        )
      `)
            results.push('✅ lookup_values table created')
        } catch (e: any) {
            results.push(`⚠️ Values table: ${e.message.substring(0, 50)}`)
        }

        // 3. Insert default category
        try {
            await prisma.$executeRawUnsafe(`
        INSERT INTO lookup_categories (id, name, code, description, is_global, is_system) VALUES
        ('cmkl3z1of005qd8yckzh5kpkh', 'Template For', 'template_for', 'Entity types for document templates', TRUE, TRUE)
        ON CONFLICT (code) DO NOTHING
      `)
            results.push('✅ Template For category created')
        } catch (e: any) {
            results.push(`⚠️ Category insert: ${e.message.substring(0, 50)}`)
        }

        // 4. Insert default values
        const values = [
            ['VENDOR', 'VENDOR', 'Vendor agreements'],
            ['SPONSOR', 'SPONSOR', 'Sponsorship agreements'],
            ['EXHIBITOR', 'EXHIBITOR', 'Exhibitor agreements'],
            ['SPEAKER', 'SPEAKER', 'Speaker contracts'],
            ['ATTENDEE', 'ATTENDEE', 'Attendee terms'],
            ['STAFF', 'STAFF', 'Staff agreements']
        ]

        for (const [value, label, desc] of values) {
            try {
                await prisma.$executeRawUnsafe(`
          INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, sort_order)
          VALUES ('cmkl3z1of005qd8yckzh5kpkh', '${value}', '${label}', '${desc}', TRUE, TRUE, 0)
          ON CONFLICT (category_id, value, tenant_id) DO NOTHING
        `)
            } catch (e) {
                // Ignore duplicates
            }
        }
        results.push('✅ Template For values inserted')

        // Verify
        const categories = await prisma.$queryRaw<any[]>`
      SELECT id, name, code FROM lookup_categories LIMIT 10
    `

        const valueCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM lookup_values
    `

        return NextResponse.json({
            success: true,
            message: 'Setup complete',
            results,
            stats: {
                categories: categories.length,
                values: valueCount[0]?.count || 0
            }
        })

    } catch (error: any) {
        console.error('❌ Setup error:', error)
        return NextResponse.json({
            error: 'Setup failed',
            details: error.message
        }, { status: 500 })
    }
}
