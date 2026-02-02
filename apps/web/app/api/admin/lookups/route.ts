import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'

  // Polyfill for BigInt serialization
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }

export const dynamic = 'force-dynamic'

// GET /api/admin/lookups - Get all lookup categories or values for a specific category
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const categoryCode = searchParams.get('category')
    const tenantId = searchParams.get('tenantId')

    try {
      // If category specified, return values for that category
      if (categoryCode) {
        const category = await prisma.$queryRawUnsafe<any[]>(
          `SELECT id, name, label, description FROM lookup_groups WHERE name = $1`,
          categoryCode
        )

        if (!category || category.length === 0) {
          return NextResponse.json({ error: 'Category not found' }, { status: 404 })
        }

        const values = await prisma.$queryRawUnsafe<any[]>(
          `SELECT 
            id, value, label, description, sort_order, is_active, is_default, is_system, metadata
           FROM lookup_options 
           WHERE group_id = $1 
             AND (tenant_id IS NULL OR tenant_id = $2)
           ORDER BY sort_order, label`,
          category[0].id, tenantId || null
        )

        return NextResponse.json({
          category: category[0],
          values: values
        })
      }

      // Otherwise, return all categories with value counts
      const rawCategories = await prisma.$queryRawUnsafe<any[]>(
        `SELECT 
          lg.id, lg.name, lg.label, lg.description, lg.is_active,
          COUNT(lo.id)::int as value_count
         FROM lookup_groups lg
         LEFT JOIN lookup_options lo ON lo.group_id = lg.id AND lo.is_active = true
         GROUP BY lg.id, lg.name, lg.label, lg.description, lg.is_active
         ORDER BY lg.label`
      )

      // Map to match frontend expectations: code = name (internal), name = label (display)
      const categories = rawCategories.map(cat => ({
        id: cat.id,
        code: cat.name,  // Internal identifier (e.g., "approval_status")
        name: cat.label, // Display name (e.g., "Approval Status")
        description: cat.description,
        is_global: true,
        is_system: cat.is_active,
        value_count: cat.value_count
      }))

      return NextResponse.json({ categories })
    } catch (dbError: any) {
      // If table doesn't exist, run schema migration
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        console.log('Lookup tables missing, running schema migration...')
        await ensureSchema()
        return NextResponse.json({ categories: [], message: 'Tables created, please refresh' })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching lookups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/lookups - Create new lookup value
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const {
      categoryCode,
      value,
      label,
      description,
      colorCode,
      icon,
      sortOrder = 0,
      isActive = true,
      isDefault = false,
      metadata,
      tenantId
    } = body

    if (!categoryCode || !value || !label) {
      return NextResponse.json(
        { error: 'categoryCode, value, and label are required' },
        { status: 400 }
      )
    }

    // Get category ID
    const category = await prisma.$queryRawUnsafe<any[]>(
      `SELECT id FROM lookup_groups WHERE name = $1`,
      categoryCode
    )

    if (!category || category.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const categoryId = category[0].id

    // Insert new lookup value
    const valueId = `lo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await prisma.$executeRawUnsafe(
      `INSERT INTO lookup_options (
        id, group_id, value, label, description,
        sort_order, is_active, is_default, is_system, metadata, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, $9, $10)`,
      valueId,
      categoryId,
      value,
      label,
      description || '',
      sortOrder,
      isActive,
      isDefault,
      metadata ? JSON.stringify(metadata) : null,
      tenantId || null
    )

    // Fetch the created value
    const result = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM lookup_options WHERE id = $1`,
      valueId
    )

    // Log audit trail
    try {
      /* await prisma.$executeRawUnsafe(
        `INSERT INTO lookup_audit_log (category_id, value_id, action, new_data, changed_by)
         VALUES ($1, $2, 'CREATE', $3, $4)`,
        categoryId, valueId, JSON.stringify(result[0]), (session.user as any).id
      ) */
    } catch (auditError) {
      console.log('Audit log failed (non-critical):', auditError)
    }

    return NextResponse.json({
      success: true,
      value: result[0]
    })
  } catch (error: any) {
    console.error('Error creating lookup value:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
