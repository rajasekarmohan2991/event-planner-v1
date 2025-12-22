-- Create seats table for individual seat tracking
CREATE TABLE IF NOT EXISTS seats (
  id TEXT PRIMARY KEY,
  floor_plan_id TEXT NOT NULL,
  event_id BIGINT NOT NULL,
  tenant_id VARCHAR(255),
  
  -- Seat identification
  section VARCHAR(50), -- e.g., 'A', 'B', 'VIP-1'
  row_number INT, -- e.g., 1, 2, 3
  seat_number INT, -- e.g., 1, 2, 3
  seat_label VARCHAR(50), -- e.g., 'A1', 'A2', 'VIP-1-5'
  
  -- Seat properties
  seat_type VARCHAR(50), -- 'CHAIR', 'TABLE_SEAT', 'STANDING'
  pricing_tier VARCHAR(50), -- 'VIP', 'PREMIUM', 'GENERAL'
  price_inr INT DEFAULT 0,
  
  -- Position (for rendering)
  x_position DECIMAL(10, 2),
  y_position DECIMAL(10, 2),
  rotation INT DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'RESERVED', 'BOOKED', 'BLOCKED'
  reserved_by BIGINT, -- user_id who reserved it
  reserved_at TIMESTAMP,
  booked_by BIGINT, -- user_id who booked it
  booked_at TIMESTAMP,
  registration_id TEXT, -- link to registration
  
  -- Metadata
  is_accessible BOOLEAN DEFAULT FALSE, -- wheelchair accessible
  is_aisle BOOLEAN DEFAULT FALSE,
  notes TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seats_floor_plan ON seats(floor_plan_id);
CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);
CREATE INDEX IF NOT EXISTS idx_seats_section ON seats(section);
CREATE INDEX IF NOT EXISTS idx_seats_label ON seats(seat_label);
CREATE INDEX IF NOT EXISTS idx_seats_reserved_by ON seats(reserved_by);

-- Create seat_reservations table for temporary holds (5-15 min timeout)
CREATE TABLE IF NOT EXISTS seat_reservations (
  id TEXT PRIMARY KEY,
  seat_id TEXT NOT NULL,
  user_id BIGINT NOT NULL,
  event_id BIGINT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seat_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_user ON seat_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_expires ON seat_reservations(expires_at);
