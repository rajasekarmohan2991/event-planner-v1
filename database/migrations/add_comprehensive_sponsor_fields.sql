-- Comprehensive Sponsor Form - Database Migration
-- Add JSONB columns to store detailed sponsor information

ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS contact_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS branding_online JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS branding_offline JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS event_presence JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS giveaway_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS legal_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS timeline_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS post_event_data JSONB DEFAULT '{}'::jsonb;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sponsors_contact_email ON sponsors ((contact_data->>'email'));
CREATE INDEX IF NOT EXISTS idx_sponsors_payment_status ON sponsors ((payment_data->>'paymentStatus'));

-- Add comment for documentation
COMMENT ON COLUMN sponsors.contact_data IS 'Contact person details: name, designation, email, phone, whatsapp, alternate';
COMMENT ON COLUMN sponsors.payment_data IS 'Payment information: mode, status, invoice, amounts';
COMMENT ON COLUMN sponsors.branding_online IS 'Online branding: website, social media, email campaigns';
COMMENT ON COLUMN sponsors.branding_offline IS 'Offline branding: stage, standee, booth, entry gate';
COMMENT ON COLUMN sponsors.event_presence IS 'Event presence: booth, staff, speaking slots, demos';
COMMENT ON COLUMN sponsors.giveaway_data IS 'Giveaway details: type, quantity, distribution, value';
COMMENT ON COLUMN sponsors.legal_data IS 'Legal: contract, NDA, compliance, approvals';
COMMENT ON COLUMN sponsors.timeline_data IS 'Timeline: deadlines for logo, payment, setup, etc';
COMMENT ON COLUMN sponsors.post_event_data IS 'Post-event: reports, analytics, feedback requirements';
