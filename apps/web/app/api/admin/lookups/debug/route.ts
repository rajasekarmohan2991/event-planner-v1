import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/admin/lookups/debug - Debug lookup issues
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔍 Debugging lookups...')

        // Check if tables exist
        const tablesCheck = await prisma.$queryRaw<any[]>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('lookup_categories', 'lookup_values', 'lookup_audit_log')
    `

        // Get categories
        const categories = await prisma.$queryRaw<any[]>`
      SELECT id, name, code, is_system, is_global 
      FROM lookup_categories
      ORDER BY name
    `

        // Get template_for values
        const templateForValues = await prisma.$queryRaw<any[]>`
      SELECT 
        lv.id,
        lv.value,
        lv.label,
        lv.description,
        lv.is_active,
        lv.is_system,
        lv.sort_order,
        lv.tenant_id
      FROM lookup_values lv
      JOIN lookup_categories lc ON lv.category_id = lc.id
      WHERE lc.code = 'template_for'
      ORDER BY lv.sort_order, lv.label
    `

        // Get all values count
        const allValuesCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*)::int as count FROM lookup_values
    `

        return NextResponse.json({
            tables: tablesCheck.map(t => t.table_name),
            categories: {
                total: categories.length,
                list: categories
            },
            templateFor: {
                total: templateForValues.length,
                values: templateForValues
            },
            totalValues: allValuesCount[0]?.count || 0,
            diagnosis: {
                tablesExist: tablesCheck.length === 3,
                hasCategories: categories.length > 0,
                hasTemplateForCategory: categories.some(c => c.code === 'template_for'),
                templateForValuesCount: templateForValues.length,
                expectedValues: 6,
                missing: 6 - templateForValues.length
            }
        })

    } catch (error: any) {
        console.error('❌ Debug error:', error)
        return NextResponse.json({
            error: 'Debug failed',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
