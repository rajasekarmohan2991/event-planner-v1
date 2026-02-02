import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { checkPermissionInRoute } from '@/lib/permission-middleware'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/admin/refunds/[id] - Update refund status (Admin/Super Admin only)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check permission
    const permissionCheck = await checkPermissionInRoute('payments.refund', 'Update Refund')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const refundId = BigInt(params.id)

    // Get current refund
    const currentRefund = await prisma.$queryRaw`
      SELECT id, status, amount, registration_id
      FROM refunds
      WHERE id = ${refundId}
    `

    if (!(currentRefund as any[])[0]) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 })
    }

    const refund = (currentRefund as any[])[0]

    // Update refund status
    const updated = await prisma.$queryRaw`
      UPDATE refunds
      SET 
        status = ${body.status || refund.status},
        gateway_refund_id = ${body.gatewayRefundId || null},
        processed_at = ${body.status === 'COMPLETED' ? 'NOW()' : refund.processed_at},
        processed_by = ${body.status === 'COMPLETED' ? BigInt((session.user as any).id) : refund.processed_by}
      WHERE id = ${refundId}
      RETURNING 
        id::text as id,
        status,
        processed_at as "processedAt"
    `

    return NextResponse.json({
      ...(updated as any[])[0],
      message: 'Refund updated successfully'
    })

  } catch (error: any) {
    console.error('Error updating refund:', error)
    return NextResponse.json({ error: 'Failed to update refund' }, { status: 500 })
  }
}

// DELETE /api/admin/refunds/[id] - Cancel/delete refund (Super Admin only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check permission - only Super Admin can delete refunds
    const permissionCheck = await checkPermissionInRoute('payments.refund', 'Delete Refund')
    if (permissionCheck) return permissionCheck

    const session = await getAuthSession()
    const userRole = (session as any)?.user?.role

    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Only Super Administrators can delete refunds'
      }, { status: 403 })
    }

    const refundId = BigInt(params.id)

    // Check if refund exists and is not completed
    const refund = await prisma.$queryRaw`
      SELECT id, status
      FROM refunds
      WHERE id = ${refundId}
    `

    if (!(refund as any[])[0]) {
      return NextResponse.json({ error: 'Refund not found' }, { status: 404 })
    }

    const refundStatus = (refund as any[])[0].status

    if (refundStatus === 'COMPLETED') {
      return NextResponse.json({
        error: 'Cannot delete a completed refund'
      }, { status: 400 })
    }

    // Delete refund
    await prisma.$queryRaw`
      DELETE FROM refunds
      WHERE id = ${refundId}
    `

    return NextResponse.json({
      message: 'Refund deleted successfully'
    })

  } catch (error: any) {
    console.error('Error deleting refund:', error)
    return NextResponse.json({ error: 'Failed to delete refund' }, { status: 500 })
  }
}
