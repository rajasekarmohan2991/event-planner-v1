# Comprehensive Sponsor Form - Implementation Guide

## Overview
Complete sponsor management form with 9 detailed sections covering all aspects of sponsorship management.

## Database Schema Required

```sql
-- Add these columns to sponsors table
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS contact_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS payment_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS branding_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS event_presence_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS giveaway_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS legal_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS timeline_data JSONB;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS post_event_data JSONB;
```

## Form Sections

### 1. Contact Person Details
```typescript
contactData: {
  contactName: string
  designation: string
  email: string
  phone: string
  whatsapp?: string
  alternateContact?: string
}
```

### 2. Payment Information
```typescript
paymentData: {
  paymentMode: 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'CASH'
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL'
  invoiceRequired: boolean
  amountPaid?: number
  balanceAmount?: number
}
```

### 3. Branding & Promotion (Online)
```typescript
brandingData: {
  online: {
    websiteLogo: {
      enabled: boolean
      placement: 'HEADER' | 'FOOTER' | 'SPONSORS_PAGE' | 'ALL'
    }
    socialMedia: {
      enabled: boolean
      postCount: number
      platforms: string[] // ['Facebook', 'Instagram', 'LinkedIn']
    }
    emailCampaign: {
      enabled: boolean
      mentionCount: number
    }
  }
  offline: {
    stageBackdrop: boolean
    standee: {
      enabled: boolean
      size: string // '6x4 ft', '8x6 ft', etc.
    }
    booth: {
      required: boolean
      size?: string
    }
    entryGateBranding: boolean
  }
}
```

### 4. Event Presence Details
```typescript
eventPresenceData: {
  boothRequired: boolean
  boothSize?: string
  staffCount: number
  stageMentions: boolean
  speakingSlot: 'KEYNOTE' | 'PANEL' | 'NONE'
  productLaunch: boolean
  productDemo: boolean
}
```

### 5. Giveaway / In-Kind Sponsorship
```typescript
giveawayData: {
  type: 'COUPONS' | 'PRODUCTS' | 'MERCHANDISE' | 'NONE'
  quantity?: number
  distributionMethod: 'WELCOME_KIT' | 'LUCKY_DRAW' | 'BOOTH' | 'OTHER'
  estimatedValue?: number
  deliveryDate?: Date
  description?: string
}
```

### 6. Legal & Approval
```typescript
legalData: {
  contractSigned: boolean
  logoUsageApproval: boolean
  brandCompliance?: string
  ndaRequired: boolean
  cancellationPolicyAccepted: boolean
  contractUrl?: string
}
```

### 7. Timeline & Deadlines
```typescript
timelineData: {
  logoSubmissionDeadline?: Date
  paymentDueDate?: Date
  creativeApprovalDate?: Date
  setupDate?: Date
  setupTime?: string
  eventDayAccessTime?: string
}
```

### 8. Post-Event Commitments
```typescript
postEventData: {
  leadsReportRequired: boolean
  photoVideoAccess: boolean
  socialMediaMentionsCount: number
  performanceReportRequired: boolean
  feedbackRequired: boolean
}
```

## Implementation Steps

### Step 1: Update Sponsor API
File: `/apps/web/app/api/events/[id]/sponsors/route.ts`

Add handling for all new fields in POST and PUT endpoints.

### Step 2: Create Comprehensive Form Component
File: `/apps/web/app/events/[id]/sponsors/page.tsx`

Create multi-step form with:
- Section 1: Basic Info + Contact Details
- Section 2: Payment Information
- Section 3: Branding Requirements (Online)
- Section 4: Branding Requirements (Offline)
- Section 5: Event Presence
- Section 6: Giveaways
- Section 7: Legal & Approvals
- Section 8: Timelines
- Section 9: Post-Event

### Step 3: Form Validation
- Required fields: contactName, email, phone, paymentMode, paymentStatus
- Email validation
- Phone number validation
- Date validations (deadlines should be before event date)

### Step 4: UI Components Needed
- Multi-step form wizard
- Progress indicator
- Checkbox groups
- Radio button groups
- Date pickers
- File upload (for contracts, logos)
- Number inputs with currency formatting

## Sample Form Structure

```tsx
<form>
  {/* Section 1: Contact Details */}
  <section>
    <h3>Contact Person Details</h3>
    <Input label="Contact Name *" />
    <Input label="Designation" />
    <Input label="Email *" type="email" />
    <Input label="Phone / WhatsApp *" />
    <Input label="Alternate Contact" />
  </section>

  {/* Section 2: Payment */}
  <section>
    <h3>Payment Information</h3>
    <Select label="Payment Mode *">
      <option>Bank Transfer</option>
      <option>Cheque</option>
      <option>Online</option>
      <option>Cash</option>
    </Select>
    <Select label="Payment Status *">
      <option>Pending</option>
      <option>Paid</option>
      <option>Partial</option>
    </Select>
    <Checkbox label="Invoice Required" />
  </section>

  {/* Section 3: Online Branding */}
  <section>
    <h3>Online Branding & Promotion</h3>
    <Checkbox label="Website Logo Placement" />
    {websiteLogo && (
      <Select label="Placement">
        <option>Header</option>
        <option>Footer</option>
        <option>Sponsors Page</option>
        <option>All</option>
      </Select>
    )}
    <Checkbox label="Social Media Posts" />
    {socialMedia && (
      <>
        <Input type="number" label="Post Count" />
        <CheckboxGroup label="Platforms">
          <Checkbox label="Facebook" />
          <Checkbox label="Instagram" />
          <Checkbox label="LinkedIn" />
          <Checkbox label="Twitter" />
        </CheckboxGroup>
      </>
    )}
  </section>

  {/* ... Continue for all 9 sections ... */}
</form>
```

## Next Steps

1. Create database migration for new columns
2. Update sponsor API to handle all fields
3. Build comprehensive form UI
4. Add validation
5. Test thoroughly

This will create a professional, enterprise-grade sponsor management system!
