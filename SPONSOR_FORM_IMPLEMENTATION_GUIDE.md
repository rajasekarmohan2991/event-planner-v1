# Comprehensive Sponsor Form - Implementation Guide

## ✅ PHASE 1 COMPLETE (Just Committed):
- Database schema with 9 JSONB columns
- TypeScript interfaces for all sections
- Validation helper function

---

## 🔧 PHASE 2: API Updates (Next Step)

### File: `/apps/web/app/api/events/[id]/sponsors/route.ts`

#### GET Endpoint - Add New Fields
```typescript
const sponsors = await prisma.$queryRaw`
  SELECT 
    id::text as id,
    event_id::text as "eventId",
    name, tier, logo_url as "logoUrl", website,
    contact_data as "contactData",
    payment_data as "paymentData",
    branding_online as "brandingOnline",
    branding_offline as "brandingOffline",
    event_presence as "eventPresence",
    giveaway_data as "giveawayData",
    legal_data as "legalData",
    timeline_data as "timelineData",
    post_event_data as "postEventData",
    created_at as "createdAt",
    updated_at as "updatedAt"
  FROM sponsors
  WHERE event_id = ${eventId}
  ORDER BY created_at DESC
`
```

#### POST Endpoint - Handle All Fields
```typescript
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const eventId = BigInt(params.id)

  // Validate
  const errors = validateSponsorForm(body)
  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 })
  }

  const result = await prisma.$queryRaw`
    INSERT INTO sponsors (
      event_id, name, tier, logo_url, website,
      contact_data, payment_data, branding_online, branding_offline,
      event_presence, giveaway_data, legal_data, timeline_data, post_event_data,
      created_at, updated_at
    ) VALUES (
      ${eventId}, ${body.name}, ${body.tier}, ${body.logoUrl || null}, ${body.website || null},
      ${JSON.stringify(body.contactData || {})},
      ${JSON.stringify(body.paymentData || {})},
      ${JSON.stringify(body.brandingOnline || {})},
      ${JSON.stringify(body.brandingOffline || {})},
      ${JSON.stringify(body.eventPresence || {})},
      ${JSON.stringify(body.giveawayData || {})},
      ${JSON.stringify(body.legalData || {})},
      ${JSON.stringify(body.timelineData || {})},
      ${JSON.stringify(body.postEventData || {})},
      NOW(), NOW()
    )
    RETURNING id::text
  `

  return NextResponse.json({ success: true, id: result[0].id })
}
```

---

## 🎨 PHASE 3: UI Form (Multi-Step Wizard)

### File: `/apps/web/app/events/[id]/sponsors/page.tsx`

Create a multi-step form with tabs/accordion for each section:

```typescript
const [currentStep, setCurrentStep] = useState(1)
const [formData, setFormData] = useState<Partial<ComprehensiveSponsor>>({})

const steps = [
  { id: 1, title: 'Basic Info', icon: '📋' },
  { id: 2, title: 'Contact Details', icon: '👤' },
  { id: 3, title: 'Payment', icon: '💳' },
  { id: 4, title: 'Online Branding', icon: '🌐' },
  { id: 5, title: 'Offline Branding', icon: '🎪' },
  { id: 6, title: 'Event Presence', icon: '🎤' },
  { id: 7, title: 'Giveaways', icon: '🎁' },
  { id: 8, title: 'Legal', icon: '📜' },
  { id: 9, title: 'Timeline', icon: '📅' },
  { id: 10, title: 'Post-Event', icon: '📊' }
]
```

### Form Sections:

#### Section 1: Basic Info (Existing)
- Company Name
- Contribution Amount
- Tier (auto-calculated)
- Website
- Logo Upload

#### Section 2: Contact Person Details
```tsx
<div className="space-y-4">
  <Input label="Contact Name *" value={contactData.contactName} />
  <Input label="Designation" value={contactData.designation} />
  <Input label="Email *" type="email" value={contactData.email} />
  <Input label="Phone / WhatsApp *" value={contactData.phone} />
  <Input label="Alternate Contact" value={contactData.alternateContact} />
</div>
```

#### Section 3: Payment Information
```tsx
<Select label="Payment Mode *">
  <option>Bank Transfer</option>
  <option>Cheque</option>
  <option>Online</option>
  <option>Cash</option>
  <option>UPI</option>
</Select>
<Select label="Payment Status *">
  <option>Pending</option>
  <option>Paid</option>
  <option>Partial</option>
</Select>
<Checkbox label="Invoice Required" />
<Input type="number" label="Amount Paid" />
<Input type="date" label="Payment Due Date" />
```

#### Section 4: Online Branding
```tsx
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

<Checkbox label="Email Campaign Mentions" />
{emailCampaign && <Input type="number" label="Mention Count" />}
```

#### Section 5: Offline Branding
```tsx
<Checkbox label="Stage Backdrop Logo" />
<Checkbox label="Standee / Banner" />
{standee && <Input label="Size (e.g., 6x4 ft)" />}
<Checkbox label="Booth / Stall Required" />
{booth && <Input label="Booth Size" />}
<Checkbox label="Entry Gate Branding" />
```

#### Section 6: Event Presence
```tsx
<Checkbox label="Booth Required" />
{boothRequired && <Input label="Booth Size" />}
<Input type="number" label="Number of Staff Attending" />
<Checkbox label="Stage Mentions Required" />
<Select label="Speaking Slot">
  <option>None</option>
  <option>Keynote</option>
  <option>Panel</option>
</Select>
<Checkbox label="Product Launch" />
<Checkbox label="Product Demo" />
```

#### Section 7: Giveaways
```tsx
<Select label="Type">
  <option>None</option>
  <option>Coupons</option>
  <option>Products</option>
  <option>Merchandise</option>
</Select>
{type !== 'NONE' && (
  <>
    <Input type="number" label="Quantity" />
    <Select label="Distribution Method">
      <option>Welcome Kit</option>
      <option>Lucky Draw</option>
      <option>Booth</option>
      <option>Other</option>
    </Select>
    <Input type="number" label="Estimated Value (₹)" />
    <Input type="date" label="Delivery Date" />
    <Textarea label="Description" />
  </>
)}
```

#### Section 8: Legal & Approval
```tsx
<Checkbox label="Contract Signed" />
<Checkbox label="Logo Usage Approval" />
<Checkbox label="NDA Required" />
<Checkbox label="Cancellation Policy Accepted" />
<Input label="Contract URL" />
<Textarea label="Brand Compliance Requirements" />
```

#### Section 9: Timeline & Deadlines
```tsx
<Input type="date" label="Logo Submission Deadline" />
<Input type="date" label="Payment Due Date" />
<Input type="date" label="Creative Approval Date" />
<Input type="date" label="Setup Date" />
<Input type="time" label="Setup Time" />
<Input type="time" label="Event Day Access Time" />
```

#### Section 10: Post-Event Commitments
```tsx
<Checkbox label="Leads Report Required" />
<Checkbox label="Photo / Video Access Required" />
<Input type="number" label="Social Media Mentions Count" />
<Checkbox label="Performance Report Required" />
<Checkbox label="Feedback Required" />
<Checkbox label="Testimonial Required" />
```

---

## 🎯 IMPLEMENTATION STEPS:

### Step 1: Run Database Migration
```bash
# Connect to your database and run:
psql -d your_database -f database/migrations/add_comprehensive_sponsor_fields.sql
```

### Step 2: Update API
- Modify GET endpoint to include new fields
- Modify POST endpoint to save all fields
- Add PUT endpoint for updates

### Step 3: Build UI
- Create multi-step form component
- Add all 10 sections
- Add navigation (Previous/Next buttons)
- Add progress indicator

### Step 4: Add Validation
- Client-side validation
- Server-side validation
- Error messages

### Step 5: Test
- Test each section saves correctly
- Test validation works
- Test edit functionality

---

## 📦 COMPONENTS NEEDED:

1. `SponsorFormWizard.tsx` - Main multi-step form
2. `SponsorBasicInfo.tsx` - Section 1
3. `SponsorContactDetails.tsx` - Section 2
4. `SponsorPayment.tsx` - Section 3
5. `SponsorBrandingOnline.tsx` - Section 4
6. `SponsorBrandingOffline.tsx` - Section 5
7. `SponsorEventPresence.tsx` - Section 6
8. `SponsorGiveaways.tsx` - Section 7
9. `SponsorLegal.tsx` - Section 8
10. `SponsorTimeline.tsx` - Section 9
11. `SponsorPostEvent.tsx` - Section 10

---

## 🚀 ESTIMATED TIME:

- API Updates: 20 minutes
- UI Components: 90 minutes
- Testing: 15 minutes
**Total: ~2 hours**

---

## ✅ CURRENT STATUS:

- ✅ Database schema created
- ✅ TypeScript interfaces defined
- ✅ Validation helper created
- ⏳ API updates (next)
- ⏳ UI form (after API)
- ⏳ Testing (final)

**Ready to proceed with API updates!**
