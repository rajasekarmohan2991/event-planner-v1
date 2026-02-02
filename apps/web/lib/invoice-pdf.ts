import prisma from '@/lib/prisma';

export interface InvoiceData {
    id: string;
    number: string;
    date: Date;
    dueDate: Date;
    currency: string;
    
    // Company (Seller)
    companyName: string;
    companyAddress?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyLogo?: string;
    companyTaxId?: string;
    
    // Recipient (Buyer)
    recipientName: string;
    recipientEmail?: string;
    recipientAddress?: string;
    recipientTaxId?: string;
    
    // Event
    eventName?: string;
    eventDate?: Date;
    
    // Line Items
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        total: number;
    }[];
    
    // Totals
    subtotal: number;
    taxTotal: number;
    discountTotal: number;
    grandTotal: number;
    
    // Additional
    notes?: string;
    terms?: string;
    paymentTerms?: number;
    signatureUrl?: string;
    footer?: string;
}

/**
 * Generate HTML invoice template
 */
export function generateInvoiceHTML(data: InvoiceData): string {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency || 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const itemsHTML = data.items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.taxRate}%</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.total)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Invoice ${data.number}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1f2937; line-height: 1.5; }
        .invoice { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .logo { max-height: 60px; }
        .invoice-title { font-size: 32px; font-weight: bold; color: #3b82f6; }
        .invoice-number { color: #6b7280; margin-top: 4px; }
        .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .party { width: 45%; }
        .party-label { font-size: 12px; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; }
        .party-name { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
        .party-details { color: #4b5563; font-size: 14px; }
        .invoice-meta { background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .meta-label { color: #6b7280; }
        .meta-value { font-weight: 500; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        .totals { margin-left: auto; width: 300px; }
        .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        .total-row.grand { font-size: 18px; font-weight: bold; border-bottom: 2px solid #3b82f6; color: #3b82f6; }
        .notes { background: #fefce8; padding: 16px; border-radius: 8px; margin-bottom: 20px; }
        .notes-title { font-weight: 600; margin-bottom: 8px; }
        .terms { color: #6b7280; font-size: 12px; margin-bottom: 20px; }
        .signature { margin-top: 40px; }
        .signature img { max-height: 60px; }
        .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .invoice { padding: 20px; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <div>
                ${data.companyLogo ? `<img src="${data.companyLogo}" alt="Logo" class="logo">` : ''}
                <div class="party-name" style="margin-top: 8px;">${data.companyName}</div>
                ${data.companyTaxId ? `<div class="party-details">Tax ID: ${data.companyTaxId}</div>` : ''}
            </div>
            <div style="text-align: right;">
                <div class="invoice-title">INVOICE</div>
                <div class="invoice-number">${data.number}</div>
            </div>
        </div>

        <div class="parties">
            <div class="party">
                <div class="party-label">From</div>
                <div class="party-name">${data.companyName}</div>
                <div class="party-details">
                    ${data.companyAddress ? `${data.companyAddress}<br>` : ''}
                    ${data.companyEmail ? `${data.companyEmail}<br>` : ''}
                    ${data.companyPhone || ''}
                </div>
            </div>
            <div class="party">
                <div class="party-label">Bill To</div>
                <div class="party-name">${data.recipientName}</div>
                <div class="party-details">
                    ${data.recipientAddress ? `${data.recipientAddress}<br>` : ''}
                    ${data.recipientEmail ? `${data.recipientEmail}<br>` : ''}
                    ${data.recipientTaxId ? `Tax ID: ${data.recipientTaxId}` : ''}
                </div>
            </div>
        </div>

        <div class="invoice-meta">
            <div class="meta-row">
                <span class="meta-label">Invoice Date</span>
                <span class="meta-value">${formatDate(data.date)}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Due Date</span>
                <span class="meta-value">${formatDate(data.dueDate)}</span>
            </div>
            ${data.paymentTerms ? `
            <div class="meta-row">
                <span class="meta-label">Payment Terms</span>
                <span class="meta-value">Net ${data.paymentTerms} Days</span>
            </div>
            ` : ''}
            ${data.eventName ? `
            <div class="meta-row">
                <span class="meta-label">Event</span>
                <span class="meta-value">${data.eventName}${data.eventDate ? ` (${formatDate(data.eventDate)})` : ''}</span>
            </div>
            ` : ''}
        </div>

        <table>
            <thead>
                <tr>
                    <th style="width: 40%;">Description</th>
                    <th style="width: 10%; text-align: center;">Qty</th>
                    <th style="width: 20%; text-align: right;">Unit Price</th>
                    <th style="width: 10%; text-align: center;">Tax</th>
                    <th style="width: 20%; text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal</span>
                <span>${formatCurrency(data.subtotal)}</span>
            </div>
            ${data.discountTotal > 0 ? `
            <div class="total-row">
                <span>Discount</span>
                <span>-${formatCurrency(data.discountTotal)}</span>
            </div>
            ` : ''}
            <div class="total-row">
                <span>Tax</span>
                <span>${formatCurrency(data.taxTotal)}</span>
            </div>
            <div class="total-row grand">
                <span>Total Due</span>
                <span>${formatCurrency(data.grandTotal)}</span>
            </div>
        </div>

        ${data.notes ? `
        <div class="notes">
            <div class="notes-title">Notes</div>
            <div>${data.notes}</div>
        </div>
        ` : ''}

        ${data.terms ? `
        <div class="terms">
            <strong>Terms & Conditions:</strong> ${data.terms}
        </div>
        ` : ''}

        ${data.signatureUrl ? `
        <div class="signature">
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">Authorized Signature</div>
            <img src="${data.signatureUrl}" alt="Signature">
        </div>
        ` : ''}

        <div class="footer">
            ${data.footer || `Thank you for your business!`}
            <br>
            <span style="color: #d1d5db;">Invoice generated on ${formatDate(new Date())}</span>
        </div>
    </div>
</body>
</html>
    `;
}

/**
 * Fetch invoice data from database and generate HTML
 */
export async function getInvoiceHTML(invoiceId: string): Promise<string | null> {
    try {
        // Fetch invoice with all related data
        const invoices = await prisma.$queryRawUnsafe<any[]>(`
            SELECT 
                i.id, i.number, i.date, i.due_date, i.currency, i.payment_terms,
                i.recipient_name, i.recipient_email, i.recipient_address, i.recipient_tax_id,
                i.subtotal, i.tax_total, i.discount_total, i.grand_total,
                i.notes, i.terms, i.signature_url,
                t.name as company_name, t.billing_email as company_email, t.logo as company_logo,
                fs.tax_registration_number as company_tax_id, fs.invoice_footer,
                e.name as event_name, e.start_date as event_date
            FROM invoices i
            LEFT JOIN tenants t ON i.tenant_id = t.id
            LEFT JOIN finance_settings fs ON i.tenant_id = fs.tenant_id
            LEFT JOIN events e ON i.event_id = e.id
            WHERE i.id = $1
        `, invoiceId);

        if (invoices.length === 0) {
            return null;
        }

        const invoice = invoices[0];

        // Fetch line items
        const items = await prisma.$queryRawUnsafe<any[]>(`
            SELECT description, quantity, unit_price, tax_rate, tax_amount, total
            FROM invoice_line_items
            WHERE invoice_id = $1
            ORDER BY id
        `, invoiceId);

        const invoiceData: InvoiceData = {
            id: invoice.id,
            number: invoice.number,
            date: invoice.date,
            dueDate: invoice.due_date,
            currency: invoice.currency,
            companyName: invoice.company_name || 'Company',
            companyEmail: invoice.company_email,
            companyLogo: invoice.company_logo,
            companyTaxId: invoice.company_tax_id,
            recipientName: invoice.recipient_name,
            recipientEmail: invoice.recipient_email,
            recipientAddress: invoice.recipient_address,
            recipientTaxId: invoice.recipient_tax_id,
            eventName: invoice.event_name,
            eventDate: invoice.event_date,
            items: items.map(item => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: parseFloat(item.unit_price),
                taxRate: parseFloat(item.tax_rate),
                taxAmount: parseFloat(item.tax_amount),
                total: parseFloat(item.total)
            })),
            subtotal: parseFloat(invoice.subtotal),
            taxTotal: parseFloat(invoice.tax_total),
            discountTotal: parseFloat(invoice.discount_total),
            grandTotal: parseFloat(invoice.grand_total),
            notes: invoice.notes,
            terms: invoice.terms,
            paymentTerms: invoice.payment_terms,
            signatureUrl: invoice.signature_url,
            footer: invoice.invoice_footer
        };

        return generateInvoiceHTML(invoiceData);
    } catch (error) {
        console.error('Error generating invoice HTML:', error);
        return null;
    }
}

/**
 * Generate a simple receipt HTML
 */
export function generateReceiptHTML(data: {
    receiptNumber: string;
    date: Date;
    companyName: string;
    customerName: string;
    customerEmail?: string;
    items: { description: string; amount: number }[];
    total: number;
    currency: string;
    paymentMethod: string;
    transactionId?: string;
}): string {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: data.currency || 'USD'
        }).format(amount);
    };

    const itemsHTML = data.items.map(item => `
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
            <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Receipt ${data.receiptNumber}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 20px; }
        .receipt-title { font-size: 24px; font-weight: bold; }
        .company { font-size: 18px; margin-top: 8px; }
        .meta { background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; }
        .total { font-size: 20px; font-weight: bold; text-align: right; margin-top: 16px; padding-top: 16px; border-top: 2px solid #000; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="receipt-title">RECEIPT</div>
        <div class="company">${data.companyName}</div>
    </div>
    
    <div class="meta">
        <div><strong>Receipt #:</strong> ${data.receiptNumber}</div>
        <div><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</div>
        <div><strong>Customer:</strong> ${data.customerName}</div>
        ${data.customerEmail ? `<div><strong>Email:</strong> ${data.customerEmail}</div>` : ''}
        <div><strong>Payment:</strong> ${data.paymentMethod}</div>
        ${data.transactionId ? `<div><strong>Transaction:</strong> ${data.transactionId}</div>` : ''}
    </div>
    
    <table>
        <tbody>
            ${itemsHTML}
        </tbody>
    </table>
    
    <div class="total">
        Total: ${formatCurrency(data.total)}
    </div>
    
    <div class="footer">
        Thank you for your payment!
    </div>
</body>
</html>
    `;
}
