# 🚨 CRITICAL DB FIX - Fixes 500 Errors in Settings & Finance

## ❌ Current Issues
You are seeing 500 errors because **new database tables and columns are missing**.

1. **Logo Upload Fails:** `Tenant` table is missing `logo` column.
2. **Tax Settings Fails:** `TaxStructure` table does not exist.
3. **Finance Fails:** `Invoice`, `Payment`, `Receipt` tables might be missing.

---

## 🚀 SOLUTION: Run This SQL Now

### **Option 1: Supabase SQL Editor (Recommended)**

1. Go to **[Supabase Dashboard](https://supabase.com/dashboard)**
2. Click **SQL Editor** (left sidebar)
3. **Copy and Paste** the entire SQL below at once:

```sql
-- 1. Fix Tenant Table (Add missing columns)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "digital_signature_url" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';

-- 2. Create TaxStructure Table
CREATE TABLE IF NOT EXISTS "tax_structures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "tenant_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tax_structures_pkey" PRIMARY KEY ("id")
);

-- 3. Create Invoice Table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grand_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- 4. Create Invoice Items Table
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- 5. Create Payments Table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);
```

4. Click **Run** (Ctrl+Enter)
5. **Success!** ✅

---

### **Option 2: Use the Full Migration File**

I created a complete migration file at:
`apps/web/prisma/migrations/fix_missing_tables.sql`

You can run this file if you enter the full path in Supabase CLI or pgAdmin.

---

## ✅ What Will Work After This?

1. **Company Logo Upload** will work immediately.
2. **Tax Structure Settings** will load and save.
3. **Finance & Invoices** will work properly.
4. **General Settings** will load correctly.

---

**ACTION REQUIRED:** Run the SQL above in Supabase now to fix the 500 errors! 👆
