import { NextRequest, NextResponse } from 'next/server';
import { constructWebhookEvent } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import { logFinanceAudit } from '@/lib/finance-audit';

export const dynamic = 'force-dynamic';

// Disable body parsing - we need raw body for webhook signature verification
export const runtime = 'nodejs';

// POST /api/webhooks/stripe - Handle Stripe webhook events
export async function POST(req: NextRequest) {
    try {
        const payload = await req.text();
        const signature = req.headers.get('stripe-signature');

        if (!signature) {
            console.error('Missing Stripe signature');
            return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
        }

        // Verify webhook signature
        const result = constructWebhookEvent(payload, signature);
        
        if (!result.success) {
            console.error('Webhook signature verification failed:', result.error);
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

        const event = result.event;
        console.log(`📥 Stripe webhook received: ${event.type}`);

        // Log webhook to database
        const webhookLogId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            await prisma.$executeRawUnsafe(`
                INSERT INTO payment_webhook_logs (
                    id, gateway, event_type, event_id, payload, signature_valid, received_at
                ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            `, webhookLogId, 'STRIPE', event.type, event.id, JSON.stringify(event), true);
        } catch (logError) {
            console.warn('Failed to log webhook:', logError);
        }

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentIntentSucceeded(event.data.object, webhookLogId);
                break;

            case 'payment_intent.payment_failed':
                await handlePaymentIntentFailed(event.data.object, webhookLogId);
                break;

            case 'charge.refunded':
                await handleChargeRefunded(event.data.object, webhookLogId);
                break;

            case 'charge.dispute.created':
                await handleDisputeCreated(event.data.object, webhookLogId);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                await handleSubscriptionEvent(event.type, event.data.object, webhookLogId);
                break;

            case 'invoice.paid':
                await handleInvoicePaid(event.data.object, webhookLogId);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object, webhookLogId);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
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
        console.error('Webhook error:', error);
        return NextResponse.json({ 
            error: 'Webhook handler failed',
            details: error.message 
        }, { status: 500 });
    }
}

// Handle successful payment
async function handlePaymentIntentSucceeded(paymentIntent: any, webhookLogId: string) {
    console.log(`✅ Payment succeeded: ${paymentIntent.id}`);
    
    const metadata = paymentIntent.metadata || {};
    const tenantId = metadata.tenantId;
    const invoiceId = metadata.invoiceId;
    const eventId = metadata.eventId;
    const orderId = metadata.orderId;

    try {
        // Create payment record
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
                paymentIntent.amount / 100, // Convert from cents
                'STRIPE',
                paymentIntent.id,
                'SUCCESS',
                paymentIntent.currency.toUpperCase(),
                'STRIPE',
                paymentIntent.id
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
                actionDescription: `Payment received via Stripe: ${paymentIntent.id}`,
                entityType: 'PAYMENT',
                entityId: paymentId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                externalReference: paymentIntent.id,
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
        console.error('Error handling payment success:', error);
    }
}

// Handle failed payment
async function handlePaymentIntentFailed(paymentIntent: any, webhookLogId: string) {
    console.log(`❌ Payment failed: ${paymentIntent.id}`);
    
    const metadata = paymentIntent.metadata || {};
    const tenantId = metadata.tenantId;
    const invoiceId = metadata.invoiceId;
    const orderId = metadata.orderId;

    try {
        // Create failed payment record
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
                paymentIntent.amount / 100,
                'STRIPE',
                paymentIntent.id,
                'FAILED',
                paymentIntent.last_payment_error?.message || 'Payment failed',
                paymentIntent.currency.toUpperCase(),
                'STRIPE',
                paymentIntent.id
            );
        }

        // Log audit
        if (tenantId) {
            await logFinanceAudit({
                tenantId,
                actionType: 'PAYMENT_FAILED',
                actionDescription: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
                entityType: 'PAYMENT',
                entityId: paymentId,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency.toUpperCase(),
                externalReference: paymentIntent.id,
                webhookEventId: webhookLogId
            });
        }

        // Update order status if applicable
        if (orderId) {
            await prisma.$executeRawUnsafe(`
                UPDATE orders
                SET payment_status = 'FAILED', updated_at = NOW()
                WHERE id = $1
            `, orderId);
        }
    } catch (error) {
        console.error('Error handling payment failure:', error);
    }
}

// Handle refund
async function handleChargeRefunded(charge: any, webhookLogId: string) {
    console.log(`💸 Charge refunded: ${charge.id}`);
    
    const metadata = charge.metadata || {};
    const tenantId = metadata.tenantId;

    try {
        // Find and update refund request if exists
        const refundAmount = charge.amount_refunded / 100;
        
        await prisma.$executeRawUnsafe(`
            UPDATE refund_requests
            SET status = 'COMPLETED', 
                gateway_refund_id = $2,
                processed_at = NOW(),
                updated_at = NOW()
            WHERE payment_id = $1 AND status IN ('PROCESSING', 'APPROVED')
        `, charge.payment_intent, charge.id);

        // Log audit
        if (tenantId) {
            await logFinanceAudit({
                tenantId,
                actionType: 'REFUND_PROCESSED',
                actionDescription: `Refund processed via Stripe: ${charge.id}`,
                entityType: 'REFUND',
                entityId: charge.id,
                amount: refundAmount,
                currency: charge.currency.toUpperCase(),
                externalReference: charge.id,
                webhookEventId: webhookLogId
            });
        }
    } catch (error) {
        console.error('Error handling refund:', error);
    }
}

// Handle dispute
async function handleDisputeCreated(dispute: any, webhookLogId: string) {
    console.log(`⚠️ Dispute created: ${dispute.id}`);
    
    // Log for manual review - disputes need human attention
    try {
        await prisma.$executeRawUnsafe(`
            INSERT INTO finance_audit_logs (
                id, tenant_id, action_type, action_description, entity_type, entity_id,
                amount, currency, external_reference, webhook_event_id, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `,
            `audit_${Date.now()}`,
            'system', // System-level dispute
            'DISPUTE_CREATED',
            `Dispute created for charge ${dispute.charge}: ${dispute.reason}`,
            'PAYMENT',
            dispute.charge,
            dispute.amount / 100,
            dispute.currency.toUpperCase(),
            dispute.id,
            webhookLogId
        );
    } catch (error) {
        console.error('Error logging dispute:', error);
    }
}

// Handle subscription events (for SaaS billing)
async function handleSubscriptionEvent(eventType: string, subscription: any, webhookLogId: string) {
    console.log(`📋 Subscription event: ${eventType} - ${subscription.id}`);
    
    const customerId = subscription.customer;
    const status = subscription.status;

    try {
        // Find tenant by Stripe customer ID
        const tenants = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM tenants WHERE stripe_customer_id = $1 LIMIT 1
        `, customerId);

        if (tenants.length === 0) {
            console.log('No tenant found for customer:', customerId);
            return;
        }

        const tenantId = tenants[0].id;

        // Update tenant subscription status
        let tenantStatus = 'ACTIVE';
        if (status === 'canceled' || status === 'unpaid') {
            tenantStatus = 'SUSPENDED';
        } else if (status === 'trialing') {
            tenantStatus = 'TRIAL';
        }

        await prisma.$executeRawUnsafe(`
            UPDATE tenants
            SET status = $2, 
                subscription_started_at = $3,
                subscription_ends_at = $4,
                updated_at = NOW()
            WHERE id = $1
        `,
            tenantId,
            tenantStatus,
            subscription.current_period_start ? new Date(subscription.current_period_start * 1000) : null,
            subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null
        );

        // Log audit
        await logFinanceAudit({
            tenantId,
            actionType: 'SETTINGS_UPDATED',
            actionDescription: `Subscription ${eventType.split('.').pop()}: ${status}`,
            entityType: 'SETTINGS',
            entityId: subscription.id,
            externalReference: subscription.id,
            webhookEventId: webhookLogId
        });
    } catch (error) {
        console.error('Error handling subscription event:', error);
    }
}

// Handle Stripe invoice paid (for subscriptions)
async function handleInvoicePaid(invoice: any, webhookLogId: string) {
    console.log(`📄 Invoice paid: ${invoice.id}`);
    
    const customerId = invoice.customer;

    try {
        // Find tenant
        const tenants = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM tenants WHERE stripe_customer_id = $1 LIMIT 1
        `, customerId);

        if (tenants.length > 0) {
            await logFinanceAudit({
                tenantId: tenants[0].id,
                actionType: 'PAYMENT_RECEIVED',
                actionDescription: `Subscription invoice paid: ${invoice.id}`,
                entityType: 'INVOICE',
                entityId: invoice.id,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency.toUpperCase(),
                externalReference: invoice.id,
                webhookEventId: webhookLogId
            });
        }
    } catch (error) {
        console.error('Error handling invoice paid:', error);
    }
}

// Handle Stripe invoice payment failed
async function handleInvoicePaymentFailed(invoice: any, webhookLogId: string) {
    console.log(`❌ Invoice payment failed: ${invoice.id}`);
    
    const customerId = invoice.customer;

    try {
        // Find tenant
        const tenants = await prisma.$queryRawUnsafe<any[]>(`
            SELECT id FROM tenants WHERE stripe_customer_id = $1 LIMIT 1
        `, customerId);

        if (tenants.length > 0) {
            await logFinanceAudit({
                tenantId: tenants[0].id,
                actionType: 'PAYMENT_FAILED',
                actionDescription: `Subscription invoice payment failed: ${invoice.id}`,
                entityType: 'INVOICE',
                entityId: invoice.id,
                amount: invoice.amount_due / 100,
                currency: invoice.currency.toUpperCase(),
                externalReference: invoice.id,
                webhookEventId: webhookLogId
            });

            // Could trigger email notification here
        }
    } catch (error) {
        console.error('Error handling invoice payment failed:', error);
    }
}
