import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

// PUT /api/admin/lookups/[id] - Update lookup value
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = params
    const body = await req.json()
    const {
      label,
      description,
      colorCode,
      icon,
      sortOrder,
      isActive,
      isDefault,
      metadata
    } = body

    // Get old data for audit
    const oldData = await db.query(
      `SELECT * FROM lookup_values WHERE id = $1`,
      [id]
    )

    if (!oldData.rows[0]) {
      return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
    }

    // Check if system-protected
    if (oldData.rows[0].is_system) {
      return NextResponse.json(
        { error: 'Cannot modify system-protected lookup values' },
        { status: 403 }
      )
    }

    // Update lookup value
    const result = await db.query(
      `UPDATE lookup_values SET
        label = COALESCE($1, label),
        description = COALESCE($2, description),
        color_code = COALESCE($3, color_code),
        icon = COALESCE($4, icon),
        sort_order = COALESCE($5, sort_order),
        is_active = COALESCE($6, is_active),
        is_default = COALESCE($7, is_default),
        metadata = COALESCE($8, metadata),
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
      [
        label,
        description,
        colorCode,
        icon,
        sortOrder,
        isActive,
        isDefault,
        metadata ? JSON.stringify(metadata) : null,
        id
      ]
    )

    // Log audit trail
    await db.query(
      `INSERT INTO lookup_audit_log (
        category_id, value_id, action, old_data, new_data, changed_by
      ) VALUES ($1, $2, 'UPDATE', $3, $4, $5)`,
      [
        oldData.rows[0].category_id,
        id,
        JSON.stringify(oldData.rows[0]),
        JSON.stringify(result.rows[0]),
        session.user.id
      ]
    )

    return NextResponse.json({
      success: true,
      value: result.rows[0]
    })
  } catch (error: any) {
    console.error('Error updating lookup value:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/lookups/[id] - Soft delete lookup value
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = params

    // Get existing data
    const existing = await db.query(
      `SELECT * FROM lookup_values WHERE id = $1`,
      [id]
    )

    if (!existing.rows[0]) {
      return NextResponse.json({ error: 'Lookup value not found' }, { status: 404 })
    }

    // Check if system-protected
    if (existing.rows[0].is_system) {
      return NextResponse.json(
        { error: 'Cannot delete system-protected lookup values' },
        { status: 403 }
      )
    }

    // Soft delete (set is_active = false)
    await db.query(
      `UPDATE lookup_values SET is_active = false, updated_at = NOW() WHERE id = $1`,
      [id]
    )

    // Log audit trail
    await db.query(
      `INSERT INTO lookup_audit_log (
        category_id, value_id, action, old_data, changed_by
      ) VALUES ($1, $2, 'DELETE', $3, $4)`,
      [
        existing.rows[0].category_id,
        id,
        JSON.stringify(existing.rows[0]),
        session.user.id
      ]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting lookup value:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
