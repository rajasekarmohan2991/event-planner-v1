import prisma from '@/lib/prisma';

export type EmailTemplate = 
    | 'INVOICE_CREATED'
    | 'INVOICE_SENT'
    | 'INVOICE_REMINDER'
    | 'INVOICE_OVERDUE'
    | 'PAYMENT_RECEIVED'
    | 'PAYMENT_FAILED'
    | 'REFUND_REQUESTED'
    | 'REFUND_APPROVED'
    | 'REFUND_PROCESSED'
    | 'PAYOUT_INITIATED'
    | 'PAYOUT_COMPLETED'
    | 'TDS_CERTIFICATE'
    | 'CONSENT_CONFIRMATION';

export interface EmailData {
    to: string;
    subject: string;
    template: EmailTemplate;
    data: Record<string, any>;
    tenantId?: string;
    eventId?: string | bigint;
}

/**
 * Send email notification (placeholder - integrate with SendGrid/Resend/etc.)
 */
export async function sendEmail(emailData: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
        console.log(`📧 Sending email: ${emailData.template} to ${emailData.to}`);
        
        // Generate email content based on template
        const { subject, html } = generateEmailContent(emailData.template, emailData.data);
        
        // TODO: Integrate with actual email service
        // For now, log the email and return success
        
        // Check if email service is configured
        const emailProvider = process.env.EMAIL_PROVIDER; // SENDGRID, RESEND, SMTP
        
        if (emailProvider === 'SENDGRID' && process.env.SENDGRID_API_KEY) {
            // SendGrid integration
            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    personalizations: [{ to: [{ email: emailData.to }] }],
                    from: { 
                        email: process.env.EMAIL_FROM || 'noreply@eventplanner.com',
                        name: process.env.EMAIL_FROM_NAME || 'Event Planner'
                    },
                    subject: emailData.subject || subject,
                    content: [{ type: 'text/html', value: html }]
                })
            });

            if (response.ok) {
                return { success: true, messageId: `sg_${Date.now()}` };
            } else {
                const error = await response.text();
                console.error('SendGrid error:', error);
                return { success: false, error };
            }
        } else if (emailProvider === 'RESEND' && process.env.RESEND_API_KEY) {
            // Resend integration
            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: process.env.EMAIL_FROM || 'noreply@eventplanner.com',
                    to: emailData.to,
                    subject: emailData.subject || subject,
                    html
                })
            });

            const result = await response.json();
            if (response.ok) {
                return { success: true, messageId: result.id };
            } else {
                return { success: false, error: result.message };
            }
        } else {
            // No email provider configured - log only
            console.log('Email content:', { to: emailData.to, subject, html: html.substring(0, 200) + '...' });
            return { success: true, messageId: `mock_${Date.now()}` };
        }
    } catch (error: any) {
        console.error('Email send error:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Generate email content based on template
 */
function generateEmailContent(template: EmailTemplate, data: Record<string, any>): { subject: string; html: string } {
    const templates: Record<EmailTemplate, { subject: string; html: string }> = {
        INVOICE_CREATED: {
            subject: `Invoice ${data.invoiceNumber} Created`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Invoice Created</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>A new invoice has been created for you:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                    </div>
                    <p>Please review and process the payment at your earliest convenience.</p>
                    <a href="${data.paymentLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Pay Now</a>
                </div>
            `
        },
        INVOICE_SENT: {
            subject: `Invoice ${data.invoiceNumber} from ${data.companyName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Invoice from ${data.companyName}</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Please find attached your invoice:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount Due:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                        ${data.eventName ? `<p><strong>Event:</strong> ${data.eventName}</p>` : ''}
                    </div>
                    ${data.customMessage ? `<p>${data.customMessage}</p>` : ''}
                    <a href="${data.viewLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Invoice</a>
                </div>
            `
        },
        INVOICE_REMINDER: {
            subject: `Reminder: Invoice ${data.invoiceNumber} Due Soon`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">Payment Reminder</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>This is a friendly reminder that your invoice is due soon:</p>
                    <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount Due:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Due Date:</strong> ${data.dueDate}</p>
                        <p><strong>Days Until Due:</strong> ${data.daysUntilDue}</p>
                    </div>
                    <a href="${data.paymentLink}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Pay Now</a>
                </div>
            `
        },
        INVOICE_OVERDUE: {
            subject: `OVERDUE: Invoice ${data.invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ef4444;">Invoice Overdue</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Your invoice is now overdue. Please process the payment immediately:</p>
                    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount Due:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Original Due Date:</strong> ${data.dueDate}</p>
                        <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
                    </div>
                    <a href="${data.paymentLink}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Pay Now</a>
                </div>
            `
        },
        PAYMENT_RECEIVED: {
            subject: `Payment Received - ${data.invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Payment Received</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Thank you! We have received your payment:</p>
                    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount Paid:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
                        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                    </div>
                    <a href="${data.receiptLink}" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Receipt</a>
                </div>
            `
        },
        PAYMENT_FAILED: {
            subject: `Payment Failed - ${data.invoiceNumber}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #ef4444;">Payment Failed</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Unfortunately, your payment could not be processed:</p>
                    <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
                        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Reason:</strong> ${data.failureReason}</p>
                    </div>
                    <p>Please try again or use a different payment method.</p>
                    <a href="${data.paymentLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Retry Payment</a>
                </div>
            `
        },
        REFUND_REQUESTED: {
            subject: `Refund Request Received - ${data.refundId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Refund Request Received</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>We have received your refund request:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Request ID:</strong> ${data.refundId}</p>
                        <p><strong>Original Amount:</strong> ${data.currency} ${data.originalAmount}</p>
                        <p><strong>Refund Amount:</strong> ${data.currency} ${data.refundAmount}</p>
                        <p><strong>Reason:</strong> ${data.reason}</p>
                    </div>
                    <p>We will review your request and get back to you within 2-3 business days.</p>
                </div>
            `
        },
        REFUND_APPROVED: {
            subject: `Refund Approved - ${data.refundId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Refund Approved</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Your refund request has been approved:</p>
                    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Request ID:</strong> ${data.refundId}</p>
                        <p><strong>Refund Amount:</strong> ${data.currency} ${data.refundAmount}</p>
                    </div>
                    <p>The refund will be processed within 5-7 business days.</p>
                </div>
            `
        },
        REFUND_PROCESSED: {
            subject: `Refund Processed - ${data.refundId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Refund Processed</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Your refund has been processed successfully:</p>
                    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Refund Amount:</strong> ${data.currency} ${data.refundAmount}</p>
                        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
                    </div>
                    <p>The amount should reflect in your account within 5-7 business days.</p>
                </div>
            `
        },
        PAYOUT_INITIATED: {
            subject: `Payout Initiated - ${data.payoutId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Payout Initiated</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>A payout has been initiated to your account:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Payout ID:</strong> ${data.payoutId}</p>
                        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
                        ${data.tdsAmount ? `<p><strong>TDS Deducted:</strong> ${data.currency} ${data.tdsAmount}</p>` : ''}
                        ${data.netAmount ? `<p><strong>Net Amount:</strong> ${data.currency} ${data.netAmount}</p>` : ''}
                    </div>
                    <p>Expected to arrive within 2-3 business days.</p>
                </div>
            `
        },
        PAYOUT_COMPLETED: {
            subject: `Payout Completed - ${data.payoutId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Payout Completed</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Your payout has been completed:</p>
                    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Amount:</strong> ${data.currency} ${data.amount}</p>
                        <p><strong>Bank:</strong> ${data.bankName}</p>
                        <p><strong>Reference:</strong> ${data.reference}</p>
                    </div>
                </div>
            `
        },
        TDS_CERTIFICATE: {
            subject: `TDS Certificate - ${data.financialYear}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">TDS Certificate</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Please find your TDS certificate for the financial year ${data.financialYear}:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Certificate Number:</strong> ${data.certificateNumber}</p>
                        <p><strong>Total TDS Deducted:</strong> ₹${data.totalTds}</p>
                        <p><strong>Period:</strong> ${data.period}</p>
                    </div>
                    <a href="${data.downloadLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Download Certificate</a>
                </div>
            `
        },
        CONSENT_CONFIRMATION: {
            subject: `Consent Recorded - ${data.documentType}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Consent Recorded</h2>
                    <p>Dear ${data.recipientName},</p>
                    <p>Your consent has been recorded:</p>
                    <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p><strong>Document:</strong> ${data.documentType}</p>
                        <p><strong>Version:</strong> ${data.documentVersion}</p>
                        <p><strong>Date:</strong> ${data.consentDate}</p>
                    </div>
                    <p>A copy of the document has been saved for your records.</p>
                </div>
            `
        }
    };

    return templates[template] || { subject: 'Notification', html: '<p>You have a new notification.</p>' };
}

/**
 * Send invoice reminder emails for upcoming/overdue invoices
 */
export async function sendInvoiceReminders(): Promise<{ sent: number; errors: number }> {
    let sent = 0;
    let errors = 0;

    try {
        // Get invoices due in 3 days
        const upcomingInvoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.number, i.due_date, i.grand_total, i.currency,
                i.recipient_name, i.recipient_email, i.tenant_id
            FROM invoices i
            WHERE i.status IN ('SENT', 'PARTIAL')
            AND i.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'
            AND i.recipient_email IS NOT NULL
        `);

        for (const invoice of upcomingInvoices) {
            const result = await sendEmail({
                to: invoice.recipient_email,
                subject: `Reminder: Invoice ${invoice.number} Due Soon`,
                template: 'INVOICE_REMINDER',
                data: {
                    recipientName: invoice.recipient_name,
                    invoiceNumber: invoice.number,
                    amount: invoice.grand_total,
                    currency: invoice.currency,
                    dueDate: new Date(invoice.due_date).toLocaleDateString(),
                    daysUntilDue: Math.ceil((new Date(invoice.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                    paymentLink: `${process.env.NEXTAUTH_URL}/pay/${invoice.id}`
                },
                tenantId: invoice.tenant_id
            });

            if (result.success) sent++;
            else errors++;
        }

        // Get overdue invoices
        const overdueInvoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.number, i.due_date, i.grand_total, i.currency,
                i.recipient_name, i.recipient_email, i.tenant_id
            FROM invoices i
            WHERE i.status IN ('SENT', 'PARTIAL')
            AND i.due_date < NOW()
            AND i.recipient_email IS NOT NULL
        `);

        for (const invoice of overdueInvoices) {
            // Update status to OVERDUE
            await prisma.$executeRawUnsafe(`
                UPDATE invoices SET status = 'OVERDUE', updated_at = NOW() WHERE id = $1
            `, invoice.id);

            const result = await sendEmail({
                to: invoice.recipient_email,
                subject: `OVERDUE: Invoice ${invoice.number}`,
                template: 'INVOICE_OVERDUE',
                data: {
                    recipientName: invoice.recipient_name,
                    invoiceNumber: invoice.number,
                    amount: invoice.grand_total,
                    currency: invoice.currency,
                    dueDate: new Date(invoice.due_date).toLocaleDateString(),
                    daysOverdue: Math.ceil((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)),
                    paymentLink: `${process.env.NEXTAUTH_URL}/pay/${invoice.id}`
                },
                tenantId: invoice.tenant_id
            });

            if (result.success) sent++;
            else errors++;
        }

        console.log(`Invoice reminders sent: ${sent}, errors: ${errors}`);
    } catch (error) {
        console.error('Error sending invoice reminders:', error);
    }

    return { sent, errors };
}
