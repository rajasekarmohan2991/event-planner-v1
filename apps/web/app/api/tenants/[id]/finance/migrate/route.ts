import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FinanceMigrationService } from '@/lib/services/finance-migration.service'

export const dynamic = 'force-dynamic'

// GET - Check migration status
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Get full migration status
    const status = await FinanceMigrationService.getMigrationStatus(tenantId)

    return NextResponse.json(status)
  } catch (error: any) {
    console.error('Error checking migration status:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Perform migration to Advanced Finance
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Check if can migrate
    const check = await FinanceMigrationService.canMigrate(tenantId)
    if (!check.canMigrate) {
      return NextResponse.json({ error: check.message }, { status: 400 })
    }

    // Perform migration
    const result = await FinanceMigrationService.migrateToTenantMode(tenantId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error performing migration:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Rollback to legacy mode (if no v2 invoices)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = params.id

    // Perform rollback
    const result = await FinanceMigrationService.rollbackToLegacy(tenantId)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error rolling back:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
