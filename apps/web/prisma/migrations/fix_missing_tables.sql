-- 🚨 URGENT: Apply this SQL to fix 500 errors in Settings & Finance
-- These tables and columns are likely missing if you didn't run migrations

-- 1. Fix Tenant Table (Add potentially missing columns)
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "logo" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "digital_signature_url" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT DEFAULT '#3B82F6';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT DEFAULT '#10B981';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "timezone" TEXT DEFAULT 'UTC';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "currency" TEXT DEFAULT 'USD';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "dateFormat" TEXT DEFAULT 'MM/DD/YYYY';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "locale" TEXT DEFAULT 'en';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "plan" TEXT DEFAULT 'FREE';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'TRIAL';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxEvents" INTEGER DEFAULT 10;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxUsers" INTEGER DEFAULT 5;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "maxStorage" INTEGER DEFAULT 1024;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "trialEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFromName" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailFromAddress" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "emailReplyTo" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "metadata" JSONB;

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

-- Add ForeignKey for TaxStructure
DO $$ BEGIN
 ALTER TABLE "tax_structures" ADD CONSTRAINT "tax_structures_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 3. Create Invoice Table
CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_id" BIGINT,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "recipientType" TEXT NOT NULL,
    "recipient_id" TEXT,
    "recipient_name" TEXT NOT NULL,
    "recipient_email" TEXT,
    "recipient_address" TEXT,
    "recipient_tax_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grand_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "terms" TEXT,
    "is_signed" BOOLEAN NOT NULL DEFAULT false,
    "signature_url" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- Add Unique Constraint for Invoice Number per Tenant
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_tenant_id_number_key" ON "invoices"("tenant_id", "number");

-- Add ForeignKey for Invoice
DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "invoices" ADD CONSTRAINT "invoices_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 4. Create InvoiceLineItem Table
CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "tax_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
);

-- Add ForeignKey for InvoiceLineItem
DO $$ BEGIN
 ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 5. Create Payment Table
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "payment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- Add ForeignKey for Payment
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- 6. Create Receipt Table
CREATE TABLE IF NOT EXISTS "receipts" (
    "id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "url" TEXT,
    "sent_to" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- Add ForeignKey for Receipt
DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "receipts" ADD CONSTRAINT "receipts_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
