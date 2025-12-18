# Budget & Vendor Management System - Implementation Plan

## Requirements

### Budget Management
1. ✅ Set budget for categories (Catering, Venue, Photography, Entertainment, Decoration, Other)
2. ✅ Show total budget
3. ✅ Track spent amount per category
4. ✅ Show remaining amount per category
5. ✅ Visual progress bars

### Vendor Management
1. ✅ Add vendors to categories
2. ✅ Track vendor costs
3. ✅ Validate against budget limit
4. ✅ Show warning if exceeding budget
5. ✅ Payment method selection
6. ✅ Payment status tracking (Pending, Paid, Booked)
7. ✅ Cancel vendor option
8. ✅ Update budget when vendor added/removed

### Features
- Real-time budget calculation
- Category-wise breakdown
- Vendor list with payment status
- Budget vs Spent comparison
- Validation before adding vendor
- Payment tracking
- Cancellation with budget adjustment

---

## Database Schema

### Budget Table
```prisma
model EventBudget {
  id          BigInt   @id @default(autoincrement())
  eventId     BigInt   @map("event_id")
  category    String   // Catering, Venue, Photography, etc.
  budgetAmount Decimal @map("budget_amount")
  spentAmount  Decimal @map("spent_amount") @default(0)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  vendors     EventVendor[]
  
  @@unique([eventId, category])
  @@map("event_budgets")
}
```

### Vendor Table
```prisma
model EventVendor {
  id            BigInt   @id @default(autoincrement())
  eventId       BigInt   @map("event_id")
  budgetId      BigInt   @map("budget_id")
  name          String
  category      String
  cost          Decimal
  paymentMethod String?  @map("payment_method") // Cash, Card, UPI, Bank Transfer
  paymentStatus String   @default("PENDING") @map("payment_status") // PENDING, PAID, BOOKED
  contactPerson String?  @map("contact_person")
  contactEmail  String?  @map("contact_email")
  contactPhone  String?  @map("contact_phone")
  notes         String?
  paidAt        DateTime? @map("paid_at")
  cancelledAt   DateTime? @map("cancelled_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  event         Event       @relation(fields: [eventId], references: [id], onDelete: Cascade)
  budget        EventBudget @relation(fields: [budgetId], references: [id], onDelete: Cascade)
  
  @@map("event_vendors")
}
```

---

## API Endpoints

### Budgets
- `GET /api/events/[id]/budgets` - Get all budgets with totals
- `POST /api/events/[id]/budgets` - Set budget for category
- `PUT /api/events/[id]/budgets/[budgetId]` - Update budget
- `DELETE /api/events/[id]/budgets/[budgetId]` - Delete budget

### Vendors
- `GET /api/events/[id]/vendors` - Get all vendors
- `POST /api/events/[id]/vendors` - Add vendor (with validation)
- `PUT /api/events/[id]/vendors/[vendorId]` - Update vendor
- `DELETE /api/events/[id]/vendors/[vendorId]` - Cancel vendor
- `POST /api/events/[id]/vendors/[vendorId]/pay` - Mark as paid

---

## UI Components

### Budget Overview
```tsx
<BudgetCard category="Catering">
  <Budget>₹50,000</Budget>
  <Spent>₹30,000</Spent>
  <Remaining>₹20,000</Remaining>
  <ProgressBar value={60%} />
</BudgetCard>
```

### Add Vendor Modal
```tsx
<AddVendorModal>
  <Select category />
  <Input name />
  <Input cost />
  <Select paymentMethod />
  <Input contactPerson />
  <Input contactEmail />
  <Input contactPhone />
  <Textarea notes />
  
  {/* Validation */}
  {cost > remaining && (
    <Alert>
      ⚠️ Cost exceeds budget by ₹{cost - remaining}
    </Alert>
  )}
  
  <Button>Add Vendor</Button>
</AddVendorModal>
```

### Vendor List
```tsx
<VendorCard vendor={vendor}>
  <Name>{vendor.name}</Name>
  <Category>{vendor.category}</Category>
  <Cost>₹{vendor.cost}</Cost>
  <PaymentStatus>{vendor.paymentStatus}</PaymentStatus>
  <PaymentMethod>{vendor.paymentMethod}</PaymentMethod>
  
  <Actions>
    {status === 'PENDING' && (
      <Button onClick={markAsPaid}>Mark as Paid</Button>
    )}
    <Button onClick={cancelVendor}>Cancel</Button>
  </Actions>
</VendorCard>
```

---

## Validation Rules

### Adding Vendor
1. Check if budget exists for category
2. Calculate current spent + new cost
3. If exceeds budget:
   - Show warning
   - Allow override with confirmation
4. Update spent amount after adding

### Cancelling Vendor
1. Subtract vendor cost from spent amount
2. Update budget remaining
3. Mark vendor as cancelled
4. Don't delete (keep history)

### Payment Status Flow
```
PENDING → (Mark as Paid) → PAID → (Confirm Booking) → BOOKED
                ↓
           (Cancel) → CANCELLED
```

---

## Implementation Files

### 1. Budget Page
`apps/web/app/events/[id]/budgets/page.tsx`
- Budget overview cards
- Total budget summary
- Add/Edit budget modal
- Category breakdown

### 2. Vendor Management
`apps/web/app/events/[id]/vendors/page.tsx`
- Vendor list
- Add vendor modal
- Payment tracking
- Cancel vendor

### 3. API Routes
- `apps/web/app/api/events/[id]/budgets/route.ts`
- `apps/web/app/api/events/[id]/vendors/route.ts`
- `apps/web/app/api/events/[id]/vendors/[vendorId]/route.ts`

### 4. Components
- `apps/web/components/budgets/BudgetCard.tsx`
- `apps/web/components/budgets/AddBudgetModal.tsx`
- `apps/web/components/budgets/VendorCard.tsx`
- `apps/web/components/budgets/AddVendorModal.tsx`

---

## Features Breakdown

### Phase 1: Budget Setup ✅
- Create budget categories
- Set budget amounts
- Show total budget
- Calculate remaining

### Phase 2: Vendor Management ✅
- Add vendors to categories
- Validate against budget
- Show warnings
- Track payment method

### Phase 3: Payment Tracking ✅
- Payment status (Pending/Paid/Booked)
- Mark as paid
- Payment method selection
- Payment date tracking

### Phase 4: Cancellation ✅
- Cancel vendor
- Adjust budget
- Keep history
- Update spent amount

---

## Example Flow

### 1. Set Budget
```
User sets:
- Catering: ₹50,000
- Venue: ₹100,000
- Photography: ₹30,000

Total Budget: ₹180,000
```

### 2. Add Vendor
```
Add vendor:
- Name: "Delicious Catering"
- Category: Catering
- Cost: ₹35,000
- Payment Method: Bank Transfer
- Status: PENDING

Budget Update:
- Catering Budget: ₹50,000
- Spent: ₹35,000
- Remaining: ₹15,000
```

### 3. Try to Exceed Budget
```
Add vendor:
- Name: "Premium Caterer"
- Category: Catering
- Cost: ₹20,000

Validation:
❌ Warning: This will exceed budget by ₹5,000
Current: ₹35,000
New: ₹20,000
Total: ₹55,000
Budget: ₹50,000

Options:
- Cancel
- Proceed Anyway (with confirmation)
```

### 4. Mark as Paid
```
Vendor: "Delicious Catering"
Status: PENDING → PAID
Payment Date: 2025-01-15
Payment Method: Bank Transfer
```

### 5. Cancel Vendor
```
Cancel: "Delicious Catering"
Cost: ₹35,000

Budget Update:
- Catering Spent: ₹35,000 → ₹0
- Remaining: ₹15,000 → ₹50,000

Vendor Status: CANCELLED
```

---

## Next Steps

1. Create Prisma schema models
2. Run migration
3. Create API routes
4. Build UI components
5. Implement validation
6. Add payment tracking
7. Test thoroughly

---

## Benefits

✅ Complete budget visibility
✅ Prevent overspending
✅ Track all vendors
✅ Payment management
✅ Historical records
✅ Real-time calculations
✅ Category-wise breakdown
✅ Professional vendor management
