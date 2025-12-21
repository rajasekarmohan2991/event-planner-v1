-- Create floor_plans table for production database
-- This is the seat selector feature - CRITICAL for the application

CREATE TABLE IF NOT EXISTS floor_plans (
    id TEXT PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    tenant_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    "canvasWidth" INTEGER NOT NULL DEFAULT 1200,
    "canvasHeight" INTEGER NOT NULL DEFAULT 800,
    "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
    "gridSize" INTEGER NOT NULL DEFAULT 20,
    "vipPrice" NUMERIC NOT NULL DEFAULT 0,
    "premiumPrice" NUMERIC NOT NULL DEFAULT 0,
    "generalPrice" NUMERIC NOT NULL DEFAULT 0,
    "totalCapacity" INTEGER NOT NULL DEFAULT 0,
    "vipCapacity" INTEGER NOT NULL DEFAULT 0,
    "premiumCapacity" INTEGER NOT NULL DEFAULT 0,
    "generalCapacity" INTEGER NOT NULL DEFAULT 0,
    "menCapacity" INTEGER NOT NULL DEFAULT 0,
    "womenCapacity" INTEGER NOT NULL DEFAULT 0,
    "layoutData" JSONB,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_floor_plans_event ON floor_plans("eventId");

-- Create event_vendors table (also missing)
CREATE TABLE IF NOT EXISTS event_vendors (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    tenant_id TEXT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    contract_amount NUMERIC NOT NULL DEFAULT 0,
    paid_amount NUMERIC NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    payment_due_date TIMESTAMP WITHOUT TIME ZONE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    notes TEXT,
    contract_url TEXT,
    invoice_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_vendors_event ON event_vendors(event_id);
