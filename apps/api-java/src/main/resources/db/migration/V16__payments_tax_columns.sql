-- Add tax breakdown columns to payments table
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS subtotal_in_minor INTEGER,
  ADD COLUMN IF NOT EXISTS tax_amount_in_minor INTEGER,
  ADD COLUMN IF NOT EXISTS tax_rate_percent INTEGER;
