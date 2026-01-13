/**
 * Convenience Fee Calculator
 * Handles platform/processing fees for ticket sales and payments
 */

import prisma from '@/lib/prisma';

export interface ConvenienceFeeConfig {
  id?: string;
  tenantId?: string;
  eventId?: string;
  
  // Fee structure
  feeType: 'PERCENTAGE' | 'FIXED' | 'HYBRID'; // Hybrid = percentage + fixed
  percentageFee: number; // e.g., 2.5 for 2.5%
  fixedFee: number; // e.g., 50 for ₹50 or $0.50
  
  // Fee application
  appliesTo: 'TICKET' | 'ALL' | 'SPONSOR' | 'EXHIBITOR';
  passFeeToCustomer: boolean; // true = customer pays, false = organizer absorbs
  
  // Minimum/Maximum
  minimumFee?: number;
  maximumFee?: number;
  
  // Display
  displayName: string;
  description?: string;
}

export interface ConvenienceFeeResult {
  subtotal: number;
  convenienceFee: number;
  totalWithFee: number;
  feeBreakdown: {
    percentageFee: number;
    fixedFee: number;
    total: number;
  };
  appliedConfig?: ConvenienceFeeConfig;
}

/**
 * Calculate convenience fee for a transaction
 */
export async function calculateConvenienceFee(
  amount: number,
  context: {
    tenantId: string;
    eventId?: string;
    itemType?: 'TICKET' | 'SPONSOR' | 'EXHIBITOR' | 'OTHER';
  }
): Promise<ConvenienceFeeResult> {
  const { tenantId, eventId, itemType = 'TICKET' } = context;

  try {
    let feeConfig: any = null;

    // Step 1: Check for event-specific convenience fee
    if (eventId) {
      const eventFees = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          tenant_id as "tenantId",
          event_id as "eventId",
          fee_type as "feeType",
          percentage_fee as "percentageFee",
          fixed_fee as "fixedFee",
          applies_to as "appliesTo",
          pass_fee_to_customer as "passFeeToCustomer",
          minimum_fee as "minimumFee",
          maximum_fee as "maximumFee",
          display_name as "displayName",
          description
        FROM convenience_fee_config
        WHERE event_id = ${eventId}
        LIMIT 1
      `;

      if (eventFees.length > 0) {
        feeConfig = eventFees[0];
      }
    }

    // Step 2: Fall back to tenant default convenience fee
    if (!feeConfig) {
      const tenantFees = await prisma.$queryRaw<any[]>`
        SELECT 
          id,
          tenant_id as "tenantId",
          fee_type as "feeType",
          percentage_fee as "percentageFee",
          fixed_fee as "fixedFee",
          applies_to as "appliesTo",
          pass_fee_to_customer as "passFeeToCustomer",
          minimum_fee as "minimumFee",
          maximum_fee as "maximumFee",
          display_name as "displayName",
          description
        FROM convenience_fee_config
        WHERE tenant_id = ${tenantId}
          AND event_id IS NULL
        LIMIT 1
      `;

      if (tenantFees.length > 0) {
        feeConfig = tenantFees[0];
      }
    }

    // Step 3: If no config or customer doesn't pay, return zero fee
    if (!feeConfig || !feeConfig.passFeeToCustomer) {
      return {
        subtotal: amount,
        convenienceFee: 0,
        totalWithFee: amount,
        feeBreakdown: {
          percentageFee: 0,
          fixedFee: 0,
          total: 0,
        },
      };
    }

    // Step 4: Check if fee applies to this item type
    if (feeConfig.appliesTo !== 'ALL') {
      const appliesTo = feeConfig.appliesTo.toUpperCase();
      const currentType = itemType.toUpperCase();
      
      if (!appliesTo.includes(currentType)) {
        return {
          subtotal: amount,
          convenienceFee: 0,
          totalWithFee: amount,
          feeBreakdown: {
            percentageFee: 0,
            fixedFee: 0,
            total: 0,
          },
        };
      }
    }

    // Step 5: Calculate fee
    let percentageFeeAmount = 0;
    let fixedFeeAmount = 0;

    const feeType = feeConfig.feeType.toUpperCase();

    if (feeType === 'PERCENTAGE' || feeType === 'HYBRID') {
      const percentageRate = parseFloat(feeConfig.percentageFee) || 0;
      percentageFeeAmount = (amount * percentageRate) / 100;
    }

    if (feeType === 'FIXED' || feeType === 'HYBRID') {
      fixedFeeAmount = parseFloat(feeConfig.fixedFee) || 0;
    }

    let totalFee = percentageFeeAmount + fixedFeeAmount;

    // Apply minimum/maximum limits
    if (feeConfig.minimumFee && totalFee < feeConfig.minimumFee) {
      totalFee = feeConfig.minimumFee;
    }

    if (feeConfig.maximumFee && totalFee > feeConfig.maximumFee) {
      totalFee = feeConfig.maximumFee;
    }

    return {
      subtotal: amount,
      convenienceFee: totalFee,
      totalWithFee: amount + totalFee,
      feeBreakdown: {
        percentageFee: percentageFeeAmount,
        fixedFee: fixedFeeAmount,
        total: totalFee,
      },
      appliedConfig: feeConfig,
    };
  } catch (error) {
    console.error('Convenience fee calculation error:', error);
    // Fallback: return zero fee on error
    return {
      subtotal: amount,
      convenienceFee: 0,
      totalWithFee: amount,
      feeBreakdown: {
        percentageFee: 0,
        fixedFee: 0,
        total: 0,
      },
    };
  }
}

/**
 * Calculate complete pricing with tax and convenience fee
 */
export async function calculateCompletePricing(
  amount: number,
  context: {
    tenantId: string;
    eventId?: string;
    itemType?: 'TICKET' | 'SPONSOR' | 'EXHIBITOR' | 'OTHER';
    quantity?: number;
  }
): Promise<{
  subtotal: number;
  tax: number;
  convenienceFee: number;
  total: number;
  breakdown: {
    baseAmount: number;
    taxAmount: number;
    convenienceFeeAmount: number;
    grandTotal: number;
  };
}> {
  const { calculateTax } = await import('./tax-calculator');
  
  const quantity = context.quantity || 1;
  const baseAmount = amount * quantity;

  // Calculate tax on base amount
  const taxResult = await calculateTax({
    ...context,
    amount: baseAmount,
  });

  // Calculate convenience fee on subtotal (base + tax)
  const subtotalWithTax = taxResult.grandTotal;
  const feeResult = await calculateConvenienceFee(subtotalWithTax, context);

  return {
    subtotal: baseAmount,
    tax: taxResult.taxTotal,
    convenienceFee: feeResult.convenienceFee,
    total: feeResult.totalWithFee,
    breakdown: {
      baseAmount,
      taxAmount: taxResult.taxTotal,
      convenienceFeeAmount: feeResult.convenienceFee,
      grandTotal: feeResult.totalWithFee,
    },
  };
}

/**
 * Get convenience fee configuration
 */
export async function getConvenienceFeeConfig(
  tenantId: string,
  eventId?: string
): Promise<ConvenienceFeeConfig | null> {
  try {
    let config: any = null;

    // Check event-specific first
    if (eventId) {
      const eventConfigs = await prisma.$queryRaw<any[]>`
        SELECT * FROM convenience_fee_config WHERE event_id = ${eventId} LIMIT 1
      `;
      if (eventConfigs.length > 0) {
        config = eventConfigs[0];
      }
    }

    // Fall back to tenant default
    if (!config) {
      const tenantConfigs = await prisma.$queryRaw<any[]>`
        SELECT * FROM convenience_fee_config 
        WHERE tenant_id = ${tenantId} AND event_id IS NULL 
        LIMIT 1
      `;
      if (tenantConfigs.length > 0) {
        config = tenantConfigs[0];
      }
    }

    return config;
  } catch (error) {
    console.error('Error fetching convenience fee config:', error);
    return null;
  }
}
