# Sponsor Tier Configuration Feature

## Overview
Add ability to configure sponsor tiers with amount thresholds in event settings, and automatically assign tiers based on sponsor contribution amounts.

---

## Feature Requirements

### 1. Sponsor Tier Settings (Event Settings Page)
Configure tier thresholds for each event:

```
PLATINUM: ≥ ₹5,00,000
GOLD: ≥ ₹2,50,000
SILVER: ≥ ₹1,00,000
BRONZE: ≥ ₹50,000
PARTNER: < ₹50,000
```

### 2. Sponsor Form Enhancement
Add "Amount" field to sponsor creation/editing:
- Input field for contribution amount
- Auto-assign tier based on configured thresholds
- Allow manual tier override if needed

### 3. Tier Assignment Logic
```typescript
function assignTier(amount: number, tiers: TierConfig): SponsorTier {
  if (amount >= tiers.platinum) return 'PLATINUM'
  if (amount >= tiers.gold) return 'GOLD'
  if (amount >= tiers.silver) return 'SILVER'
  if (amount >= tiers.bronze) return 'BRONZE'
  return 'PARTNER'
}
```

---

## Implementation Steps

### Step 1: Add Tier Configuration to Event Settings

Create `/events/[id]/settings/sponsor-tiers` page:

```typescript
interface TierConfig {
  platinum: number  // e.g., 500000
  gold: number      // e.g., 250000
  silver: number    // e.g., 100000
  bronze: number    // e.g., 50000
  // PARTNER is anything below bronze
}
```

### Step 2: Update Sponsor Form

Add to `/events/[id]/sponsors/page.tsx`:

```typescript
const [amount, setAmount] = useState<number>(0)

// Auto-calculate tier when amount changes
useEffect(() => {
  const calculatedTier = calculateTier(amount, tierConfig)
  setTier(calculatedTier)
}, [amount, tierConfig])

// In form:
<div>
  <label>Contribution Amount (₹)</label>
  <input 
    type="number" 
    value={amount} 
    onChange={e => setAmount(Number(e.target.value))}
    placeholder="e.g., 250000"
  />
</div>

<div>
  <label>Tier (Auto-assigned)</label>
  <select value={tier} onChange={e => setTier(e.target.value)}>
    <option value="PLATINUM">PLATINUM (≥ ₹{tierConfig.platinum.toLocaleString()})</option>
    <option value="GOLD">GOLD (≥ ₹{tierConfig.gold.toLocaleString()})</option>
    <option value="SILVER">SILVER (≥ ₹{tierConfig.silver.toLocaleString()})</option>
    <option value="BRONZE">BRONZE (≥ ₹{tierConfig.bronze.toLocaleString()})</option>
    <option value="PARTNER">PARTNER</option>
  </select>
  <p className="text-xs text-gray-500">
    Based on amount: {calculateTier(amount, tierConfig)}
  </p>
</div>
```

### Step 3: Store Tier Config

Options:
1. **In Event metadata** (Quick solution)
2. **Separate table** (Better for complex scenarios)

**Option 1 - Event Metadata (Recommended):**
```typescript
// Store in event's metadata JSON field
const tierConfig = {
  platinum: 500000,
  gold: 250000,
  silver: 100000,
  bronze: 50000
}

// API: PUT /api/events/[id]/sponsor-tier-config
```

### Step 4: Update API

Modify sponsor creation to include amount:

```typescript
// POST /api/events/[id]/sponsors
{
  name: "Company Name",
  amount: 250000,  // ← New field
  tier: "GOLD",    // Auto-assigned or manual
  website: "...",
  logoUrl: "..."
}
```

---

## UI/UX Design

### Event Settings - Sponsor Tiers Tab

```
┌─────────────────────────────────────────┐
│ 🎯 Sponsor Tier Configuration           │
├─────────────────────────────────────────┤
│                                         │
│ Configure minimum amounts for each tier │
│                                         │
│ PLATINUM  ₹ [500,000    ]              │
│ GOLD      ₹ [250,000    ]              │
│ SILVER    ₹ [100,000    ]              │
│ BRONZE    ₹ [50,000     ]              │
│ PARTNER   < Bronze amount              │
│                                         │
│ [Save Configuration]                    │
└─────────────────────────────────────────┘
```

### Add Sponsor Form (Enhanced)

```
┌─────────────────────────────────────────┐
│ Add Sponsor                             │
├─────────────────────────────────────────┤
│ Company Name: [New Age Sponsor      ]  │
│                                         │
│ Contribution Amount (₹):                │
│ [250,000                            ]  │
│                                         │
│ Tier: [GOLD ▼]                         │
│ ℹ️ Auto-assigned based on amount       │
│ (You can override if needed)            │
│                                         │
│ Website: [https://example.com       ]  │
│ Logo: [Choose File] [Upload]          │
│                                         │
│ [Add Sponsor]                          │
└─────────────────────────────────────────┘
```

---

## Benefits

✅ **Automated Tier Assignment** - No manual tier selection needed
✅ **Consistent Categorization** - Based on actual contribution
✅ **Flexible Configuration** - Each event can have different thresholds
✅ **Manual Override** - Can still manually adjust tier if needed
✅ **Transparent** - Shows tier thresholds in the dropdown
✅ **Easy Reporting** - Can track total sponsorship by tier

---

## Example Tier Configurations

### Tech Conference
```
PLATINUM: ≥ ₹10,00,000
GOLD:     ≥ ₹5,00,000
SILVER:   ≥ ₹2,00,000
BRONZE:   ≥ ₹1,00,000
PARTNER:  < ₹1,00,000
```

### Community Event
```
PLATINUM: ≥ ₹1,00,000
GOLD:     ≥ ₹50,000
SILVER:   ≥ ₹25,000
BRONZE:   ≥ ₹10,000
PARTNER:  < ₹10,000
```

### Corporate Summit
```
PLATINUM: ≥ ₹25,00,000
GOLD:     ≥ ₹10,00,000
SILVER:   ≥ ₹5,00,000
BRONZE:   ≥ ₹2,00,000
PARTNER:  < ₹2,00,000
```

---

## Database Changes Needed

If using external API, coordinate with backend team to add:

1. **Event tier configuration** endpoint
2. **Sponsor amount** field
3. **Auto-tier calculation** logic

If using Prisma locally, add migration:

```prisma
model Event {
  // ... existing fields
  sponsorTierConfig Json? // Store tier thresholds
}

// Or separate table:
model SponsorTierConfig {
  id        String @id @default(cuid())
  eventId   BigInt
  platinum  Int
  gold      Int
  silver    Int
  bronze    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  event Event @relation(fields: [eventId], references: [id])
}
```

---

## Next Steps

1. ✅ Create tier configuration page in event settings
2. ✅ Add amount field to sponsor form
3. ✅ Implement auto-tier calculation
4. ✅ Update API to handle amount field
5. ✅ Add tier thresholds display in dropdown
6. ✅ Test with various amounts

Would you like me to implement this feature now?
