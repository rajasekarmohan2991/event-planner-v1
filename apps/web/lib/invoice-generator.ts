import { sendEmail } from './email'

export type InvoiceType = 'EXHIBITOR' | 'SPONSOR' | 'SPEAKER' | 'VENDOR'

export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate?: Date

  // Payer details
  payerName: string
  payerEmail: string
  payerPhone?: string
  payerCompany?: string
  payerAddress?: string

  // Event details
  eventId: string
  eventName: string
  eventDate?: Date

  // Payment details
  type: InvoiceType
  description: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    amount: number
  }>

  subtotal: number
  tax: number
  taxRate: number
  discount?: number
  total: number

  // Payment info
  paymentMethod?: string
  paymentReference?: string
  paymentDate?: Date
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE'

  // Bank details for payment
  bankDetails?: {
    bankName: string
    accountNumber: string
    ifscCode: string
    accountHolderName: string
    upiId?: string
  }

  notes?: string
}

export function generateInvoiceHTML(data: InvoiceData): string {
  const isPaid = data.paymentStatus === 'PAID'
  const statusColor = isPaid ? '#10B981' : data.paymentStatus === 'OVERDUE' ? '#EF4444' : '#F59E0B'
  const statusBg = isPaid ? '#D1FAE5' : data.paymentStatus === 'OVERDUE' ? '#FEE2E2' : '#FEF3C7'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${data.paymentStatus === 'PAID' ? 'Payment Receipt' : 'Invoice'} ${data.invoiceNumber}</title>
  <style>
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .invoice-container { 
      max-width: 800px; 
      margin: 0 auto; 
      background: white;
      box-shadow: 0 0 20px rgba(0,0,0,0.1);
    }
    .invoice-header {
      background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
      color: white;
      padding: 40px;
      display: flex;
      justify-content: space-between;
      align-items: start;
    }
    .company-info h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: bold;
    }
    .company-info p {
      margin: 5px 0;
      opacity: 0.9;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      margin: 0;
      font-size: 36px;
      font-weight: bold;
    }
    .invoice-title .invoice-number {
      font-size: 14px;
      opacity: 0.8;
      margin-top: 5px;
    }
    .invoice-body {
      padding: 40px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: bold;
      font-size: 14px;
      margin-bottom: 20px;
      background: ${statusBg};
      color: ${statusColor};
      border: 2px solid ${statusColor};
    }
    .info-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    .info-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2d2d2d;
    }
    .info-box h3 {
      margin: 0 0 15px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
      letter-spacing: 1px;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .info-box strong {
      color: #1a1a1a;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 30px 0;
    }
    .items-table thead {
      background: #f9f9f9;
    }
    .items-table th {
      padding: 15px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e5e5;
      text-transform: uppercase;
      font-size: 12px;
      color: #666;
      letter-spacing: 0.5px;
    }
    .items-table td {
      padding: 15px;
      border-bottom: 1px solid #f0f0f0;
    }
    .items-table tr:hover {
      background: #fafafa;
    }
    .text-right {
      text-align: right;
    }
    .totals-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .totals-box {
      width: 350px;
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .total-row.grand-total {
      border-top: 2px solid #2d2d2d;
      border-bottom: none;
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
      margin-top: 10px;
      padding-top: 15px;
    }
    .payment-info {
      background: #EFF6FF;
      border: 2px solid #3B82F6;
      border-radius: 8px;
      padding: 20px;
      margin: 30px 0;
    }
    .payment-info h3 {
      margin: 0 0 15px 0;
      color: #1E40AF;
      font-size: 16px;
    }
    .payment-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }
    .payment-detail {
      font-size: 14px;
    }
    .payment-detail strong {
      display: block;
      color: #1E40AF;
      margin-bottom: 5px;
    }
    .bank-details {
      background: #FEF3C7;
      border: 2px solid #F59E0B;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .bank-details h3 {
      margin: 0 0 15px 0;
      color: #92400E;
      font-size: 16px;
    }
    .bank-detail {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #FDE68A;
      font-size: 14px;
    }
    .bank-detail:last-child {
      border-bottom: none;
    }
    .bank-detail strong {
      color: #92400E;
    }
    .notes {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin-top: 30px;
      border-left: 4px solid #2d2d2d;
    }
    .notes h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      text-transform: uppercase;
      color: #666;
    }
    .notes p {
      margin: 5px 0;
      font-size: 14px;
      color: #555;
    }
    .footer {
      background: #1a1a1a;
      color: white;
      padding: 30px 40px;
      text-align: center;
    }
    .footer p {
      margin: 5px 0;
      opacity: 0.8;
      font-size: 13px;
    }
    @media print {
      body { background: white; padding: 0; }
      .invoice-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="invoice-header">
      <div class="company-info">
        <h1>Ayphen Event Planner</h1>
        <p>Professional Event Management</p>
        <p>Email: billing@ayphen.com</p>
        <p>Phone: +91 (800) 123-4567</p>
      </div>
      <div class="invoice-title">
        <h2>${data.paymentStatus === 'PAID' ? 'PAYMENT RECEIPT' : 'INVOICE'}</h2>
        <div class="invoice-number">#${data.invoiceNumber}</div>
      </div>
    </div>

    <!-- Body -->
    <div class="invoice-body">
      <!-- Status Badge -->
      <div class="status-badge">
        ${data.paymentStatus === 'PAID' ? '✓ PAID' : data.paymentStatus === 'OVERDUE' ? '⚠ OVERDUE' : '⏳ PENDING'}
      </div>

      <!-- Info Section -->
      <div class="info-section">
        <div class="info-box">
          <h3>Bill To</h3>
          <p><strong>${data.payerName}</strong></p>
          ${data.payerCompany ? `<p>${data.payerCompany}</p>` : ''}
          <p>${data.payerEmail}</p>
          ${data.payerPhone ? `<p>${data.payerPhone}</p>` : ''}
          ${data.payerAddress ? `<p>${data.payerAddress}</p>` : ''}
        </div>
        
        <div class="info-box">
          <h3>Invoice Details</h3>
          <p><strong>Invoice Date:</strong> ${data.invoiceDate.toLocaleDateString()}</p>
          ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</p>` : ''}
          <p><strong>Event:</strong> ${data.eventName}</p>
          ${data.eventDate ? `<p><strong>Event Date:</strong> ${data.eventDate.toLocaleDateString()}</p>` : ''}
          <p><strong>Type:</strong> ${data.type}</p>
        </div>
      </div>

      <!-- Items Table -->
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="text-right">Qty</th>
            <th class="text-right">Unit Price</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${data.items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td class="text-right">${item.quantity}</td>
              <td class="text-right">₹${item.unitPrice.toLocaleString()}</td>
              <td class="text-right">₹${item.amount.toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-box">
          <div class="total-row">
            <span>Subtotal</span>
            <span>₹${data.subtotal.toLocaleString()}</span>
          </div>
          ${data.discount ? `
          <div class="total-row">
            <span>Discount</span>
            <span>-₹${data.discount.toLocaleString()}</span>
          </div>
          ` : ''}
          <div class="total-row">
            <span>Tax (${data.taxRate}%)</span>
            <span>₹${data.tax.toLocaleString()}</span>
          </div>
          <div class="total-row grand-total">
            <span>Total Amount</span>
            <span>₹${data.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      ${data.paymentStatus === 'PAID' && data.paymentDate ? `
      <!-- Payment Info -->
      <div class="payment-info">
        <h3>✓ Payment Received</h3>
        <div class="payment-details">
          <div class="payment-detail">
            <strong>Payment Date</strong>
            <span>${data.paymentDate.toLocaleDateString()}</span>
          </div>
          <div class="payment-detail">
            <strong>Payment Method</strong>
            <span>${data.paymentMethod || 'N/A'}</span>
          </div>
          ${data.paymentReference ? `
          <div class="payment-detail">
            <strong>Reference Number</strong>
            <span>${data.paymentReference}</span>
          </div>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${data.paymentStatus !== 'PAID' && data.bankDetails ? `
      <!-- Bank Details -->
      <div class="bank-details">
        <h3>Bank Details for Payment</h3>
        <div class="bank-detail">
          <strong>Bank Name:</strong>
          <span>${data.bankDetails.bankName}</span>
        </div>
        <div class="bank-detail">
          <strong>Account Number:</strong>
          <span>${data.bankDetails.accountNumber}</span>
        </div>
        <div class="bank-detail">
          <strong>IFSC Code:</strong>
          <span>${data.bankDetails.ifscCode}</span>
        </div>
        <div class="bank-detail">
          <strong>Account Holder:</strong>
          <span>${data.bankDetails.accountHolderName}</span>
        </div>
        ${data.bankDetails.upiId ? `
        <div class="bank-detail">
          <strong>UPI ID:</strong>
          <span>${data.bankDetails.upiId}</span>
        </div>
        ` : ''}
      </div>
      ` : ''}

      ${data.notes ? `
      <!-- Notes -->
      <div class="notes">
        <h3>Notes</h3>
        <p>${data.notes}</p>
      </div>
      ` : ''}
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Thank you for your business!</strong></p>
      <p>This is a computer-generated invoice and does not require a signature.</p>
      <p>For any queries, please contact us at billing@ayphen.com</p>
    </div>
  </div>
</body>
</html>
  `
}

export async function sendInvoiceEmail(data: InvoiceData): Promise<boolean> {
  try {
    const invoiceHTML = generateInvoiceHTML(data)

    const subject = data.paymentStatus === 'PAID'
      ? `Payment Receipt - Invoice ${data.invoiceNumber}`
      : `Invoice ${data.invoiceNumber} - ${data.eventName}`

    await sendEmail({
      to: data.payerEmail,
      subject,
      html: invoiceHTML,
      text: `
Invoice ${data.invoiceNumber}
${data.eventName}

Bill To: ${data.payerName}
${data.payerCompany || ''}

Items:
${data.items.map(item => `${item.description}: ₹${item.amount.toLocaleString()}`).join('\n')}

Subtotal: ₹${data.subtotal.toLocaleString()}
Tax (${data.taxRate}%): ₹${data.tax.toLocaleString()}
Total: ₹${data.total.toLocaleString()}

Status: ${data.paymentStatus}
${data.paymentDate ? `Payment Date: ${data.paymentDate.toLocaleDateString()}` : ''}

Thank you for your business!
Ayphen Event Planner
      `
    })

    console.log(`✅ Invoice ${data.invoiceNumber} sent to ${data.payerEmail}`)
    return true
  } catch (error) {
    console.error(`❌ Failed to send invoice ${data.invoiceNumber}:`, error)
    return false
  }
}

export function generateInvoiceNumber(type: InvoiceType, eventId: string): string {
  const prefix = {
    EXHIBITOR: 'EXH',
    SPONSOR: 'SPO',
    SPEAKER: 'SPK',
    VENDOR: 'VEN'
  }[type]

  const timestamp = Date.now().toString().slice(-8)
  const eventPrefix = eventId.slice(0, 4)

  return `${prefix}-${eventPrefix}-${timestamp}`
}
