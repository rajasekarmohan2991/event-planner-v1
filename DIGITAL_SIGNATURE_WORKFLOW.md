# Digital Signature System - Complete Workflow

## 🎯 **Overview**

A complete digital signature system for Vendors, Sponsors, and Exhibitors to sign Terms & Conditions, Disclaimers, and Contracts.

---

## 📋 **Workflow**

### **Step 1: Event Manager Adds Entity**

```
Event Manager → Events → Vendors/Sponsors/Exhibitors → Add New
  ↓
Fill form: Name, Email, Company, etc.
  ↓
System automatically:
  1. Creates entity record
  2. Generates unique signature token
  3. Creates signature request
  4. Sends email with signature link
```

### **Step 2: Entity Receives Email**

```
Email Subject: "Action Required: Sign Terms & Conditions for [Event Name]"

Body:
  Hi [Name],

  You've been invited to participate in [Event Name] as a [Vendor/Sponsor/Exhibitor].

  Please review and sign the required documents:
  
  👉 Click here to sign: https://ayphen.com/sign/[unique-token]

  This link expires in 7 days.

  Best regards,
  [Event Manager Name]
  [Company Name]
```

### **Step 3: Entity Clicks Link**

```
User clicks link → /sign/[token]
  ↓
System checks:
  1. Is token valid?
  2. Has token expired?
  3. Is document already signed?
  ↓
  ├─ Invalid/Expired → Show error page
  │
  └─ Valid → Check if email exists in Ayphen
      ↓
      ├─ Email exists → Require login
      │   ↓
      │   Login with email → Verify email matches
      │   ↓
      │   Show document
      │
      └─ Email doesn't exist → Require registration
          ↓
          Register with SAME email (validation)
          ↓
          Auto-login after registration
          ↓
          Show document
```

### **Step 4: Review & Sign Document**

```
Document Page:
┌────────────────────────────────────┐
│ Terms & Conditions Agreement       │
│ For: Tech Conference 2026          │
│ Type: VENDOR                       │
├────────────────────────────────────┤
│                                    │
│ [Document Content - Scrollable]    │
│                                    │
│ 1. Payment Terms...                │
│ 2. Cancellation Policy...          │
│ 3. Liability...                    │
│                                    │
├────────────────────────────────────┤
│ ☐ I agree to the terms above       │
│                                    │
│ [Sign Document] [Download PDF]     │
└────────────────────────────────────┘
```

### **Step 5: Signature Captured**

```
User clicks "Sign Document"
  ↓
System records:
  - Signed timestamp
  - User ID
  - IP address
  - Browser/Device info
  ↓
Status updated: PENDING → COMPLETED
  ↓
Email sent to:
  1. Signer (confirmation)
  2. Event Manager (notification)
  ↓
Redirect to success page
```

### **Step 6: Event Manager Views Status**

```
Event Manager → Vendors → View Signatures
┌─────────────────────────────────────────────────────────┐
│ Signature Requests                                      │
├─────────────────────────────────────────────────────────┤
│ Document         Signer         Type      Status  Date  │
│ Terms & Cond.    john@email    VENDOR    ✅ DONE  1/19  │
│ Disclaimer       jane@email    SPONSOR   ⏳ PENDING     │
│ Contract         bob@email     EXHIBITOR ❌ EXPIRED     │
└─────────────────────────────────────────────────────────┘

Actions:
- 👁️ View signed document
- 📥 Download PDF
- 🔄 Resend link (if expired)
- 📧 Send reminder
```

---

## 🗄️ **Database Schema**

### **Table: signature_requests**

```sql
CREATE TABLE signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL,
  entity_type VARCHAR(20) NOT NULL, -- VENDOR, SPONSOR, EXHIBITOR
  entity_id VARCHAR(50) NOT NULL,
  
  -- Signer Information
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL, -- TERMS, DISCLAIMER, CONTRACT
  document_template_id UUID,
  document_content TEXT NOT NULL, -- Snapshot of content at time of request
  
  -- Signature Token
  signature_token VARCHAR(255) UNIQUE NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, EXPIRED, CANCELLED
  
  -- Signature Details
  signed_at TIMESTAMP,
  signed_by_user_id BIGINT,
  signature_ip_address VARCHAR(50),
  signature_user_agent TEXT,
  
  -- Metadata
  tenant_id VARCHAR(255),
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_template FOREIGN KEY (document_template_id) REFERENCES document_templates(id),
  INDEX idx_token (signature_token),
  INDEX idx_email (signer_email),
  INDEX idx_status (status),
  INDEX idx_event (event_id)
);
```

### **Table: document_templates**

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Information
  template_type VARCHAR(20) NOT NULL, -- VENDOR, SPONSOR, EXHIBITOR
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL, -- TERMS, DISCLAIMER, CONTRACT
  
  -- Content (Rich Text)
  content TEXT NOT NULL,
  
  -- Versioning
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  tenant_id VARCHAR(255),
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_type (template_type, is_active),
  INDEX idx_tenant (tenant_id)
);
```

### **Table: signature_audit_log**

```sql
CREATE TABLE signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID NOT NULL,
  
  -- Action Details
  action VARCHAR(50) NOT NULL, -- CREATED, SENT, VIEWED, SIGNED, DOWNLOADED, EXPIRED
  performed_by BIGINT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Additional Data
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_signature_request FOREIGN KEY (signature_request_id) 
    REFERENCES signature_requests(id) ON DELETE CASCADE,
  INDEX idx_request (signature_request_id),
  INDEX idx_action (action)
);
```

---

## 🔐 **Security Features**

### **1. Email Validation**
```typescript
// Only the invited email can sign
if (user.email !== signatureRequest.signer_email) {
  throw new Error('Email mismatch. Please login with the invited email.');
}
```

### **2. Token Expiration**
```typescript
// Tokens expire after 7 days
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);
```

### **3. One-Time Signing**
```typescript
// Prevent re-signing
if (signatureRequest.status === 'COMPLETED') {
  throw new Error('Document already signed');
}
```

### **4. IP & Browser Tracking**
```typescript
// Audit trail
const ipAddress = request.headers.get('x-forwarded-for') || request.ip;
const userAgent = request.headers.get('user-agent');
```

---

## 📧 **Email Templates**

### **Initial Invitation**
```html
Subject: Action Required: Sign Documents for {eventName}

Hi {signerName},

You've been invited to participate in {eventName} as a {entityType}.

Please review and sign the required documents:

👉 Sign Now: {signatureLink}

⏰ This link expires on {expiryDate}

Documents to sign:
- Terms & Conditions
- Liability Disclaimer

If you have any questions, contact {eventManagerEmail}

Best regards,
{companyName}
```

### **Reminder Email** (if not signed after 3 days)
```html
Subject: Reminder: Signature Required for {eventName}

Hi {signerName},

This is a friendly reminder to sign the required documents for {eventName}.

👉 Sign Now: {signatureLink}

⏰ Link expires in {daysRemaining} days

Please complete this at your earliest convenience.

Best regards,
{companyName}
```

### **Completion Confirmation**
```html
Subject: Document Signed Successfully - {eventName}

Hi {signerName},

Thank you for signing the required documents for {eventName}.

Your signature has been recorded and you're all set!

📥 Download your signed copy: {downloadLink}

See you at the event!

Best regards,
{companyName}
```

---

## 🎨 **Admin Configuration UI**

### **Document Templates Page**

```
Settings → Document Templates
┌────────────────────────────────────────────────────────┐
│ Document Templates                    [+ New Template] │
├────────────────────────────────────────────────────────┤
│ Type        Name                   Version  Status      │
│ VENDOR      Terms & Conditions     v2       ✅ Active   │
│ VENDOR      Liability Disclaimer   v1       ✅ Active   │
│ SPONSOR     Sponsorship Agreement  v3       ✅ Active   │
│ EXHIBITOR   Booth Terms            v1       ✅ Active   │
└────────────────────────────────────────────────────────┘
```

### **Template Editor**

```
Edit Template: Vendor Terms & Conditions
┌────────────────────────────────────────────────────────┐
│ Template Name: [Terms & Conditions Agreement        ] │
│ Type:          [VENDOR ▼]                             │
│ Document Type: [TERMS ▼]                              │
├────────────────────────────────────────────────────────┤
│ Content (Rich Text Editor):                           │
│ ┌────────────────────────────────────────────────────┐ │
│ │ [B] [I] [U] [List] [Link] [Image]                 │ │
│ ├────────────────────────────────────────────────────┤ │
│ │                                                    │ │
│ │ VENDOR TERMS & CONDITIONS                          │ │
│ │                                                    │ │
│ │ 1. Payment Terms                                   │ │
│ │    - Full payment due 30 days before event         │ │
│ │    - Late payments subject to 5% penalty           │ │
│ │                                                    │ │
│ │ 2. Cancellation Policy                             │ │
│ │    - 50% refund if cancelled 60+ days before       │ │
│ │    - No refund if cancelled within 30 days         │ │
│ │                                                    │ │
│ │ {Variables: {eventName}, {vendorName}, {date}}     │ │
│ │                                                    │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ Version: v2    Status: ✅ Active                       │
│                                                        │
│ [Save as Draft] [Publish] [Preview]                   │
└────────────────────────────────────────────────────────┘
```

---

## 🔄 **API Endpoints**

### **1. Create Signature Request**
```
POST /api/events/[id]/signatures/create
Body: {
  entityType: "VENDOR",
  entityId: "vendor_123",
  signerName: "John Doe",
  signerEmail: "john@example.com",
  documentType: "TERMS"
}
```

### **2. Get Signature Request (Public)**
```
GET /api/signatures/[token]
Response: {
  id, eventName, documentContent, status, expiresAt
}
```

### **3. Sign Document**
```
POST /api/signatures/[token]/sign
Body: {
  agreed: true
}
```

### **4. List Signature Requests (Event Manager)**
```
GET /api/events/[id]/signatures
Response: [
  { id, signerName, status, signedAt, ... }
]
```

### **5. Resend Signature Link**
```
POST /api/events/[id]/signatures/[signatureId]/resend
```

---

## ✅ **Implementation Checklist**

- [ ] Create database tables
- [ ] Create document template CRUD
- [ ] Create signature request API
- [ ] Create public signing page
- [ ] Email validation logic
- [ ] Token generation & validation
- [ ] Email sending (invitation, reminder, confirmation)
- [ ] PDF generation for signed documents
- [ ] Audit logging
- [ ] Admin UI for templates
- [ ] Event manager signature dashboard
- [ ] Resend/reminder functionality

---

## 🚀 **Next Steps**

**Should I proceed with implementation?**

Please confirm:
1. ✅ Workflow is correct
2. ✅ Security requirements met
3. ✅ Email templates are good
4. ✅ Admin UI design approved
5. ✅ Ready to implement

**Estimated Time**: 4-6 hours for complete implementation

---

**Status**: Awaiting your approval to proceed
**Priority**: High
**Complexity**: Medium-High
