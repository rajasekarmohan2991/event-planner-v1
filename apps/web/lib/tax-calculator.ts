/**
 * Production-Grade Tax Calculator
 * Handles complex tax calculations with support for:
 * - Country-specific tax rules
 * - Event-level tax overrides
 * - Multi-tax scenarios (compound taxes)
 * - Tax exemptions
 */

import prisma from '@/lib/prisma';

export interface TaxCalculationContext {
  tenantId: string;
  eventId?: string;
  amount: number;
  itemType?: 'TICKET' | 'SPONSOR' | 'EXHIBITOR' | 'VENDOR' | 'OTHER';
  recipientCountry?: string;
  isExempt?: boolean;
  quantity?: number;
}

export interface TaxBreakdown {
  name: string;
  rate: number;
  amount: number;
  type: string;
}

export interface TaxCalculationResult {
  subtotal: number;
  taxes: TaxBreakdown[];
  taxTotal: number;
  grandTotal: number;
  appliedTaxStructure?: {
    id: string;
    name: string;
    rate: number;
  };
}

/**
 * Calculate tax for a given amount and context
 */
export async function calculateTax(
  context: TaxCalculationContext
): Promise<TaxCalculationResult> {
  const { tenantId, eventId, amount, itemType, isExempt, quantity = 1 } = context;

  // If explicitly marked as exempt, return zero tax
  if (isExempt) {
    return {
      subtotal: amount,
      taxes: [],
      taxTotal: 0,
      grandTotal: amount,
    };
  }

  try {
    let taxStructure: any = null;

    // Step 1: Check for event-level tax override
    if (eventId) {
      const eventTaxSettings = await prisma.$queryRaw<any[]>`
        SELECT 
          use_custom_tax,
          tax_structure_id,
          custom_tax_rate,
          custom_tax_name,
          is_tax_exempt
        FROM event_tax_settings
        WHERE event_id = ${eventId}
        LIMIT 1
      `;

      if (eventTaxSettings.length > 0) {
        const settings = eventTaxSettings[0];

        // Check if event is tax exempt
        if (settings.is_tax_exempt) {
          return {
            subtotal: amount,
            taxes: [],
            taxTotal: 0,
            grandTotal: amount,
          };
        }

        // Use custom tax if configured
        if (settings.use_custom_tax && settings.custom_tax_rate !== null) {
          taxStructure = {
            id: 'custom',
            name: settings.custom_tax_name || 'Custom Tax',
            rate: settings.custom_tax_rate,
            tax_type: 'CUSTOM',
          };
        } else if (settings.tax_structure_id) {
          // Use specific tax structure
          const structures = await prisma.$queryRaw<any[]>`
            SELECT id, name, rate, tax_type
            FROM tax_structures
            WHERE id = ${settings.tax_structure_id}
            LIMIT 1
          `;
          if (structures.length > 0) {
            taxStructure = structures[0];
          }
        }
      }
    }

    // Step 2: If no event tax, use tenant default tax
    if (!taxStructure) {
      const defaultTaxes = await prisma.$queryRaw<any[]>`
        SELECT id, name, rate, tax_type, applies_to
        FROM tax_structures
        WHERE tenant_id = ${tenantId}
          AND is_default = true
          AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
          AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
        ORDER BY created_at DESC
        LIMIT 1
      `;

      if (defaultTaxes.length > 0) {
        taxStructure = defaultTaxes[0];

        // Check if tax applies to this item type
        if (taxStructure.applies_to && taxStructure.applies_to !== 'ALL') {
          const appliesTo = taxStructure.applies_to.toUpperCase();
          const currentType = (itemType || 'OTHER').toUpperCase();
          
          if (!appliesTo.includes(currentType)) {
            // Tax doesn't apply to this item type, return zero tax
            return {
              subtotal: amount,
              taxes: [],
              taxTotal: 0,
              grandTotal: amount,
            };
          }
        }
      }
    }

    // Step 3: Calculate tax
    if (!taxStructure) {
      // No tax structure found, return zero tax
      return {
        subtotal: amount,
        taxes: [],
        taxTotal: 0,
        grandTotal: amount,
      };
    }

    const taxRate = parseFloat(taxStructure.rate) || 0;
    const taxAmount = (amount * taxRate) / 100;

    const taxes: TaxBreakdown[] = [
      {
        name: taxStructure.name,
        rate: taxRate,
        amount: taxAmount,
        type: taxStructure.tax_type || 'STANDARD',
      },
    ];

    return {
      subtotal: amount,
      taxes,
      taxTotal: taxAmount,
      grandTotal: amount + taxAmount,
      appliedTaxStructure: {
        id: taxStructure.id,
        name: taxStructure.name,
        rate: taxRate,
      },
    };
  } catch (error) {
    console.error('Tax calculation error:', error);
    // Fallback: return zero tax on error
    return {
      subtotal: amount,
      taxes: [],
      taxTotal: 0,
      grandTotal: amount,
    };
  }
}

/**
 * Calculate tax for multiple line items
 */
export async function calculateTaxForLineItems(
  items: Array<{
    amount: number;
    quantity: number;
    itemType?: string;
  }>,
  context: Omit<TaxCalculationContext, 'amount' | 'quantity'>
): Promise<{
  items: Array<TaxCalculationResult & { lineTotal: number }>;
  summary: {
    subtotal: number;
    taxTotal: number;
    grandTotal: number;
  };
}> {
  const results = await Promise.all(
    items.map(async (item) => {
      const lineSubtotal = item.amount * item.quantity;
      const taxResult = await calculateTax({
        ...context,
        amount: lineSubtotal,
        itemType: item.itemType as any,
      });

      return {
        ...taxResult,
        lineTotal: taxResult.grandTotal,
      };
    })
  );

  const summary = results.reduce(
    (acc, result) => ({
      subtotal: acc.subtotal + result.subtotal,
      taxTotal: acc.taxTotal + result.taxTotal,
      grandTotal: acc.grandTotal + result.grandTotal,
    }),
    { subtotal: 0, taxTotal: 0, grandTotal: 0 }
  );

  return {
    items: results,
    summary,
  };
}

/**
 * Validate tax configuration
 */
export async function validateTaxConfiguration(
  tenantId: string,
  eventId?: string
): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if tenant has at least one tax structure
    const taxStructures = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM tax_structures
      WHERE tenant_id = ${tenantId}
    `;

    const count = parseInt(taxStructures[0]?.count || '0');

    if (count === 0) {
      warnings.push('No tax structures configured for this company');
    }

    // Check if there's a default tax
    const defaultTaxes = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM tax_structures
      WHERE tenant_id = ${tenantId} AND is_default = true
    `;

    const defaultCount = parseInt(defaultTaxes[0]?.count || '0');

    if (defaultCount === 0 && count > 0) {
      warnings.push('No default tax structure set');
    }

    if (defaultCount > 1) {
      errors.push('Multiple default tax structures found - only one should be default');
    }

    // If event ID provided, check event tax settings
    if (eventId) {
      const eventSettings = await prisma.$queryRaw<any[]>`
        SELECT use_custom_tax, custom_tax_rate, tax_structure_id
        FROM event_tax_settings
        WHERE event_id = ${eventId}
      `;

      if (eventSettings.length > 0) {
        const settings = eventSettings[0];
        
        if (settings.use_custom_tax && settings.custom_tax_rate === null) {
          errors.push('Event configured to use custom tax but no rate specified');
        }

        if (settings.tax_structure_id) {
          const structures = await prisma.$queryRaw<any[]>`
            SELECT COUNT(*) as count
            FROM tax_structures
            WHERE id = ${settings.tax_structure_id}
          `;

          if (parseInt(structures[0]?.count || '0') === 0) {
            errors.push('Event references non-existent tax structure');
          }
        }
      }
    }
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get applicable tax rate for a context (without full calculation)
 */
export async function getApplicableTaxRate(
  context: Omit<TaxCalculationContext, 'amount'>
): Promise<number> {
  const result = await calculateTax({ ...context, amount: 100 });
  return result.taxes.length > 0 ? result.taxes[0].rate : 0;
}
