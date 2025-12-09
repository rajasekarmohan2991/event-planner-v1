-- Seat Inventory Table (generated from floor plan)
CREATE TABLE IF NOT EXISTS seat_inventory (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  section VARCHAR(100), -- e.g., 'VIP', 'General', 'Balcony'
  row_number VARCHAR(10) NOT NULL, -- e.g., 'A', 'B', 'C', '1', '2'
  seat_number VARCHAR(10) NOT NULL, -- e.g., '1', '2', '3', '15'
  seat_type VARCHAR(50), -- e.g., 'Standard', 'VIP', 'Wheelchair'
  base_price DECIMAL(10,2) NOT NULL,
  x_coordinate INT, -- Position in 2D floor plan
  y_coordinate INT,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, section, row_number, seat_number)
);

CREATE INDEX idx_seat_inventory_event ON seat_inventory(event_id);
CREATE INDEX idx_seat_inventory_availability ON seat_inventory(event_id, is_available);

-- Seat Reservations Table (tracks bookings)
CREATE TABLE IF NOT EXISTS seat_reservations (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  seat_id BIGINT NOT NULL REFERENCES seat_inventory(id),
  registration_id BIGINT, -- Links to registrations table
  user_id BIGINT,
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'RESERVED', -- RESERVED, LOCKED, CONFIRMED, CANCELLED
  reserved_at TIMESTAMP DEFAULT NOW(),
  confirmed_at TIMESTAMP,
  expires_at TIMESTAMP, -- Temporary lock expires after 15 minutes
  payment_status VARCHAR(50), -- PENDING, PAID, FAILED, REFUNDED
  price_paid DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_seat_reservations_event ON seat_reservations(event_id);
CREATE INDEX idx_seat_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX idx_seat_reservations_status ON seat_reservations(status, expires_at);
CREATE INDEX idx_seat_reservations_registration ON seat_reservations(registration_id);

-- Floor Plan Configurations (stores the 2D layout design)
CREATE TABLE IF NOT EXISTS floor_plan_configs (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  plan_name VARCHAR(255),
  layout_data JSONB NOT NULL, -- Stores the complete floor plan design
  total_seats INT,
  sections JSONB, -- Array of sections with pricing
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, plan_name)
);

CREATE INDEX idx_floor_plan_event ON floor_plan_configs(event_id);

-- Pricing Rules (dynamic pricing based on section, row, etc.)
CREATE TABLE IF NOT EXISTS seat_pricing_rules (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  section VARCHAR(100),
  row_pattern VARCHAR(50), -- e.g., 'A-C', '1-5', 'VIP%'
  seat_type VARCHAR(50),
  base_price DECIMAL(10,2) NOT NULL,
  multiplier DECIMAL(5,2) DEFAULT 1.0, -- For dynamic pricing
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_event ON seat_pricing_rules(event_id);

-- Comments
COMMENT ON TABLE seat_inventory IS 'Stores all seats generated from floor plan design';
COMMENT ON TABLE seat_reservations IS 'Tracks seat bookings and payment status';
COMMENT ON TABLE floor_plan_configs IS 'Stores 2D floor plan layouts';
COMMENT ON TABLE seat_pricing_rules IS 'Dynamic pricing rules for different sections/rows';

COMMENT ON COLUMN seat_reservations.status IS 'RESERVED: User selected, LOCKED: Payment in progress, CONFIRMED: Paid, CANCELLED: Released';
COMMENT ON COLUMN seat_reservations.expires_at IS 'Temporary reservation expires after 15 minutes if not paid';
