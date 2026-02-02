import prisma from '@/lib/prisma';

export type SequenceType = 'invoice' | 'receipt' | 'payout';

interface SequenceConfig {
    prefix: string;
    yearFormat: string;
    includeMonth: boolean;
    paddingLength: number;
}

/**
 * Generate the next sequential number for invoices, receipts, or payouts
 * Format: PREFIX-YYYY-0001 or PREFIX-YYYY-MM-0001
 */
export async function generateNextNumber(
    tenantId: string,
    type: SequenceType = 'invoice'
): Promise<string> {
    try {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');

        // Get or create sequence record for tenant
        let sequence = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                id,
                invoice_sequence,
                receipt_sequence,
                payout_sequence,
                invoice_prefix,
                receipt_prefix,
                payout_prefix,
                year_format,
                include_month,
                padding_length,
                reset_yearly,
                last_reset_year
            FROM invoice_sequences
            WHERE tenant_id = $1
            LIMIT 1
        `, tenantId);

        let config: SequenceConfig;
        let currentSequence: number;

        if (sequence.length === 0) {
            // Create new sequence record with defaults
            const id = `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            await prisma.$executeRawUnsafe(`
                INSERT INTO invoice_sequences (
                    id, tenant_id, invoice_sequence, receipt_sequence, payout_sequence,
                    invoice_prefix, receipt_prefix, payout_prefix,
                    year_format, include_month, padding_length, reset_yearly, last_reset_year,
                    created_at, updated_at
                ) VALUES (
                    $1, $2, 0, 0, 0, 'INV', 'REC', 'PAY', 'YYYY', false, 4, true, $3, NOW(), NOW()
                )
            `, id, tenantId, currentYear);

            config = {
                prefix: type === 'invoice' ? 'INV' : type === 'receipt' ? 'REC' : 'PAY',
                yearFormat: 'YYYY',
                includeMonth: false,
                paddingLength: 4
            };
            currentSequence = 0;
        } else {
            const seq = sequence[0];
            
            // Check if we need to reset for new year
            if (seq.reset_yearly && seq.last_reset_year !== currentYear) {
                await prisma.$executeRawUnsafe(`
                    UPDATE invoice_sequences
                    SET invoice_sequence = 0, receipt_sequence = 0, payout_sequence = 0,
                        last_reset_year = $2, updated_at = NOW()
                    WHERE tenant_id = $1
                `, tenantId, currentYear);
                currentSequence = 0;
            } else {
                currentSequence = type === 'invoice' 
                    ? seq.invoice_sequence 
                    : type === 'receipt' 
                        ? seq.receipt_sequence 
                        : seq.payout_sequence;
            }

            config = {
                prefix: type === 'invoice' 
                    ? seq.invoice_prefix 
                    : type === 'receipt' 
                        ? seq.receipt_prefix 
                        : seq.payout_prefix,
                yearFormat: seq.year_format || 'YYYY',
                includeMonth: seq.include_month || false,
                paddingLength: seq.padding_length || 4
            };
        }

        // Increment sequence
        const newSequence = currentSequence + 1;
        const sequenceColumn = type === 'invoice' 
            ? 'invoice_sequence' 
            : type === 'receipt' 
                ? 'receipt_sequence' 
                : 'payout_sequence';

        await prisma.$executeRawUnsafe(`
            UPDATE invoice_sequences
            SET ${sequenceColumn} = $2, updated_at = NOW()
            WHERE tenant_id = $1
        `, tenantId, newSequence);

        // Format the number
        const yearPart = config.yearFormat === 'YY' 
            ? currentYear.toString().slice(-2) 
            : currentYear.toString();
        
        const monthPart = config.includeMonth ? `-${currentMonth}` : '';
        const sequencePart = newSequence.toString().padStart(config.paddingLength, '0');

        return `${config.prefix}-${yearPart}${monthPart}-${sequencePart}`;
    } catch (error) {
        console.error('Failed to generate sequence number:', error);
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-8);
        const prefix = type === 'invoice' ? 'INV' : type === 'receipt' ? 'REC' : 'PAY';
        return `${prefix}-${new Date().getFullYear()}-${timestamp}`;
    }
}

/**
 * Get the current sequence numbers for a tenant
 */
export async function getSequenceInfo(tenantId: string): Promise<{
    invoice: { current: number; prefix: string; nextNumber: string };
    receipt: { current: number; prefix: string; nextNumber: string };
    payout: { current: number; prefix: string; nextNumber: string };
} | null> {
    try {
        const sequence = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                invoice_sequence,
                receipt_sequence,
                payout_sequence,
                invoice_prefix,
                receipt_prefix,
                payout_prefix,
                year_format,
                include_month,
                padding_length
            FROM invoice_sequences
            WHERE tenant_id = $1
            LIMIT 1
        `, tenantId);

        if (sequence.length === 0) {
            return null;
        }

        const seq = sequence[0];
        const year = new Date().getFullYear();
        const yearPart = seq.year_format === 'YY' ? year.toString().slice(-2) : year.toString();
        const monthPart = seq.include_month ? `-${(new Date().getMonth() + 1).toString().padStart(2, '0')}` : '';
        const pad = seq.padding_length || 4;

        return {
            invoice: {
                current: seq.invoice_sequence,
                prefix: seq.invoice_prefix,
                nextNumber: `${seq.invoice_prefix}-${yearPart}${monthPart}-${(seq.invoice_sequence + 1).toString().padStart(pad, '0')}`
            },
            receipt: {
                current: seq.receipt_sequence,
                prefix: seq.receipt_prefix,
                nextNumber: `${seq.receipt_prefix}-${yearPart}${monthPart}-${(seq.receipt_sequence + 1).toString().padStart(pad, '0')}`
            },
            payout: {
                current: seq.payout_sequence,
                prefix: seq.payout_prefix,
                nextNumber: `${seq.payout_prefix}-${yearPart}${monthPart}-${(seq.payout_sequence + 1).toString().padStart(pad, '0')}`
            }
        };
    } catch (error) {
        console.error('Failed to get sequence info:', error);
        return null;
    }
}

/**
 * Update sequence configuration for a tenant
 */
export async function updateSequenceConfig(
    tenantId: string,
    config: {
        invoicePrefix?: string;
        receiptPrefix?: string;
        payoutPrefix?: string;
        yearFormat?: 'YYYY' | 'YY';
        includeMonth?: boolean;
        paddingLength?: number;
        resetYearly?: boolean;
    }
): Promise<boolean> {
    try {
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (config.invoicePrefix) {
            updates.push(`invoice_prefix = $${paramIndex}`);
            values.push(config.invoicePrefix);
            paramIndex++;
        }

        if (config.receiptPrefix) {
            updates.push(`receipt_prefix = $${paramIndex}`);
            values.push(config.receiptPrefix);
            paramIndex++;
        }

        if (config.payoutPrefix) {
            updates.push(`payout_prefix = $${paramIndex}`);
            values.push(config.payoutPrefix);
            paramIndex++;
        }

        if (config.yearFormat) {
            updates.push(`year_format = $${paramIndex}`);
            values.push(config.yearFormat);
            paramIndex++;
        }

        if (config.includeMonth !== undefined) {
            updates.push(`include_month = $${paramIndex}`);
            values.push(config.includeMonth);
            paramIndex++;
        }

        if (config.paddingLength) {
            updates.push(`padding_length = $${paramIndex}`);
            values.push(config.paddingLength);
            paramIndex++;
        }

        if (config.resetYearly !== undefined) {
            updates.push(`reset_yearly = $${paramIndex}`);
            values.push(config.resetYearly);
            paramIndex++;
        }

        if (updates.length === 0) {
            return true;
        }

        updates.push('updated_at = NOW()');
        values.push(tenantId);

        await prisma.$executeRawUnsafe(`
            UPDATE invoice_sequences
            SET ${updates.join(', ')}
            WHERE tenant_id = $${paramIndex}
        `, ...values);

        return true;
    } catch (error) {
        console.error('Failed to update sequence config:', error);
        return false;
    }
}
