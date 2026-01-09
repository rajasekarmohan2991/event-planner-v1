import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { logFinanceAudit } from '@/lib/finance-audit';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/razorpay - Handle Razorpay webhook events
export async function POST(req: NextRequest) {
    try {
        const payload = await req.text();
        const signature = req.headers.get('x-razorpay-signature');

        if (!signature) {
            console.error('Missing Razorpay signature');
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (webhookSecret) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payload)
                .digest('hex');

            if (expectedSignature !== signature) {
                console.error('Razorpay webhook signature verification failed');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
            }
        }

        const event = JSON.parse(payload);
        console.log(`📥 Razorpay webhook received: ${event.event}`);

        // Log webhook to database
        const webhookLogId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            await prisma.$executeRawUnsafe(`
                INSERT INTO payment_webhook_logs (
                    id, gateway, event_type, event_id, payload, signature_valid, received_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, webhookLogId, 'RAZORPAY', event.event, event.payload?.payment?.entity?.id || event.event, JSON.stringify(event), true);
        } catch (logError) {
            console.warn('Failed to log webhook:', logError);
        }

        // Handle different event types
        switch (event.event) {
            case 'payment.captured':
                await handlePaymentCaptured(event.payload.payment.entity, webhookLogId);
                break;

            case 'payment.failed':
                await handlePaymentFailed(event.payload.payment.entity, webhookLogId);
                break;

            case 'refund.created':
                await handleRefundCreated(event.payload.refund.entity, webhookLogId);
                break;

            case 'order.paid':
                await handleOrderPaid(event.payload.order.entity, event.payload.payment?.entity, webhookLogId);
                break;

            case 'subscription.activated':
            case 'subscription.charged':
            case 'subscription.cancelled':
                await handleSubscriptionEvent(event.event, event.payload.subscription?.entity, webhookLogId);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.payload.invoice?.entity, webhookLogId);
                break;

            default:
                console.log(`Unhandled Razorpay event: ${event.event}`);
        }

        // Mark webhook as processed
        try {
            await prisma.$executeRawUnsafe(`
                UPDATE payment_webhook_logs
                SET processed = true, processed_at = NOW()
                WHERE id = $1
            `, webhookLogId);
        } catch (updateError) {
            console.warn('Failed to update webhook log:', updateError);
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Razorpay webhook error:', error);
        return NextResponse.json({ 
            error: 'Webhook handler failed',
            details: error.message 
        }, { status: 500 });
    }
}

// Handle successful payment capture
async function handlePaymentCaptured(payment: any, webhookLogId: string) {
    console.log(`✅ Razorpay payment captured: ${payment.id}`);
    
    const notes = payment.notes || {};
    const tenantId = notes.tenantId;
    const invoiceId = notes.invoiceId;
    const eventId = notes.eventId;
    const orderId = notes.orderId;

    try {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (invoiceId) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO payment_records (
                    id, invoice_id, amount, method, reference, status, 
                    currency, gateway, gateway_transaction_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            `,
                paymentId,
                invoiceId,
                payment.amount / 100, // Convert from paise
                payment.method?.toUpperCase() || 'RAZORPAY',
                payment.id,
                'SUCCESS',
                payment.currency?.toUpperCase() || 'INR',
                'RAZORPAY',
                payment.id
            );

            // Update invoice status
            await prisma.$executeRawUnsafe(`
                UPDATE invoices
                SET status = 'PAID', updated_at = NOW()
                WHERE id = $1
            `, invoiceId);
        }

        // Log audit
        if (tenantId) {
            await logFinanceAudit({
                tenantId,
                eventId: eventId ? BigInt(eventId) : null,
                actionType: 'PAYMENT_RECEIVED',
                actionDescription: `Payment received via Razorpay: ${payment.id} (${payment.method})`,
                entityType: 'PAYMENT',
                entityId: paymentId,
                amount: payment.amount / 100,
                currency: payment.currency?.toUpperCase() || 'INR',
                externalReference: payment.id,
                webhookEventId: webhookLogId
            });
        }

        // Update order status if applicable
        if (orderId) {
            await prisma.$executeRawUnsafe(`
                UPDATE orders
                SET payment_status = 'PAID', status = 'CONFIRMED', updated_at = NOW()
                WHERE id = $1
            `, orderId);
        }

        console.log(`Payment recorded: ${paymentId}`);
    } catch (error) {
        console.error('Error handling Razorpay payment capture:', error);
    }
}

// Handle failed payment
async function handlePaymentFailed(payment: any, webhookLogId: string) {
    console.log(`❌ Razorpay payment failed: ${payment.id}`);
    
    const notes = payment.notes || {};
    const tenantId = notes.tenantId;
    const invoiceId = notes.invoiceId;
    const orderId = notes.orderId;

    try {
        const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        if (invoiceId) {
            await prisma.$executeRawUnsafe(`
                INSERT INTO payment_records (
                    id, invoice_id, amount, method, reference, status, notes,
                    currency, gateway, gateway_transaction_id, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `,
                paymentId,
                invoiceId,
                payment.amount / 100,
                payment.method?.toUpperCase() || 'RAZORPAY',
                payment.id,
                'FAILED',
                payment.error_description || 'Payment failed',
                payment.currency?.toUpperCase() || 'INR',
                'RAZORPAY',
                payment.id
            );
        }

        // Log audit
        if (tenantId) {
            await logFinanceAudit({
                tenantId,
                actionType: 'PAYMENT_FAILED',
                actionDescription: `Payment failed: ${payment.error_description || 'Unknown error'}`,
                entityType: 'PAYMENT',
                entityId: paymentId,
                amount: payment.amount / 100,
                currency: payment.currency?.toUpperCase() || 'INR',
                externalReference: payment.id,
                webhookEventId: webhookLogId
            });
        }

        // Update order status
        if (orderId) {
            await prisma.$executeRawUnsafe(`
                UPDATE orders
                SET payment_status = 'FAILED', updated_at = NOW()
                WHERE id = $1
            `, orderId);
        }
    } catch (error) {
        console.error('Error handling Razorpay payment failure:', error);
    }
}

// Handle refund created
async function handleRefundCreated(refund: any, webhookLogId: string) {
    console.log(`💸 Razorpay refund created: ${refund.id}`);

    try {
        const refundAmount = refund.amount / 100;
        
        // Update refund request if exists
        await prisma.$executeRawUnsafe(`
            UPDATE refund_requests
            SET status = 'COMPLETED', 
                gateway_refund_id = $2,
                processed_at = NOW(),
                updated_at = NOW()
            WHERE payment_id = $1 AND status IN ('PROCESSING', 'APPROVED')
        `, refund.payment_id, refund.id);

        // Log audit
        await prisma.$executeRawUnsafe(`
            INSERT INTO finance_audit_logs (
                id, tenant_id, action_type, action_description, entity_type, entity_id,
                amount, currency, external_reference, webhook_event_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `,
            `audit_${Date.now()}`,
            'system',
            'REFUND_PROCESSED',
            `Refund processed via Razorpay: ${refund.id}`,
            'REFUND',
            refund.id,
            refundAmount,
            refund.currency?.toUpperCase() || 'INR',
            refund.id,
            webhookLogId
        );
    } catch (error) {
        console.error('Error handling Razorpay refund:', error);
    }
}

// Handle order paid
async function handleOrderPaid(order: any, payment: any, webhookLogId: string) {
    console.log(`📦 Razorpay order paid: ${order.id}`);
    
    // This is similar to payment.captured but triggered at order level
    if (payment) {
        await handlePaymentCaptured(payment, webhookLogId);
    }
}

// Handle subscription events
async function handleSubscriptionEvent(eventType: string, subscription: any, webhookLogId: string) {
    console.log(`📋 Razorpay subscription event: ${eventType}`);
    
    if (!subscription) return;

    try {
        const notes = subscription.notes || {};
        const tenantId = notes.tenantId;

        if (!tenantId) {
            console.log('No tenant ID in subscription notes');
            return;
        }

        let tenantStatus = 'ACTIVE';
        if (eventType === 'subscription.cancelled') {
            tenantStatus = 'SUSPENDED';
        }

        await prisma.$executeRawUnsafe(`
            UPDATE tenants
            SET status = $2, updated_at = NOW()
            WHERE id = $1
        `, tenantId, tenantStatus);

        await logFinanceAudit({
            tenantId,
            actionType: 'SETTINGS_UPDATED',
            actionDescription: `Subscription ${eventType.split('.').pop()}: ${subscription.status}`,
            entityType: 'SETTINGS',
            entityId: subscription.id,
            externalReference: subscription.id,
            webhookEventId: webhookLogId
        });
    } catch (error) {
        console.error('Error handling Razorpay subscription event:', error);
    }
}

// Handle Razorpay invoice paid
async function handleInvoicePaid(invoice: any, webhookLogId: string) {
    console.log(`📄 Razorpay invoice paid: ${invoice?.id}`);
    
    if (!invoice) return;

    try {
        await prisma.$executeRawUnsafe(`
            INSERT INTO finance_audit_logs (
                id, tenant_id, action_type, action_description, entity_type, entity_id,
                amount, currency, external_reference, webhook_event_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `,
            `audit_${Date.now()}`,
            'system',
            'PAYMENT_RECEIVED',
            `Razorpay invoice paid: ${invoice.id}`,
            'INVOICE',
            invoice.id,
            invoice.amount_paid / 100,
            invoice.currency?.toUpperCase() || 'INR',
            invoice.id,
            webhookLogId
        );
    } catch (error) {
        console.error('Error handling Razorpay invoice paid:', error);
    }
}
