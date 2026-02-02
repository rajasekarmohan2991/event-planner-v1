import prisma from '@/lib/prisma'

export class FinanceMigrationService {
  /**
   * Check if a tenant can migrate to Advanced Finance mode
   * Requirements: No active (unpaid) v1 invoices
   */
  static async canMigrate(tenantId: string) {
    try {
      // Check if tenant has any active v1 invoices (not PAID or CANCELLED)
      const activeV1Invoices = await prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM invoices 
        WHERE tenant_id = ${tenantId}
        AND (finance_version IS NULL OR finance_version = 'v1')
        AND status NOT IN ('PAID', 'CANCELLED', 'VOID')
      `

      const count = Number(activeV1Invoices[0]?.count || 0)

      return {
        canMigrate: count === 0,
        activeInvoices: count,
        message: count > 0
          ? `Cannot migrate: ${count} active v1 invoice(s) exist. Please complete or cancel all pending invoices first.`
          : 'Ready to migrate to Advanced Finance'
      }
    } catch (error: any) {
      console.error('Error checking migration status:', error)
      return {
        canMigrate: false,
        activeInvoices: 0,
        message: `Error checking migration status: ${error.message}`
      }
    }
  }

  /**
   * Get the current finance mode for a tenant
   */
  static async getFinanceMode(tenantId: string) {
    try {
      const tenant = await prisma.$queryRaw<any[]>`
        SELECT finance_mode FROM tenants WHERE id = ${tenantId} LIMIT 1
      `

      return tenant[0]?.finance_mode || 'legacy'
    } catch (error) {
      console.error('Error getting finance mode:', error)
      return 'legacy'
    }
  }

  /**
   * Migrate a tenant to Advanced Finance (tenant mode)
   */
  static async migrateToTenantMode(tenantId: string) {
    // 1. Verify can migrate
    const check = await this.canMigrate(tenantId)
    if (!check.canMigrate) {
      throw new Error(check.message)
    }

    // 2. Get current finance settings
    const settings = await prisma.$queryRaw<any[]>`
      SELECT * FROM finance_settings WHERE tenant_id = ${tenantId} LIMIT 1
    `

    const currentSettings = settings[0]

    // 3. Create default tax structure from current settings if tax rate exists
    if (currentSettings && currentSettings.default_tax_rate > 0) {
      const taxId = `tax_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await prisma.$executeRaw`
        INSERT INTO tax_structures (
          id, tenant_id, name, rate, description, is_default, is_custom, is_active, created_at, updated_at
        ) VALUES (
          ${taxId}, 
          ${tenantId}, 
          ${'Default Tax (' + currentSettings.default_tax_rate + '%)'},
          ${currentSettings.default_tax_rate},
          'Migrated from legacy finance settings',
          true,
          true,
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
      `
    }

    // 4. Update tenant finance mode
    await prisma.$executeRaw`
      UPDATE tenants 
      SET finance_mode = 'tenant', updated_at = NOW()
      WHERE id = ${tenantId}
    `

    // 5. Log the migration
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await prisma.$executeRaw`
      INSERT INTO finance_audit_logs (
        id, tenant_id, action_type, action_description, entity_type, entity_id, 
        new_state, created_at
      ) VALUES (
        ${auditId},
        ${tenantId},
        'FINANCE_MIGRATION',
        'Migrated from legacy to advanced finance mode',
        'TENANT',
        ${tenantId},
        ${{ financeMode: 'tenant', migratedAt: new Date().toISOString() }}::jsonb,
        NOW()
      )
    `

    return { success: true, message: 'Successfully migrated to Advanced Finance' }
  }

  /**
   * Rollback to legacy mode (only if no v2 invoices exist)
   */
  static async rollbackToLegacy(tenantId: string) {
    // Check if any v2 invoices exist
    const v2Invoices = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM invoices 
      WHERE tenant_id = ${tenantId}
      AND finance_version = 'v2'
    `

    const count = Number(v2Invoices[0]?.count || 0)

    if (count > 0) {
      throw new Error(`Cannot rollback: ${count} v2 invoice(s) exist. Advanced Finance cannot be disabled once invoices are created.`)
    }

    // Update tenant finance mode back to legacy
    await prisma.$executeRaw`
      UPDATE tenants 
      SET finance_mode = 'legacy', updated_at = NOW()
      WHERE id = ${tenantId}
    `

    return { success: true, message: 'Rolled back to Legacy Finance' }
  }

  /**
   * Get migration status summary for a tenant
   */
  static async getMigrationStatus(tenantId: string) {
    const financeMode = await this.getFinanceMode(tenantId)
    const canMigrateCheck = financeMode === 'legacy' ? await this.canMigrate(tenantId) : null

    // Get invoice counts
    const invoiceCounts = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(finance_version, 'v1') as version,
        COUNT(*) as count
      FROM invoices 
      WHERE tenant_id = ${tenantId}
      GROUP BY COALESCE(finance_version, 'v1')
    `

    const v1Count = Number(invoiceCounts.find(i => i.version === 'v1')?.count || 0)
    const v2Count = Number(invoiceCounts.find(i => i.version === 'v2')?.count || 0)

    // Get tax structures count
    const taxCount = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM tax_structures WHERE tenant_id = ${tenantId}
    `

    return {
      financeMode,
      canMigrate: canMigrateCheck?.canMigrate || false,
      migrationMessage: canMigrateCheck?.message || (financeMode === 'tenant' ? 'Already using Advanced Finance' : ''),
      invoices: {
        v1: v1Count,
        v2: v2Count,
        total: v1Count + v2Count
      },
      taxStructures: Number(taxCount[0]?.count || 0),
      canRollback: financeMode === 'tenant' && v2Count === 0
    }
  }
}
