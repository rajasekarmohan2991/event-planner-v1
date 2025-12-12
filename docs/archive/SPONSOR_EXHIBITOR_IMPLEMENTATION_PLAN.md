# Sponsor & Exhibitor Registration - Complete Workflow Implementation Plan

## Current Status Analysis

### ✅ Already Implemented:
1. **Database Models:**
   - `Exhibitor` model with comprehensive fields
   - `Booth` model with types and status
   - `BoothAsset` model for documents/images
   - Sponsor tiers (PLATINUM, GOLD, SILVER, BRONZE, PARTNER)

2. **Basic Pages:**
   - `/events/[id]/sponsors` - Admin sponsor management
   - `/events/[id]/exhibitors` - Admin exhibitor management (basic)
   - API endpoints for CRUD operations

3. **Existing Fields in Exhibitor Model:**
   - Basic info: name, contact details, website
   - Extended profile: firstName, lastName, jobTitle, company
   - Booth details: boothType, boothNumber, boothArea
   - Add-ons: electricalAccess, displayTables
   - Staff list, competitors, products/services

---

## 🚀 Missing Features to Implement

### Phase 1: Package Management System (Admin)
**Status:** ❌ Not Implemented

**New Database Models Needed:**
```prisma
model SponsorshipPackage {
  id                String   @id @default(cuid())
  eventId           String
  name              String   // "Gold Sponsor", "Premium Booth"
  type              PackageType // SPONSORSHIP, EXHIBITOR
  tier              String?  // For sponsorships: PLATINUM, GOLD, etc.
  boothType         BoothType? // For exhibitors: STANDARD, PREMIUM, ISLAND
  price             Int
  currency          String   @default("INR")
  quantity          Int      // Total available
  quantityRemaining Int      // Available now
  benefits          Json     // Array of benefits
  addOns            Json?    // Available add-ons
  description       String?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  registrations     SponsorExhibitorRegistration[]
}

enum PackageType {
  SPONSORSHIP
  EXHIBITOR
}

model PackageAddOn {
  id          String   @id @default(cuid())
  packageId   String
  name        String   // "Extra Badge", "Furniture Package"
  description String?
  price       Int
  quantity    Int      @default(1)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

**New Pages Needed:**
- `/events/[id]/packages` - Admin package management
- `/events/[id]/packages/create` - Create new package
- `/events/[id]/packages/[packageId]/edit` - Edit package

**API Endpoints:**
- `POST /api/events/[id]/packages` - Create package
- `GET /api/events/[id]/packages` - List packages
- `PUT /api/events/[id]/packages/[packageId]` - Update package
- `DELETE /api/events/[id]/packages/[packageId]` - Delete package

---

### Phase 2: Public Landing Pages
**Status:** ❌ Not Implemented

**New Pages Needed:**
```
/events/[id]/public/sponsorship
  - Sponsorship prospectus
  - Benefits breakdown
  - Pricing tiers
  - "Become a Sponsor" CTA

/events/[id]/public/exhibitors
  - Booth layouts & interactive map
  - Booth types & pricing
  - Floor plan viewer
  - "Register as Exhibitor" CTA

/events/[id]/public/booth-map
  - Interactive booth map
  - Available/sold booth visualization
  - Click to select booth
```

**Components Needed:**
- `SponsorshipProspectus.tsx` - Display sponsorship info
- `BoothMapViewer.tsx` - Interactive booth selection
- `PackageCard.tsx` - Display package with benefits
- `PricingTable.tsx` - Compare packages

---

### Phase 3: Registration Workflow
**Status:** ⚠️ Partially Implemented (needs enhancement)

**New Database Model:**
```prisma
model SponsorExhibitorRegistration {
  id                String   @id @default(cuid())
  eventId           String
  userId            String?  // Linked user account
  packageId         String
  type              RegistrationType // SPONSOR, EXHIBITOR
  
  // Company Info
  companyName       String
  companyAddress    String
  companyWebsite    String?
  companyLogo       String?
  
  // Primary Contact
  contactName       String
  contactEmail      String
  contactPhone      String
  contactTitle      String?
  
  // Package Details
  selectedPackage   Json     // Package snapshot
  selectedAddOns    Json?    // Add-ons selected
  boothNumber       String?  // If exhibitor
  
  // Documents
  documents         Json?    // Array of uploaded docs
  logoUrl           String?
  insuranceCert     String?
  marketingMaterials Json?
  
  // Contract & Payment
  contractSigned    Boolean  @default(false)
  contractSignedAt  DateTime?
  contractPdfUrl    String?
  paymentStatus     PaymentStatus @default(PENDING)
  paymentMethod     String?
  invoiceUrl        String?
  receiptUrl        String?
  totalAmount       Int
  paidAmount        Int      @default(0)
  
  // Approval Workflow
  status            RegistrationStatus @default(PENDING)
  approvedBy        String?
  approvedAt        DateTime?
  rejectionReason   String?
  
  // Portal Access
  portalAccessCode  String?  @unique
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  package           SponsorshipPackage @relation(fields: [packageId], references: [id])
  staffBadges       StaffBadge[]
  complianceChecklist ComplianceItem[]
}

enum RegistrationType {
  SPONSOR
  EXHIBITOR
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

enum PaymentStatus {
  PENDING
  PARTIAL
  PAID
  REFUNDED
}

model StaffBadge {
  id             String   @id @default(cuid())
  registrationId String
  name           String
  email          String?
  title          String?
  badgeType      String   // EXHIBITOR, STAFF, VIP
  qrCode         String?
  printed        Boolean  @default(false)
  checkedIn      Boolean  @default(false)
  checkedInAt    DateTime?
  createdAt      DateTime @default(now())
  
  registration   SponsorExhibitorRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
}

model ComplianceItem {
  id             String   @id @default(cuid())
  registrationId String
  itemName       String   // "Logo Upload", "Insurance Certificate"
  required       Boolean  @default(true)
  completed      Boolean  @default(false)
  completedAt    DateTime?
  fileUrl        String?
  notes          String?
  
  registration   SponsorExhibitorRegistration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
}
```

**New Pages:**
```
/events/[id]/register/sponsor
  - Step 1: Account/Login
  - Step 2: Select Package
  - Step 3: Add-ons
  - Step 4: Company Info
  - Step 5: Upload Documents
  - Step 6: Contract & T&Cs
  - Step 7: Payment
  - Step 8: Confirmation

/events/[id]/register/exhibitor
  - Step 1: Account/Login
  - Step 2: Select Booth
  - Step 3: Add-ons
  - Step 4: Company Info
  - Step 5: Upload Documents
  - Step 6: Contract & T&Cs
  - Step 7: Payment
  - Step 8: Confirmation
```

**API Endpoints:**
- `POST /api/events/[id]/register/sponsor` - Create sponsor registration
- `POST /api/events/[id]/register/exhibitor` - Create exhibitor registration
- `POST /api/events/[id]/register/[regId]/documents` - Upload documents
- `POST /api/events/[id]/register/[regId]/contract` - Sign contract
- `POST /api/events/[id]/register/[regId]/payment` - Process payment

---

### Phase 4: Admin Approval Workflow
**Status:** ❌ Not Implemented

**New Pages:**
```
/events/[id]/registrations/sponsors
  - List all sponsor registrations
  - Filter by status (Pending, Approved, Rejected)
  - Bulk actions
  - Review documents
  - Approve/Reject with reasons

/events/[id]/registrations/exhibitors
  - List all exhibitor registrations
  - View booth assignments
  - Review uploaded materials
  - Approve/Reject workflow
```

**API Endpoints:**
- `GET /api/events/[id]/registrations/sponsors` - List sponsor registrations
- `GET /api/events/[id]/registrations/exhibitors` - List exhibitor registrations
- `PUT /api/events/[id]/registrations/[regId]/approve` - Approve registration
- `PUT /api/events/[id]/registrations/[regId]/reject` - Reject registration
- `POST /api/events/[id]/registrations/[regId]/request-info` - Request more info

---

### Phase 5: Sponsor/Exhibitor Portal
**Status:** ❌ Not Implemented

**New Pages:**
```
/portal/[accessCode]
  - Dashboard overview
  - Package details
  - Upload materials
  - Submit staff names
  - Download manuals
  - Compliance checklist
  - Lead retrieval access
  - Analytics (post-event)
```

**Features:**
- View purchased items
- Upload logos/banners
- Submit booth staff names for badges
- Book time slots (if applicable)
- Download exhibitor manual
- Track compliance checklist
- View booth assignment
- Access lead retrieval system

**API Endpoints:**
- `GET /api/portal/[accessCode]` - Get portal data
- `POST /api/portal/[accessCode]/upload` - Upload materials
- `POST /api/portal/[accessCode]/staff` - Submit staff badges
- `GET /api/portal/[accessCode]/manual` - Download manual
- `GET /api/portal/[accessCode]/analytics` - View analytics

---

### Phase 6: Onsite Preparation
**Status:** ❌ Not Implemented

**New Features:**
- Badge generation system
- QR code generation for staff
- Booth assignment lists
- Move-in/out schedules
- Lead retrieval activation
- Sponsor signage generation

**API Endpoints:**
- `GET /api/events/[id]/onsite/badges` - Generate all badges
- `GET /api/events/[id]/onsite/booth-assignments` - Get booth list
- `GET /api/events/[id]/onsite/schedules` - Get move-in/out schedules
- `POST /api/events/[id]/onsite/check-in` - Check-in sponsor/exhibitor

---

### Phase 7: Post-Event Analytics
**Status:** ❌ Not Implemented

**New Features:**
- Booth scan analytics
- Lead retrieval reports
- Sponsor exposure metrics
- Certificates of participation
- Feedback surveys
- Post-event invoices

**API Endpoints:**
- `GET /api/events/[id]/analytics/sponsors` - Sponsor analytics
- `GET /api/events/[id]/analytics/exhibitors` - Exhibitor analytics
- `POST /api/events/[id]/certificates/generate` - Generate certificates
- `GET /api/events/[id]/feedback/surveys` - Get surveys

---

## 📋 Implementation Priority

### High Priority (Phase 1 & 2):
1. ✅ Package Management System
2. ✅ Public Landing Pages
3. ✅ Basic Registration Flow

### Medium Priority (Phase 3 & 4):
4. ✅ Document Upload System
5. ✅ Contract Signing
6. ✅ Payment Integration
7. ✅ Admin Approval Workflow

### Low Priority (Phase 5, 6, 7):
8. ⚠️ Sponsor/Exhibitor Portal
9. ⚠️ Onsite Features
10. ⚠️ Post-Event Analytics

---

## 🔧 Technical Implementation Notes

### Preserving Existing Code:
- Keep current `Exhibitor` model as-is
- Add new models alongside existing ones
- Use separate routes for new features
- Maintain backward compatibility

### Integration Points:
- Link `SponsorExhibitorRegistration` to existing `Exhibitor` model
- Use existing payment infrastructure
- Leverage existing email/notification system
- Reuse existing file upload system

### Database Migration Strategy:
1. Create new models without modifying existing ones
2. Add foreign keys to link systems
3. Migrate data gradually (if needed)
4. Keep both systems running in parallel initially

---

## 🚀 Next Steps

### Immediate Actions:
1. Review and approve this plan
2. Prioritize which phases to implement first
3. Identify any blockers or concerns
4. Start with Phase 1 (Package Management)

### Questions to Address:
1. Which payment gateways to integrate? (Stripe, Razorpay, PayPal?)
2. Contract signing solution? (DocuSign, HelloSign, or custom?)
3. Lead retrieval system vendor?
4. Booth map visualization tool?
5. Badge printing integration?

---

## 📊 Estimated Timeline

- **Phase 1 (Packages):** 2-3 days
- **Phase 2 (Landing Pages):** 2-3 days
- **Phase 3 (Registration):** 4-5 days
- **Phase 4 (Admin Approval):** 2-3 days
- **Phase 5 (Portal):** 3-4 days
- **Phase 6 (Onsite):** 2-3 days
- **Phase 7 (Analytics):** 2-3 days

**Total:** ~18-24 days for complete implementation

---

## ✅ Ready to Start?

Please review this plan and let me know:
1. Which phases to prioritize?
2. Any modifications needed?
3. Any specific requirements or constraints?
4. Ready to begin implementation?

I'll preserve all existing code and add new features alongside the current system.
