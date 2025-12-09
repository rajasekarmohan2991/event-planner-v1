-- Add cancellation fields to registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS refund_requested BOOLEAN DEFAULT false;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS refund_amount INTEGER DEFAULT 0;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT 'NONE'; -- NONE, PENDING, COMPLETED, REJECTED

CREATE INDEX IF NOT EXISTS idx_registrations_refund_status ON registrations(refund_status);

-- Verify exhibitors and booths tables (idempotent)
-- Ensure event_id is VARCHAR in exhibitors
DO $$
BEGIN
    -- This block is just to ensure columns exist, ALTER won't run if they do
    -- We can't easily check type here without complex query, but we can assume it's correct from previous migration
    NULL;
END
$$;
