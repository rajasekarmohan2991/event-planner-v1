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

        console.log('🌱 Starting lookup data seeding...')
        const results: string[] = []

        // 1. Create lookup_categories table if not exists
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

        // 2. Create lookup_values table if not exists
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS lookup_values (
                id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
                category_id TEXT NOT NULL REFERENCES lookup_categories(id) ON DELETE CASCADE,
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
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(category_id, value, tenant_id)
            )
        `)
        results.push('✅ lookup_values table ensured')

        // 3. Create lookup_audit_log table if not exists
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

        // 4. Insert categories
        const categories = [
            {
                id: 'cmkl3z1of005qd8yckzh5kpkh',
                name: 'Template For',
                code: 'template_for',
                description: 'Entity types for document templates'
            },
            {
                id: 'cmkl3z1of005rd8yckzh5kpki',
                name: 'Document Type',
                code: 'document_type',
                description: 'Types of legal documents'
            },
            {
                id: 'cmkl3z1of005sd8yckzh5kpkj',
                name: 'Event Category',
                code: 'event_category',
                description: 'Categories for events'
            }
        ]

        for (const cat of categories) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_categories (id, name, code, description, is_global, is_system)
                VALUES ($1, $2, $3, $4, TRUE, TRUE)
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    updated_at = NOW()
            `, cat.id, cat.name, cat.code, cat.description)
            results.push(`✅ Category: ${cat.name}`)
        }

        // 5. Insert template_for values
        const templateForValues = [
            { value: 'VENDOR', label: 'Vendor', sortOrder: 1 },
            { value: 'SPONSOR', label: 'Sponsor', sortOrder: 2 },
            { value: 'EXHIBITOR', label: 'Exhibitor', sortOrder: 3 },
            { value: 'SPEAKER', label: 'Speaker', sortOrder: 4 },
            { value: 'ATTENDEE', label: 'Attendee', sortOrder: 5 },
            { value: 'STAFF', label: 'Staff', sortOrder: 6 }
        ]

        for (const val of templateForValues) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_values (category_id, value, label, sort_order, is_active, is_system)
                VALUES ('cmkl3z1of005qd8yckzh5kpkh', $1, $2, $3, TRUE, TRUE)
                ON CONFLICT (category_id, value, tenant_id) DO UPDATE SET
                    label = EXCLUDED.label,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW()
            `, val.value, val.label, val.sortOrder)
            results.push(`  ✅ Template For: ${val.label}`)
        }

        // 6. Insert document_type values
        const documentTypeValues = [
            { value: 'TERMS', label: 'Terms & Conditions', sortOrder: 1 },
            { value: 'AGREEMENT', label: 'Agreement', sortOrder: 2 },
            { value: 'CONTRACT', label: 'Contract', sortOrder: 3 },
            { value: 'NDA', label: 'Non-Disclosure Agreement', sortOrder: 4 },
            { value: 'WAIVER', label: 'Liability Waiver', sortOrder: 5 }
        ]

        for (const val of documentTypeValues) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO lookup_values (category_id, value, label, sort_order, is_active, is_system)
                VALUES ('cmkl3z1of005rd8yckzh5kpki', $1, $2, $3, TRUE, TRUE)
                ON CONFLICT (category_id, value, tenant_id) DO UPDATE SET
                    label = EXCLUDED.label,
                    sort_order = EXCLUDED.sort_order,
                    updated_at = NOW()
            `, val.value, val.label, val.sortOrder)
            results.push(`  ✅ Document Type: ${val.label}`)
        }

        // 7. Verify data
        const templateForCount = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*)::int as count 
            FROM lookup_values lv
            JOIN lookup_categories lc ON lv.category_id = lc.id
            WHERE lc.code = 'template_for'
        `

        results.push(`\n📊 Final count: ${templateForCount[0]?.count || 0} template_for values`)

        return NextResponse.json({
            success: true,
            message: 'Lookup data seeded successfully',
            results
        })

    } catch (error: any) {
        console.error('❌ Seed error:', error)
        return NextResponse.json({
            error: 'Failed to seed lookup data',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
