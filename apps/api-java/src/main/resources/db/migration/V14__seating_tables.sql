-- Create seating and floor plan tables used by the web app's seat selector

-- floor_plan_configs stores the generated layout JSON and metadata
CREATE TABLE IF NOT EXISTS floor_plan_configs (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL,
  plan_name    TEXT   NOT NULL,
  layout_data  JSONB,
  total_seats  INTEGER DEFAULT 0,
  sections     JSONB,
  tenant_id    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- unique name per event
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'ux_floor_plan_event_name'
  ) THEN
    CREATE UNIQUE INDEX ux_floor_plan_event_name ON floor_plan_configs (event_id, plan_name);
  END IF;
END $$;

-- seat_inventory stores each physical seat with coordinates and pricing
CREATE TABLE IF NOT EXISTS seat_inventory (
  id            BIGSERIAL PRIMARY KEY,
  event_id      BIGINT NOT NULL,
  section       TEXT   NOT NULL,
  row_number    TEXT   NOT NULL,
  seat_number   TEXT   NOT NULL,
  seat_type     TEXT,
  base_price    NUMERIC,
  x_coordinate  NUMERIC,
  y_coordinate  NUMERIC,
  is_available  BOOLEAN DEFAULT TRUE,
  tenant_id     TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_inventory_event'
  ) THEN
    CREATE INDEX idx_seat_inventory_event ON seat_inventory (event_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_inventory_event_section_row'
  ) THEN
    CREATE INDEX idx_seat_inventory_event_section_row ON seat_inventory (event_id, section, row_number);
  END IF;
END $$;

-- seat_reservations tracks temporary holds and confirmations
CREATE TABLE IF NOT EXISTS seat_reservations (
  id          BIGSERIAL PRIMARY KEY,
  seat_id     BIGINT REFERENCES seat_inventory(id) ON DELETE CASCADE,
  event_id    BIGINT NOT NULL,
  user_email  TEXT,
  status      TEXT NOT NULL, -- RESERVED | LOCKED | CONFIRMED | EXPIRED
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_res_event'
  ) THEN
    CREATE INDEX idx_seat_res_event ON seat_reservations (event_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_res_seat'
  ) THEN
    CREATE INDEX idx_seat_res_seat ON seat_reservations (seat_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_res_status_exp'
  ) THEN
    CREATE INDEX idx_seat_res_status_exp ON seat_reservations (status, expires_at);
  END IF;
END $$;

-- seat_pricing_rules stores optional pricing rules by row/section/type
CREATE TABLE IF NOT EXISTS seat_pricing_rules (
  id           BIGSERIAL PRIMARY KEY,
  event_id     BIGINT NOT NULL,
  section      TEXT,
  row_pattern  TEXT,
  seat_type    TEXT,
  base_price   NUMERIC NOT NULL,
  multiplier   NUMERIC DEFAULT 1.0
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_seat_price_rules_event'
  ) THEN
    CREATE INDEX idx_seat_price_rules_event ON seat_pricing_rules (event_id);
  END IF;
END $$;
