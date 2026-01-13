# Tax Structure System - Implementation Guide

## Overview

This document describes the two-level tax structure system implemented in the Event Planner application:

1. **Global Tax Templates** - Managed by Super Admin, available to all companies
2. **Company Tax Structures** - Individual company settings, can use templates or create custom taxes

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER ADMIN LEVEL                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            Global Tax Templates                        │  │
│  │  • GST 18% (India)                                     │  │
│  │  • VAT 20% (UK)                                        │  │
│  │  • Sales Tax 7.5% (US)                                 │  │
│  │  • Configurable effective dates                        │  │
│  │  • Country-specific                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                          ↓ (available to)                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                     COMPANY LEVEL                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         Company Tax Structures                         │  │
│  │                                                        │  │
│  │  Option 1: Use Global Template                         │  │
│  │    → Linked to template, auto-updates                  │  │
│  │                                                        │  │
│  │  Option 2: Create Custom Tax                           │  │
│  │    → Company-specific rate and rules                   │  │
│  │                                                        │  │
│  │  • Set default tax for invoices                        │  │
│  │  • Multiple taxes supported                            │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### GlobalTaxTemplate
```sql
CREATE TABLE global_tax_templates (
    id              VARCHAR(255) PRIMARY KEY,
    name            VARCHAR(255) NOT NULL,
    rate            DOUBLE PRECISION NOT NULL,
    description     TEXT,
    tax_type        VARCHAR(50) DEFAULT 'GST',
    country_code    VARCHAR(2),
    is_active       BOOLEAN DEFAULT true,
    effective_from  TIMESTAMP,
    effective_until TIMESTAMP,
    applies_to      VARCHAR(50) DEFAULT 'ALL',
    is_compound     BOOLEAN DEFAULT false,
    created_by      BIGINT,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### TaxStructure (Enhanced)
```sql
-- Added columns:
ALTER TABLE tax_structures ADD COLUMN global_template_id VARCHAR(255);
ALTER TABLE tax_structures ADD COLUMN is_custom BOOLEAN DEFAULT false;
```

---

## API Endpoints

### Super Admin - Global Tax Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/super-admin/tax-templates` | List all global templates |
| POST | `/api/super-admin/tax-templates` | Create new template |
| GET | `/api/super-admin/tax-templates/[id]` | Get single template |
| PUT | `/api/super-admin/tax-templates/[id]` | Update template |
| DELETE | `/api/super-admin/tax-templates/[id]` | Delete/deactivate template |

### Super Admin - Company Tax Structures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/super-admin/companies/[id]/tax-structures` | List company taxes |
| POST | `/api/super-admin/companies/[id]/tax-structures` | Create tax for company |
| PUT | `/api/super-admin/companies/[id]/tax-structures/[taxId]` | Update company tax |
| DELETE | `/api/super-admin/companies/[id]/tax-structures/[taxId]` | Delete company tax |

### Company - Own Tax Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/company/tax-structures` | List own company taxes |
| POST | `/api/company/tax-structures` | Create tax for own company |
| PUT | `/api/company/tax-structures/[id]` | Update own company tax |
| DELETE | `/api/company/tax-structures/[id]` | Delete own company tax |
| GET | `/api/company/global-tax-templates` | Get available global templates |

---

## User Interface

### Super Admin

1. **Global Tax Templates Page**
   - Location: `/super-admin/tax-templates`
   - Access: Super Admin sidebar → Tax Templates
   - Features:
     - Add, edit, delete global tax templates
     - Configure effective date ranges
     - Set country-specific taxes
     - View usage count (companies using each template)
     - Filter by country, search, show inactive

2. **Company Tax Structures (per company)**
   - Location: `/super-admin/companies/[id]/tax-structures`
   - Access: Super Admin → Company → Tax Settings
   - Features:
     - Add tax from global template or custom
     - Set company default tax
     - Edit/delete taxes

### Company Admin

1. **Tax Settings Page**
   - Location: `/admin/settings/tax`
   - Access: Admin sidebar → Tax Settings
   - Features:
     - View available global templates
     - Add template-based or custom taxes
     - Set default tax for invoices
     - Edit/delete taxes

---

## Setup Instructions

### 1. Run Database Migration

Execute the migration script to create new tables:

```bash
# Connect to your database and run:
psql -d your_database -f migrations/add_global_tax_templates.sql
```

Or run via Supabase SQL Editor:
- Open Supabase Dashboard → SQL Editor
- Copy contents of `migrations/add_global_tax_templates.sql`
- Execute

### 2. Regenerate Prisma Client

```bash
cd apps/web
npx prisma generate
```

### 3. Restart Development Server

```bash
npm run dev
```

---

## Pre-seeded Templates

The migration includes these default templates:

| Template | Rate | Country | Type |
|----------|------|---------|------|
| GST 18% | 18.0% | India | GST |
| GST 12% | 12.0% | India | GST |
| GST 5% | 5.0% | India | GST |
| GST 0% | 0.0% | India | GST |
| VAT 20% | 20.0% | UK | VAT |
| VAT 5% | 5.0% | UK | VAT |
| VAT 0% | 0.0% | UK | VAT |
| Sales Tax 7.5% | 7.5% | US | SALES_TAX |
| No Tax | 0.0% | Global | OTHER |
| GST 10% | 10.0% | Australia | GST |
| GST 5% | 5.0% | Canada | GST |
| HST 13% | 13.0% | Canada | GST |
| VAT 19% | 19.0% | Germany | VAT |
| TVA 20% | 20.0% | France | VAT |
| GST 8% | 8.0% | Singapore | GST |
| VAT 5% | 5.0% | UAE | VAT |

---

## Usage Examples

### Super Admin: Add New Tax Template

1. Navigate to `/super-admin/tax-templates`
2. Click "Add Tax Template"
3. Fill in:
   - Name: "Service Tax 12%"
   - Rate: 12.0
   - Tax Type: SERVICE_TAX
   - Country: India
   - Effective From: 2026-01-01
   - Effective Until: (leave empty for no end date)
4. Click "Create Template"

### Company: Use a Global Template

1. Navigate to `/admin/settings/tax`
2. Click "Add Tax Structure"
3. Select "Use Global Template"
4. Choose "GST 18%" from the list
5. Check "Set as default"
6. Click "Create Tax"

### Company: Create Custom Tax

1. Navigate to `/admin/settings/tax`
2. Click "Add Tax Structure"
3. Select "Custom Tax"
4. Fill in:
   - Name: "Local Levy 2%"
   - Rate: 2.0
   - Description: "City levy tax"
5. Click "Create Tax"

---

## Notes

- **Template Updates**: When a global template rate is updated, companies using it (without custom overrides) will automatically get the new rate.
- **Deactivation vs Deletion**: Templates in use by companies are deactivated rather than deleted.
- **Effective Dates**: Templates outside their effective date range won't appear in company selection lists.
- **Default Tax**: Each company can set one tax as default, which is auto-applied to new invoices.

---

## Files Created/Modified

### New Files
- `apps/web/app/api/super-admin/tax-templates/route.ts`
- `apps/web/app/api/super-admin/tax-templates/[templateId]/route.ts`
- `apps/web/app/(admin)/super-admin/tax-templates/page.tsx`
- `apps/web/app/api/company/tax-structures/route.ts`
- `apps/web/app/api/company/tax-structures/[taxId]/route.ts`
- `apps/web/app/api/company/global-tax-templates/route.ts`
- `apps/web/app/(admin)/admin/settings/tax/page.tsx`
- `migrations/add_global_tax_templates.sql`

### Modified Files
- `apps/web/prisma/schema.prisma` - Added GlobalTaxTemplate model and enhanced TaxStructure
- `apps/web/app/api/super-admin/companies/[id]/tax-structures/route.ts` - Added globalTemplateId support
- `apps/web/app/api/super-admin/companies/[id]/tax-structures/[taxId]/route.ts` - Added globalTemplateId support
- `apps/web/app/(admin)/super-admin/companies/[id]/tax-structures/page.tsx` - Enhanced UI with template selection
- `apps/web/components/admin/AdminSidebar.tsx` - Added navigation links

---

**Implementation Status**: Complete ✅
**Database Migration Required**: Yes
**Prisma Generate Required**: Yes
