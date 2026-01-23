import prisma from '@/lib/prisma'

interface TaxInfo {
  id?: string
  name: string
  rate: number
  taxType?: string
  globalTemplateId?: string
  isCompound?: boolean
}

interface LineItem {
  id?: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  taxRate?: number
}

interface TaxSnapshot {
  invoiceId: string
  lineItemId?: string
  taxId?: string
  taxSource: 'GLOBAL_TEMPLATE' | 'TENANT_CUSTOM' | 'MANUAL'
  taxName: string
  taxType: string
  taxRate: number
  baseAmount: number
  taxAmount: number
  isCompound: boolean
}

export class TaxSnapshotService {
  /**
   * Create tax snapshots for an invoice
   * This preserves the tax information at the time of invoice creation
   */
  static async createSnapshot(
    invoiceId: string,
    lineItems: LineItem[],
    taxes: TaxInfo[]
  ): Promise<TaxSnapshot[]> {
    const snapshots: TaxSnapshot[] = []

    // Calculate total base amount from line items
    const totalBaseAmount = lineItems.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice), 0)

    for (const tax of taxes) {
      const taxAmount = (totalBaseAmount * tax.rate) / 100

      const snapshot: TaxSnapshot = {
        invoiceId,
        lineItemId: undefined, // Invoice-level tax
        taxId: tax.id,
        taxSource: tax.globalTemplateId ? 'GLOBAL_TEMPLATE' : (tax.id ? 'TENANT_CUSTOM' : 'MANUAL'),
        taxName: tax.name,
        taxType: tax.taxType || 'CUSTOM',
        taxRate: tax.rate,
        baseAmount: totalBaseAmount,
        taxAmount,
        isCompound: tax.isCompound || false
      }

      snapshots.push(snapshot)
    }

    // Insert snapshots into database
    if (snapshots.length > 0) {
      for (const snapshot of snapshots) {
        const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        await prisma.$executeRaw`
          INSERT INTO invoice_tax_snapshots (
            id, invoice_id, line_item_id, tax_id, tax_source, tax_name, tax_type,
            tax_rate, base_amount, tax_amount, is_compound, snapshot_date, created_at
          ) VALUES (
            ${snapshotId},
            ${snapshot.invoiceId},
            ${snapshot.lineItemId || null},
            ${snapshot.taxId || null},
            ${snapshot.taxSource},
            ${snapshot.taxName},
            ${snapshot.taxType},
            ${snapshot.taxRate},
            ${snapshot.baseAmount},
            ${snapshot.taxAmount},
            ${snapshot.isCompound},
            NOW(),
            NOW()
          )
        `
      }
    }

    return snapshots
  }

  /**
   * Create line-item level tax snapshots
   */
  static async createLineItemSnapshots(
    invoiceId: string,
    lineItems: LineItem[],
    taxes: TaxInfo[]
  ): Promise<TaxSnapshot[]> {
    const snapshots: TaxSnapshot[] = []

    for (const item of lineItems) {
      for (const tax of taxes) {
        const baseAmount = item.total || item.quantity * item.unitPrice
        const taxAmount = (baseAmount * tax.rate) / 100

        const snapshot: TaxSnapshot = {
          invoiceId,
          lineItemId: item.id,
          taxId: tax.id,
          taxSource: tax.globalTemplateId ? 'GLOBAL_TEMPLATE' : (tax.id ? 'TENANT_CUSTOM' : 'MANUAL'),
          taxName: tax.name,
          taxType: tax.taxType || 'CUSTOM',
          taxRate: tax.rate,
          baseAmount,
          taxAmount,
          isCompound: tax.isCompound || false
        }

        snapshots.push(snapshot)
      }
    }

    // Insert snapshots into database
    for (const snapshot of snapshots) {
      const snapshotId = `snap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      await prisma.$executeRaw`
        INSERT INTO invoice_tax_snapshots (
          id, invoice_id, line_item_id, tax_id, tax_source, tax_name, tax_type,
          tax_rate, base_amount, tax_amount, is_compound, snapshot_date, created_at
        ) VALUES (
          ${snapshotId},
          ${snapshot.invoiceId},
          ${snapshot.lineItemId || null},
          ${snapshot.taxId || null},
          ${snapshot.taxSource},
          ${snapshot.taxName},
          ${snapshot.taxType},
          ${snapshot.taxRate},
          ${snapshot.baseAmount},
          ${snapshot.taxAmount},
          ${snapshot.isCompound},
          NOW(),
          NOW()
        )
      `
    }

    return snapshots
  }

  /**
   * Get tax snapshots for an invoice
   */
  static async getSnapshotsForInvoice(invoiceId: string): Promise<TaxSnapshot[]> {
    const snapshots = await prisma.$queryRaw<any[]>`
      SELECT * FROM invoice_tax_snapshots 
      WHERE invoice_id = ${invoiceId}
      ORDER BY created_at
    `

    return snapshots.map(s => ({
      invoiceId: s.invoice_id,
      lineItemId: s.line_item_id,
      taxId: s.tax_id,
      taxSource: s.tax_source,
      taxName: s.tax_name,
      taxType: s.tax_type,
      taxRate: s.tax_rate,
      baseAmount: s.base_amount,
      taxAmount: s.tax_amount,
      isCompound: s.is_compound
    }))
  }

  /**
   * Calculate invoice totals with tax snapshots
   */
  static calculateWithSnapshots(
    lineItems: LineItem[],
    taxes: TaxInfo[],
    mode: 'exclusive' | 'inclusive' = 'exclusive'
  ) {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice), 0)

    const snapshots: Omit<TaxSnapshot, 'invoiceId'>[] = []
    let totalTax = 0

    for (const tax of taxes) {
      let taxAmount: number

      if (mode === 'inclusive') {
        // Tax is included in the price
        taxAmount = subtotal - (subtotal / (1 + tax.rate / 100))
      } else {
        // Tax is added on top
        taxAmount = (subtotal * tax.rate) / 100
      }

      snapshots.push({
        lineItemId: undefined,
        taxId: tax.id,
        taxSource: tax.globalTemplateId ? 'GLOBAL_TEMPLATE' : (tax.id ? 'TENANT_CUSTOM' : 'MANUAL'),
        taxName: tax.name,
        taxType: tax.taxType || 'CUSTOM',
        taxRate: tax.rate,
        baseAmount: subtotal,
        taxAmount,
        isCompound: tax.isCompound || false
      })

      totalTax += taxAmount
    }

    const grandTotal = mode === 'inclusive' ? subtotal : subtotal + totalTax

    return {
      subtotal,
      taxTotal: totalTax,
      grandTotal,
      snapshots,
      items: lineItems
    }
  }
}
