-- Floor Plan Database Migration
-- Run this in your Supabase SQL Editor

-- 1. Create floor_plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS floor_plans (
    id TEXT PRIMARY KEY,
    "eventId" BIGINT NOT NULL,
    tenant_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    "canvasWidth" INTEGER DEFAULT 1200,
    "canvasHeight" INTEGER DEFAULT 800,
    "backgroundColor" TEXT DEFAULT '#ffffff',
    "gridSize" INTEGER DEFAULT 20,
    "vipPrice" DECIMAL(10,2) DEFAULT 0,
    "premiumPrice" DECIMAL(10,2) DEFAULT 0,
    "generalPrice" DECIMAL(10,2) DEFAULT 0,
    "totalCapacity" INTEGER DEFAULT 0,
    "vipCapacity" INTEGER DEFAULT 0,
    "premiumCapacity" INTEGER DEFAULT 0,
    "generalCapacity" INTEGER DEFAULT 0,
    "menCapacity" INTEGER DEFAULT 0,
    "womenCapacity" INTEGER DEFAULT 0,
    "layoutData" JSONB DEFAULT '{}',
    status TEXT DEFAULT 'DRAFT',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_floor_plans_eventId ON floor_plans("eventId");
CREATE INDEX IF NOT EXISTS idx_floor_plans_tenant_id ON floor_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_status ON floor_plans(status);

-- 3. Add foreign key constraint to events table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'floor_plans_eventId_fkey'
    ) THEN
        ALTER TABLE floor_plans 
        ADD CONSTRAINT floor_plans_eventId_fkey 
        FOREIGN KEY ("eventId") 
        REFERENCES events(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_floor_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS floor_plans_updated_at ON floor_plans;
CREATE TRIGGER floor_plans_updated_at
    BEFORE UPDATE ON floor_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_floor_plans_updated_at();

-- 5. Verify table exists
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'floor_plans'
ORDER BY ordinal_position;
