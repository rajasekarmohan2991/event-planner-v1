-- Extend reservation table with fields used by web routes and seed demo seats for event 1

-- Add missing columns if not exist
ALTER TABLE IF EXISTS seat_reservations
  ADD COLUMN IF NOT EXISTS user_id BIGINT,
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS price_paid NUMERIC,
  ADD COLUMN IF NOT EXISTS registration_id BIGINT,
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Ensure floor plan record for event 1
INSERT INTO floor_plan_configs (
  event_id, plan_name, layout_data, total_seats, sections, tenant_id
) VALUES (
  1,
  '2D Floor Plan',
  '{"name":"2D Floor Plan","totalSeats":(2*8 + 3*10 + 4*12),"sections":[{"name":"VIP","type":"VIP","basePrice":1500},{"name":"PREMIUM","type":"PREMIUM","basePrice":800},{"name":"GENERAL","type":"GENERAL","basePrice":500}]}'::jsonb,
  (2*8 + 3*10 + 4*12),
  '[{"name":"VIP","type":"VIP","basePrice":1500},{"name":"PREMIUM","type":"PREMIUM","basePrice":800},{"name":"GENERAL","type":"GENERAL","basePrice":500}]'::jsonb,
  'demo-tenant'
)
ON CONFLICT (event_id, plan_name) DO UPDATE SET
  layout_data = EXCLUDED.layout_data,
  total_seats = EXCLUDED.total_seats,
  sections = EXCLUDED.sections,
  tenant_id = EXCLUDED.tenant_id,
  updated_at = NOW();

-- Wipe existing demo seats for idempotency
DELETE FROM seat_inventory WHERE event_id = 1;

-- Seed VIP: 2 rows × 8 seats
INSERT INTO seat_inventory (
  event_id, section, row_number, seat_number, seat_type, base_price, x_coordinate, y_coordinate, is_available, tenant_id
)
SELECT
  1,
  'VIP',
  'V' || r,
  s::text,
  'VIP',
  1500,
  s * 50,
  50 + r * 50,
  true,
  'demo-tenant'
FROM generate_series(1,2) r, generate_series(1,8) s;

-- Seed PREMIUM: 3 rows × 10 seats
INSERT INTO seat_inventory (
  event_id, section, row_number, seat_number, seat_type, base_price, x_coordinate, y_coordinate, is_available, tenant_id
)
SELECT
  1,
  'PREMIUM',
  'P' || r,
  s::text,
  'PREMIUM',
  800,
  s * 50,
  200 + r * 50,
  true,
  'demo-tenant'
FROM generate_series(1,3) r, generate_series(1,10) s;

-- Seed GENERAL: 4 rows × 12 seats
INSERT INTO seat_inventory (
  event_id, section, row_number, seat_number, seat_type, base_price, x_coordinate, y_coordinate, is_available, tenant_id
)
SELECT
  1,
  'GENERAL',
  'G' || r,
  s::text,
  'GENERAL',
  500,
  s * 50,
  400 + r * 50,
  true,
  'demo-tenant'
FROM generate_series(1,4) r, generate_series(1,12) s;
