-- Ensure VIP Seat Registration Script
-- This script verifies and fixes issues with VIP and all other seat types

-- 1. Check and standardize seat_type values (some are lowercase, some are uppercase)
UPDATE seat_inventory
SET seat_type = 'VIP'
WHERE seat_type = 'vip';

UPDATE seat_inventory
SET seat_type = 'PREMIUM'
WHERE seat_type = 'Premium';

UPDATE seat_inventory
SET seat_type = 'STANDARD'
WHERE seat_type = 'General';

-- 2. Add indexes to improve query performance
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seat_inventory_seat_type') THEN
    CREATE INDEX idx_seat_inventory_seat_type ON seat_inventory(seat_type);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_seat_inventory_event_seat_type') THEN
    CREATE INDEX idx_seat_inventory_event_seat_type ON seat_inventory(event_id, seat_type);
  END IF;
END $$;

-- 3. Verify price structure for VIP seats (they should be more expensive)
-- This will show if any VIP seats have lower prices than standard seats
SELECT 
  event_id,
  'VIP seat price issue' as issue,
  'VIP seats cheaper than standard seats' as description
FROM (
  SELECT 
    event_id,
    MIN(CASE WHEN seat_type = 'VIP' THEN base_price ELSE NULL END) as min_vip_price,
    MAX(CASE WHEN seat_type = 'STANDARD' THEN base_price ELSE NULL END) as max_standard_price
  FROM seat_inventory
  GROUP BY event_id
) prices
WHERE min_vip_price <= max_standard_price AND min_vip_price IS NOT NULL AND max_standard_price IS NOT NULL;

-- 4. Fix any VIP seats with incorrect pricing (optional, uncomment to apply)
-- This sets VIP seat prices to at least 50% more than the highest standard seat price for the same event
/*
WITH event_prices AS (
  SELECT 
    event_id, 
    MAX(CASE WHEN seat_type = 'STANDARD' THEN base_price ELSE 0 END) * 1.5 as min_vip_price
  FROM seat_inventory
  GROUP BY event_id
)
UPDATE seat_inventory si
SET base_price = GREATEST(si.base_price, ep.min_vip_price)
FROM event_prices ep
WHERE si.event_id = ep.event_id 
  AND si.seat_type = 'VIP'
  AND si.base_price < ep.min_vip_price;
*/

-- 5. Check reservation constraints
-- Ensure all necessary columns exist and are properly configured
DO $$ 
BEGIN
  -- Make sure reservation_id allows NULL for temporary reservations
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'seat_reservations' 
      AND column_name = 'registration_id' 
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE seat_reservations ALTER COLUMN registration_id DROP NOT NULL;
  END IF;
END $$;

-- 6. Set a unique constraint on event+seat to prevent double booking
-- This ensures no seat can be confirmed multiple times
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'uq_seat_reservation_confirmed'
  ) THEN
    CREATE UNIQUE INDEX uq_seat_reservation_confirmed 
    ON seat_reservations (seat_id) 
    WHERE status = 'CONFIRMED';
  END IF;
END $$;

-- 7. Output a summary of the available seats by type and event
SELECT 
  event_id,
  seat_type,
  COUNT(*) as total_seats,
  SUM(CASE WHEN is_available THEN 1 ELSE 0 END) as available_seats,
  MIN(base_price) as min_price,
  MAX(base_price) as max_price
FROM seat_inventory
GROUP BY event_id, seat_type
ORDER BY event_id, 
  CASE 
    WHEN seat_type = 'VIP' THEN 1
    WHEN seat_type = 'PREMIUM' THEN 2
    ELSE 3
  END;

-- 8. Status of current reservations
SELECT 
  sr.event_id,
  sr.status,
  sr.payment_status,
  COUNT(*) as count
FROM seat_reservations sr
GROUP BY sr.event_id, sr.status, sr.payment_status
ORDER BY sr.event_id, sr.status;
