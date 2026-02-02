-- Extend events table with venue/address/city/price_inr
ALTER TABLE events
    ADD COLUMN IF NOT EXISTS venue TEXT,
    ADD COLUMN IF NOT EXISTS address TEXT,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS price_inr INTEGER;
