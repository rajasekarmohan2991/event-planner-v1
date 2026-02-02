# 📄 Invoice & Payment System - Implementation Plan

## Current Status

### ✅ What Exists
1. **Invoice Generator** (`lib/invoice-generator.ts`)
   - HTML invoice generation
   - Email sending functionality
   - Support for EXHIBITOR, SPONSOR, VENDOR, SPEAKER types
   - Professional invoice template

2. **API Endpoints** (Email only)
   - `/api/events/[id]/exhibitors/[exhibitorId]/generate-invoice` - POST
   - `/api/events/[id]/sponsors/[sponsorId]/generate-invoice` - POST
   - `/api/events/[id]/vendors/[vendorId]/generate-invoice` - POST

### ❌ What's Missing
1. **PDF Generation** - No PDF download capability
2. **Download Endpoints** - No API to download invoices as PDF
3. **Payment Receipts** - No separate receipt generation
4. **Invoice Listing** - No way to view all invoices
5. **Bulk Operations** - No bulk invoice generation

---

## 🎯 Requirements

### For Vendors, Exhibitors, and Sponsors:
1. ✅ Generate invoices (bills)
2. ✅ Generate payment receipts (after payment)
3. ✅ Download as PDF
4. ✅ Email invoices/receipts
5. ✅ View invoice history
6. ✅ Track payment status

---

## 🔧 Implementation Plan

### Phase 1: PDF Generation (Priority 1)
**Files to Create/Modify**:
1. `lib/pdf-generator.ts` - PDF generation utility
2. Update `lib/invoice-generator.ts` - Add PDF export function

**Features**:
- Convert HTML invoice to PDF
- Downloadable PDF format
- Print-friendly layout

### Phase 2: Download Endpoints (Priority 1)
**Files to Create**:
1. `/api/events/[id]/exhibitors/[exhibitorId]/download-invoice/route.ts`
2. `/api/events/[id]/sponsors/[sponsorId]/download-invoice/route.ts`
3. `/api/events/[id]/vendors/[vendorId]/download-invoice/route.ts`

**Features**:
- GET endpoint to download PDF
- Proper headers for PDF download
- File naming: `Invoice-{NUMBER}-{NAME}.pdf`

### Phase 3: Payment Receipts (Priority 2)
**Files to Create**:
1. `lib/receipt-generator.ts` - Receipt template
2. `/api/events/[id]/exhibitors/[exhibitorId]/download-receipt/route.ts`
3. Similar for sponsors and vendors

**Features**:
- Receipt template (different from invoice)
- Only for PAID status
- Includes payment details

### Phase 4: Invoice Management UI (Priority 2)
**Files to Create**:
1. `/app/events/[id]/invoices/page.tsx` - Invoice listing page
2. Components for invoice cards
3. Filter by type, status, date

**Features**:
- List all invoices for an event
- Filter by entity type
- Download buttons
- Regenerate invoices
- Send email

### Phase 5: Bulk Operations (Priority 3)
**Files to Create**:
1. `/api/events/[id]/invoices/bulk-generate/route.ts`
2. `/api/events/[id]/invoices/bulk-download/route.ts`

**Features**:
- Generate all pending invoices
- Download all as ZIP
- Email all invoices

---

## 📋 Detailed Implementation

### 1. PDF Generator Utility

```typescript
// lib/pdf-generator.ts
import html_to_pdf from 'html-pdf-node'

export async function generatePDFFromHTML(html: string): Promise<Buffer> {
  const options = {
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' }
  }
  
  const file = { content: html }
  const pdfBuffer = await html_to_pdf.generatePdf(file, options)
  return pdfBuffer
}
```

### 2. Download Endpoint Example

```typescript
// /api/events/[id]/exhibitors/[exhibitorId]/download-invoice/route.ts
export async function GET(req, { params }) {
  // 1. Get exhibitor and event data
  // 2. Generate invoice HTML
  // 3. Convert to PDF
  // 4. Return PDF with proper headers
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice-${invoiceNumber}.pdf"`
    }
  })
}
```

### 3. Invoice Management Page

```typescript
// /app/events/[id]/invoices/page.tsx
export default function InvoicesPage() {
  return (
    <div>
      <h1>Invoices & Receipts</h1>
      
      {/* Filters */}
      <div>
        <select> {/* Type: All, Exhibitor, Sponsor, Vendor */}
        <select> {/* Status: All, Paid, Pending, Overdue */}
      </div>
      
      {/* Invoice List */}
      <div>
        {invoices.map(invoice => (
          <InvoiceCard 
            invoice={invoice}
            onDownload={() => downloadPDF(invoice.id)}
            onEmail={() => sendEmail(invoice.id)}
          />
        ))}
      </div>
    </div>
  )
}
```

---

## 🎨 UI Components Needed

### Invoice Card Component
```tsx
<div className="invoice-card">
  <div className="invoice-header">
    <span className="invoice-number">#INV-12345</span>
    <span className="status-badge">PAID</span>
  </div>
  <div className="invoice-details">
    <p>Company: ABC Corp</p>
    <p>Amount: ₹50,000</p>
    <p>Date: Jan 7, 2026</p>
  </div>
  <div className="invoice-actions">
    <button>Download PDF</button>
    <button>Email</button>
    <button>View</button>
  </div>
</div>
```

---

## 🗄️ Database Schema (if needed)

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- EXHIBITOR, SPONSOR, VENDOR
  entity_id VARCHAR(255) NOT NULL,
  event_id BIGINT NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  
  status VARCHAR(20) NOT NULL, -- PENDING, PAID, OVERDUE
  invoice_date TIMESTAMP NOT NULL,
  due_date TIMESTAMP,
  paid_at TIMESTAMP,
  
  pdf_url TEXT, -- S3 URL if stored
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoices_event ON invoices(event_id);
CREATE INDEX idx_invoices_entity ON invoices(entity_type, entity_id);
CREATE INDEX idx_invoices_status ON invoices(status);
```

---

## 🚀 Quick Implementation Steps

### Immediate (Today):
1. ✅ Install html-pdf-node
2. ⏳ Create PDF generator utility
3. ⏳ Add download endpoints for exhibitors
4. ⏳ Test PDF generation
5. ⏳ Deploy and verify

### Short-term (This Week):
1. Add download endpoints for sponsors and vendors
2. Create payment receipt templates
3. Add receipt download endpoints
4. Create invoice management UI
5. Add bulk operations

### Long-term (Next Sprint):
1. S3 storage for PDFs
2. Invoice versioning
3. Custom invoice templates
4. Multi-currency support
5. Tax configuration

---

## 📊 Testing Checklist

### PDF Generation:
- [ ] PDF generates correctly
- [ ] All data appears in PDF
- [ ] Formatting is correct
- [ ] Logo and branding visible
- [ ] Print-friendly

### Download:
- [ ] Download button works
- [ ] Correct filename
- [ ] PDF opens correctly
- [ ] No corruption

### Email:
- [ ] Email sends successfully
- [ ] PDF attachment included
- [ ] Email template correct
- [ ] Recipient receives email

### Payment Receipt:
- [ ] Only for PAID invoices
- [ ] Shows payment details
- [ ] Different template from invoice
- [ ] Downloadable

---

## 🎯 Success Criteria

✅ **Invoices**:
- Can generate invoice for any exhibitor/sponsor/vendor
- Can download as PDF
- Can email invoice
- Invoice shows all details correctly

✅ **Receipts**:
- Can generate receipt after payment
- Can download as PDF
- Can email receipt
- Receipt shows payment confirmation

✅ **Management**:
- Can view all invoices in one place
- Can filter by type and status
- Can bulk download
- Can regenerate if needed

---

## 📝 Notes

### PDF Library Choice:
- **html-pdf-node**: Simple, works in serverless
- **Puppeteer**: More powerful but heavy
- **jsPDF**: Client-side, limited styling

### Deployment Considerations:
- Vercel has 50MB limit for serverless functions
- Consider S3 for storing generated PDFs
- Cache PDFs to avoid regeneration
- Use edge functions if possible

### Security:
- Verify user has access to entity
- Check event ownership
- Rate limit PDF generation
- Sanitize file names

---

**Status**: Ready to implement  
**Priority**: High  
**Estimated Time**: 4-6 hours  
**Dependencies**: html-pdf-node (installed)
