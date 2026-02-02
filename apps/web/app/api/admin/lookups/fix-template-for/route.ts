import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/admin/lookups/fix-template-for - Force fix Template For values
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Fixing Template For values...')
        const results: string[] = []

        // 1. Ensure category exists
        try {
            await prisma.$executeRawUnsafe(`
        INSERT INTO lookup_categories (id, name, code, description, is_global, is_system) 
        VALUES ('cmkl3z1of005qd8yckzh5kpkh', 'Template For', 'template_for', 'Entity types for document templates', TRUE, TRUE)
        ON CONFLICT (code) DO UPDATE SET 
          name = EXCLUDED.name,
          description = EXCLUDED.description
      `)
            results.push('✅ Category ensured')
        } catch (e: any) {
            results.push(`⚠️ Category: ${e.message}`)
        }

        // 2. Delete existing values to start fresh
        try {
            await prisma.$executeRawUnsafe(`
        DELETE FROM lookup_values 
        WHERE category_id = 'cmkl3z1of005qd8yckzh5kpkh'
      `)
            results.push('✅ Cleared old values')
        } catch (e: any) {
            results.push(`⚠️ Clear: ${e.message}`)
        }

        // 3. Insert all 6 values
        const values = [
            { value: 'VENDOR', label: 'Vendor', desc: 'Vendor agreements and contracts', order: 1 },
            { value: 'SPONSOR', label: 'Sponsor', desc: 'Sponsorship agreements', order: 2 },
            { value: 'EXHIBITOR', label: 'Exhibitor', desc: 'Exhibitor agreements', order: 3 },
            { value: 'SPEAKER', label: 'Speaker', desc: 'Speaker contracts', order: 4 },
            { value: 'ATTENDEE', label: 'Attendee', desc: 'Attendee terms and conditions', order: 5 },
            { value: 'STAFF', label: 'Staff', desc: 'Staff agreements', order: 6 }
        ]

        let inserted = 0
        for (const v of values) {
            try {
                await prisma.$executeRawUnsafe(`
          INSERT INTO lookup_values (
            category_id, 
            value, 
            label, 
            description, 
            is_system, 
            is_active, 
            is_default,
            sort_order,
            tenant_id
          ) VALUES (
            'cmkl3z1of005qd8yckzh5kpkh',
            '${v.value}',
            '${v.label}',
            '${v.desc}',
            TRUE,
            TRUE,
            FALSE,
            ${v.order},
            NULL
          )
        `)
                inserted++
            } catch (e: any) {
                results.push(`❌ Failed to insert ${v.value}: ${e.message}`)
            }
        }
        results.push(`✅ Inserted ${inserted}/6 values`)

        // 4. Verify
        const finalValues = await prisma.$queryRaw<any[]>`
      SELECT value, label, sort_order, is_active
      FROM lookup_values
      WHERE category_id = 'cmkl3z1of005qd8yckzh5kpkh'
      ORDER BY sort_order
    `

        return NextResponse.json({
            success: true,
            message: 'Template For values fixed',
            results,
            inserted,
            finalCount: finalValues.length,
            values: finalValues
        })

    } catch (error: any) {
        console.error('❌ Fix error:', error)
        return NextResponse.json({
            error: 'Fix failed',
            details: error.message
        }, { status: 500 })
    }
}
