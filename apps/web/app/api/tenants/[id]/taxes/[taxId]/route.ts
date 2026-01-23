import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { FinanceMigrationService } from '@/lib/services/finance-migration.service'

export const dynamic = 'force-dynamic'

// GET - Get single tax structure
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; taxId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tenantId, taxId } = params

    const tax = await prisma.$queryRaw<any[]>`
      SELECT * FROM tax_structures 
      WHERE id = ${taxId} AND tenant_id = ${tenantId}
      LIMIT 1
    `

    if (tax.length === 0) {
      return NextResponse.json({ error: 'Tax not found' }, { status: 404 })
    }

    return NextResponse.json({ tax: tax[0] })
  } catch (error: any) {
    console.error('Error fetching tax:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update tax structure
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; taxId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tenantId, taxId } = params

    // Check finance mode
    const financeMode = await FinanceMigrationService.getFinanceMode(tenantId)
    if (financeMode !== 'tenant') {
      return NextResponse.json(
        { error: 'Cannot edit taxes in legacy mode' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, rate, description, taxType, isDefault, isCompound, effectiveFrom, effectiveUntil } = body

    // If setting as default, unset other defaults first
    if (isDefault) {
      await prisma.$executeRaw`
        UPDATE tax_structures 
        SET is_default = false, updated_at = NOW()
        WHERE tenant_id = ${tenantId} AND id != ${taxId}
      `
    }

    // Update tax
    await prisma.$executeRaw`
      UPDATE tax_structures SET
        name = COALESCE(${name}, name),
        rate = COALESCE(${rate}, rate),
        description = COALESCE(${description}, description),
        tax_type = COALESCE(${taxType}, tax_type),
        is_default = COALESCE(${isDefault}, is_default),
        is_compound = COALESCE(${isCompound}, is_compound),
        effective_from = COALESCE(${effectiveFrom ? new Date(effectiveFrom) : null}, effective_from),
        effective_until = COALESCE(${effectiveUntil ? new Date(effectiveUntil) : null}, effective_until),
        updated_at = NOW()
      WHERE id = ${taxId} AND tenant_id = ${tenantId}
    `

    return NextResponse.json({ success: true, message: 'Tax updated successfully' })
  } catch (error: any) {
    console.error('Error updating tax:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete/deactivate tax structure
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; taxId: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: tenantId, taxId } = params

    // Check finance mode
    const financeMode = await FinanceMigrationService.getFinanceMode(tenantId)
    if (financeMode !== 'tenant') {
      return NextResponse.json(
        { error: 'Cannot delete taxes in legacy mode' },
        { status: 403 }
      )
    }

    // Check if tax is used in any invoice snapshots
    const usedInInvoices = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM invoice_tax_snapshots 
      WHERE tax_id = ${taxId}
    `

    if (Number(usedInInvoices[0]?.count || 0) > 0) {
      // Soft delete - just deactivate
      await prisma.$executeRaw`
        UPDATE tax_structures 
        SET is_active = false, updated_at = NOW()
        WHERE id = ${taxId} AND tenant_id = ${tenantId}
      `

      return NextResponse.json({
        success: true,
        message: 'Tax deactivated (cannot delete as it is used in invoices)'
      })
    }

    // Hard delete if not used
    await prisma.$executeRaw`
      DELETE FROM tax_structures 
      WHERE id = ${taxId} AND tenant_id = ${tenantId}
    `

    return NextResponse.json({ success: true, message: 'Tax deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting tax:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
