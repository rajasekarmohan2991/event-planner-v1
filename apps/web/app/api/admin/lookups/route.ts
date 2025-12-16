import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/admin/lookups - Get all lookup categories or values for a specific category
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const categoryCode = searchParams.get('category')
    const tenantId = searchParams.get('tenantId')

    // If category specified, return values for that category
    if (categoryCode) {
      const category = await db.query(
        `SELECT id, name, code, description FROM lookup_categories WHERE code = $1`,
        [categoryCode]
      )

      if (!category.rows[0]) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 })
      }

      const values = await db.query(
        `SELECT 
          id, value, label, description, color_code, icon, 
          sort_order, is_active, is_default, is_system, metadata
         FROM lookup_values 
         WHERE category_id = $1 
           AND (tenant_id IS NULL OR tenant_id = $2)
         ORDER BY sort_order, label`,
        [category.rows[0].id, tenantId || null]
      )

      return NextResponse.json({
        category: category.rows[0],
        values: values.rows
      })
    }

    // Otherwise, return all categories with value counts
    const categories = await db.query(
      `SELECT 
        lc.id, lc.name, lc.code, lc.description, lc.is_global, lc.is_system,
        COUNT(lv.id) as value_count
       FROM lookup_categories lc
       LEFT JOIN lookup_values lv ON lv.category_id = lc.id AND lv.is_active = true
       GROUP BY lc.id, lc.name, lc.code, lc.description, lc.is_global, lc.is_system
       ORDER BY lc.name`
    )

    return NextResponse.json({ categories: categories.rows })
  } catch (error: any) {
    console.error('Error fetching lookups:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/admin/lookups - Create new lookup value
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
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
    const category = await db.query(
      `SELECT id, is_system FROM lookup_categories WHERE code = $1`,
      [categoryCode]
    )

    if (!category.rows[0]) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    const categoryId = category.rows[0].id

    // Insert new lookup value
    const result = await db.query(
      `INSERT INTO lookup_values (
        category_id, value, label, description, color_code, icon,
        sort_order, is_active, is_default, metadata, tenant_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        categoryId,
        value,
        label,
        description || null,
        colorCode || null,
        icon || null,
        sortOrder,
        isActive,
        isDefault,
        metadata ? JSON.stringify(metadata) : null,
        tenantId || null
      ]
    )

    // Log audit trail
    await db.query(
      `INSERT INTO lookup_audit_log (category_id, value_id, action, new_data, changed_by)
       VALUES ($1, $2, 'CREATE', $3, $4)`,
      [categoryId, result.rows[0].id, JSON.stringify(result.rows[0]), session.user.id]
    )

    return NextResponse.json({
      success: true,
      value: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error creating lookup value:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
