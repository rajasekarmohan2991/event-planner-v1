# Exhibitor Management System - Stepper Workflow Implementation

## Current Issues
1. ❌ Exhibitors not loading properly
2. ❌ No stepper workflow
3. ❌ No email confirmation
4. ❌ No booth allocation
5. ❌ No QR code generation
6. ❌ No custom fields support

## Required Workflow (Stepper)

```
Step 1: REGISTRATION
  ↓ (Exhibitor submits form)
  
Step 2: PENDING_CONFIRMATION
  ↓ (Email sent to exhibitor for confirmation)
  ↓ (Exhibitor clicks confirmation link)
  
Step 3: AWAITING_ADMIN_APPROVAL
  ↓ (Admin reviews and approves)
  
Step 4: PAYMENT_PENDING
  ↓ (Payment link sent)
  ↓ (Exhibitor completes payment)
  
Step 5: PAYMENT_COMPLETED
  ↓ (Admin allocates booth)
  
Step 6: BOOTH_ALLOCATED
  ↓ (QR code generated)
  ↓ (Confirmation email with QR sent)
  
Step 7: CONFIRMED
  ✅ Complete!
```

---

## Database Schema Updates

### Exhibitor Table (Enhanced)
```prisma
model Exhibitor {
  id                BigInt    @id @default(autoincrement())
  eventId           BigInt    @map("event_id")
  
  // Company Info
  companyName       String    @map("company_name")
  companyWebsite    String?   @map("company_website")
  companyLogo       String?   @map("company_logo")
  industry          String?
  description       String?   @db.Text
  
  // Contact Info
  contactName       String    @map("contact_name")
  contactEmail      String    @map("contact_email")
  contactPhone      String    @map("contact_phone")
  contactPosition   String?   @map("contact_position")
  
  // Booth Info
  boothType         String    @map("booth_type") // Standard, Premium, VIP
  boothSize         String    @map("booth_size") // 3x3, 6x6, 9x9
  boothPreference   String?   @map("booth_preference") // Corner, Center, Near Entrance
  boothNumber       String?   @map("booth_number") @unique
  
  // Workflow Status
  status            String    @default("REGISTRATION") // Stepper status
  
  // Email Confirmation
  emailConfirmed    Boolean   @default(false) @map("email_confirmed")
  confirmationToken String?   @unique @map("confirmation_token")
  confirmedAt       DateTime? @map("confirmed_at")
  
  // Admin Approval
  adminApproved     Boolean   @default(false) @map("admin_approved")
  approvedBy        BigInt?   @map("approved_by")
  approvedAt        DateTime? @map("approved_at")
  rejectionReason   String?   @map("rejection_reason")
  
  // Payment
  paymentStatus     String    @default("PENDING") @map("payment_status")
  paymentAmount     Decimal?  @map("payment_amount")
  paymentMethod     String?   @map("payment_method")
  paymentReference  String?   @map("payment_reference")
  paidAt            DateTime? @map("paid_at")
  
  // Booth Allocation
  boothAllocated    Boolean   @default(false) @map("booth_allocated")
  allocatedBy       BigInt?   @map("allocated_by")
  allocatedAt       DateTime? @map("allocated_at")
  
  // QR Code
  qrCode            String?   @map("qr_code") // Base64 or URL
  qrCodeData        String?   @map("qr_code_data") // JSON data
  
  // Custom Fields (JSON)
  customFields      Json?     @map("custom_fields")
  
  // Metadata
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  event             Event     @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  @@map("exhibitors")
}
```

### Exhibitor Status Enum
```typescript
enum ExhibitorStatus {
  REGISTRATION = "REGISTRATION"
  PENDING_CONFIRMATION = "PENDING_CONFIRMATION"
  AWAITING_ADMIN_APPROVAL = "AWAITING_ADMIN_APPROVAL"
  PAYMENT_PENDING = "PAYMENT_PENDING"
  PAYMENT_COMPLETED = "PAYMENT_COMPLETED"
  BOOTH_ALLOCATED = "BOOTH_ALLOCATED"
  CONFIRMED = "CONFIRMED"
  REJECTED = "REJECTED"
  CANCELLED = "CANCELLED"
}
```

---

## API Endpoints

### Exhibitor Registration
```
POST /api/events/[id]/exhibitors/register
Body: {
  companyName, contactName, contactEmail, contactPhone,
  boothType, boothSize, customFields
}
Response: {
  id, confirmationToken, message: "Confirmation email sent"
}
```

### Email Confirmation
```
GET /api/events/[id]/exhibitors/confirm?token=xyz
Action: Confirm email, update status to AWAITING_ADMIN_APPROVAL
Response: Redirect to success page
```

### Admin Approval
```
POST /api/events/[id]/exhibitors/[exhibitorId]/approve
Body: { boothNumber?, notes? }
Action: Approve exhibitor, send payment link
Response: { status: "PAYMENT_PENDING" }
```

### Admin Rejection
```
POST /api/events/[id]/exhibitors/[exhibitorId]/reject
Body: { reason }
Action: Reject exhibitor, send rejection email
Response: { status: "REJECTED" }
```

### Payment Confirmation
```
POST /api/events/[id]/exhibitors/[exhibitorId]/payment
Body: { paymentReference, paymentMethod, amount }
Action: Mark payment as completed
Response: { status: "PAYMENT_COMPLETED" }
```

### Booth Allocation
```
POST /api/events/[id]/exhibitors/[exhibitorId]/allocate-booth
Body: { boothNumber }
Action: Allocate booth, generate QR code, send confirmation
Response: { boothNumber, qrCode, status: "BOOTH_ALLOCATED" }
```

---

## Email Templates

### 1. Registration Confirmation Email
```
Subject: Confirm Your Exhibitor Registration - [Event Name]

Hi [Contact Name],

Thank you for registering as an exhibitor for [Event Name]!

Please confirm your email address by clicking the link below:
[Confirmation Link]

This link will expire in 24 hours.

Company: [Company Name]
Booth Type: [Booth Type]
Booth Size: [Booth Size]

If you didn't register, please ignore this email.

Best regards,
[Event Team]
```

### 2. Admin Approval Notification
```
Subject: Your Exhibitor Registration Has Been Approved!

Hi [Contact Name],

Great news! Your exhibitor registration has been approved.

Next Step: Payment
Amount: ₹[Amount]
Payment Link: [Payment Link]

Booth Details:
- Type: [Booth Type]
- Size: [Booth Size]
- Preference: [Preference]

Please complete payment within 7 days to confirm your booth.

Best regards,
[Event Team]
```

### 3. Payment Confirmation Email
```
Subject: Payment Received - Booth Allocation Pending

Hi [Contact Name],

We've received your payment of ₹[Amount].

Payment Details:
- Reference: [Reference]
- Method: [Method]
- Date: [Date]

Your booth will be allocated shortly by our team.

Best regards,
[Event Team]
```

### 4. Booth Allocation Email (with QR Code)
```
Subject: Your Booth Has Been Allocated! 🎉

Hi [Contact Name],

Congratulations! Your booth has been allocated.

Booth Details:
- Booth Number: [Booth Number]
- Type: [Booth Type]
- Size: [Booth Size]
- Location: [Location]

Your QR Code:
[QR Code Image]

Please present this QR code at the event for check-in.

Event Details:
- Date: [Date]
- Time: [Time]
- Venue: [Venue]

We look forward to seeing you!

Best regards,
[Event Team]
```

### 5. Rejection Email
```
Subject: Exhibitor Registration Update

Hi [Contact Name],

Thank you for your interest in exhibiting at [Event Name].

Unfortunately, we are unable to approve your registration at this time.

Reason: [Rejection Reason]

If you have any questions, please contact us at [Email].

Best regards,
[Event Team]
```

---

## UI Components

### Stepper Component
```tsx
<ExhibitorStepper currentStatus={exhibitor.status}>
  <Step status="REGISTRATION" icon="📝" />
  <Step status="PENDING_CONFIRMATION" icon="📧" />
  <Step status="AWAITING_ADMIN_APPROVAL" icon="⏳" />
  <Step status="PAYMENT_PENDING" icon="💳" />
  <Step status="PAYMENT_COMPLETED" icon="✅" />
  <Step status="BOOTH_ALLOCATED" icon="🏢" />
  <Step status="CONFIRMED" icon="🎉" />
</ExhibitorStepper>
```

### Admin Dashboard
```tsx
<ExhibitorManagement>
  <Filters>
    <Select status />
    <Select boothType />
    <Input search />
  </Filters>
  
  <ExhibitorList>
    {exhibitors.map(ex => (
      <ExhibitorCard key={ex.id}>
        <CompanyInfo />
        <ContactInfo />
        <BoothInfo />
        <StatusBadge status={ex.status} />
        <Stepper currentStatus={ex.status} />
        
        <Actions>
          {ex.status === 'AWAITING_ADMIN_APPROVAL' && (
            <>
              <Button onClick={approve}>Approve</Button>
              <Button onClick={reject}>Reject</Button>
            </>
          )}
          
          {ex.status === 'PAYMENT_COMPLETED' && (
            <Button onClick={allocateBooth}>Allocate Booth</Button>
          )}
          
          <Button onClick={viewDetails}>View Details</Button>
        </Actions>
      </ExhibitorCard>
    ))}
  </ExhibitorList>
</ExhibitorManagement>
```

### Exhibitor Detail View
```tsx
<ExhibitorDetailModal exhibitor={exhibitor}>
  <Tabs>
    <Tab label="Overview">
      <CompanyDetails />
      <ContactDetails />
      <BoothPreferences />
      <CustomFields />
    </Tab>
    
    <Tab label="Timeline">
      <ActivityLog>
        <Event>Registered - [Date]</Event>
        <Event>Email Confirmed - [Date]</Event>
        <Event>Approved by [Admin] - [Date]</Event>
        <Event>Payment Completed - [Date]</Event>
        <Event>Booth Allocated - [Date]</Event>
      </ActivityLog>
    </Tab>
    
    <Tab label="Payment">
      <PaymentDetails />
      <PaymentHistory />
    </Tab>
    
    <Tab label="Booth">
      <BoothDetails />
      <QRCode />
      <DownloadQR />
    </Tab>
  </Tabs>
</ExhibitorDetailModal>
```

---

## Custom Fields Support

### Admin Configuration
```tsx
<CustomFieldsConfig>
  <AddField>
    <Input label="Field Label" />
    <Select type="text|number|email|select|checkbox" />
    <Checkbox required />
    <Input placeholder />
    {type === 'select' && <Input options="Option1,Option2,Option3" />}
  </AddField>
  
  <FieldList>
    {fields.map(field => (
      <FieldItem key={field.id}>
        <Label>{field.label}</Label>
        <Type>{field.type}</Type>
        <Required>{field.required ? '✓' : '✗'}</Required>
        <Actions>
          <Button edit />
          <Button delete />
        </Actions>
      </FieldItem>
    ))}
  </FieldList>
</CustomFieldsConfig>
```

### Registration Form (Dynamic)
```tsx
<RegistrationForm>
  {/* Standard Fields */}
  <Input name="companyName" required />
  <Input name="contactName" required />
  <Input name="contactEmail" type="email" required />
  
  {/* Custom Fields (Dynamic) */}
  {customFields.map(field => (
    <DynamicField key={field.id} config={field} />
  ))}
  
  <Submit />
</RegistrationForm>
```

---

## QR Code Generation

### QR Code Data Structure
```json
{
  "exhibitorId": "123",
  "eventId": "456",
  "companyName": "Acme Corp",
  "boothNumber": "A-15",
  "contactName": "John Doe",
  "contactEmail": "john@acme.com",
  "checkInCode": "EXH-2025-123-ABC",
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### QR Code Generation
```typescript
import QRCode from 'qrcode'

async function generateExhibitorQR(exhibitor: Exhibitor) {
  const qrData = {
    exhibitorId: exhibitor.id,
    eventId: exhibitor.eventId,
    companyName: exhibitor.companyName,
    boothNumber: exhibitor.boothNumber,
    checkInCode: `EXH-${exhibitor.eventId}-${exhibitor.id}-${randomCode()}`
  }
  
  const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData))
  
  return {
    qrCode: qrCodeDataURL,
    qrCodeData: JSON.stringify(qrData)
  }
}
```

---

## Implementation Checklist

### Phase 1: Database & Schema ✅
- [ ] Update Prisma schema with new fields
- [ ] Add status enum
- [ ] Add custom fields support
- [ ] Run migration

### Phase 2: API Routes ✅
- [ ] POST /exhibitors/register
- [ ] GET /exhibitors/confirm
- [ ] POST /exhibitors/[id]/approve
- [ ] POST /exhibitors/[id]/reject
- [ ] POST /exhibitors/[id]/payment
- [ ] POST /exhibitors/[id]/allocate-booth
- [ ] GET /exhibitors (with filters)

### Phase 3: Email System ✅
- [ ] Registration confirmation email
- [ ] Approval notification email
- [ ] Payment confirmation email
- [ ] Booth allocation email (with QR)
- [ ] Rejection email

### Phase 4: UI Components ✅
- [ ] Stepper component
- [ ] Exhibitor list with filters
- [ ] Exhibitor detail modal
- [ ] Admin approval interface
- [ ] Booth allocation interface
- [ ] QR code display

### Phase 5: Custom Fields ✅
- [ ] Custom fields configuration
- [ ] Dynamic form generation
- [ ] Custom field validation
- [ ] Custom field storage

### Phase 6: QR Code ✅
- [ ] QR code generation
- [ ] QR code display
- [ ] QR code download
- [ ] QR code email attachment

---

## Testing Scenarios

### 1. Registration Flow
1. Exhibitor fills registration form
2. Receives confirmation email
3. Clicks confirmation link
4. Status updates to AWAITING_ADMIN_APPROVAL

### 2. Approval Flow
1. Admin reviews exhibitor
2. Approves with booth preferences
3. Exhibitor receives payment link
4. Status updates to PAYMENT_PENDING

### 3. Payment Flow
1. Exhibitor completes payment
2. Admin confirms payment
3. Status updates to PAYMENT_COMPLETED

### 4. Booth Allocation Flow
1. Admin allocates booth number
2. QR code generated
3. Email sent with QR code
4. Status updates to BOOTH_ALLOCATED

### 5. Rejection Flow
1. Admin rejects exhibitor
2. Rejection email sent with reason
3. Status updates to REJECTED

---

## Benefits

✅ Complete workflow tracking
✅ Email notifications at each step
✅ Admin control over approvals
✅ Payment tracking
✅ Booth allocation management
✅ QR code for check-in
✅ Custom fields support
✅ Professional exhibitor management
✅ Audit trail
✅ Automated communications

---

## Next Steps

1. Update Prisma schema
2. Create API routes
3. Build stepper component
4. Implement email system
5. Add QR code generation
6. Create admin interface
7. Test complete workflow
