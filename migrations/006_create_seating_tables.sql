-- Create seat_inventory table
CREATE TABLE IF NOT EXISTS seat_inventory (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id BIGINT NOT NULL,
  section VARCHAR(255),
  row_number VARCHAR(50),
  seat_number VARCHAR(50),
  seat_type VARCHAR(50) DEFAULT 'STANDARD',
  ticket_class VARCHAR(50) DEFAULT 'GENERAL',
  base_price DECIMAL(10, 2) DEFAULT 0,
  x_coordinate DECIMAL(10, 2),
  y_coordinate DECIMAL(10, 2),
  is_available BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_seat_inventory_event ON seat_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_tenant ON seat_inventory(tenant_id);

-- Create seat_reservations table
CREATE TABLE IF NOT EXISTS seat_reservations (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  seat_id VARCHAR(255) NOT NULL,
  event_id BIGINT NOT NULL,
  user_id BIGINT,
  user_email VARCHAR(255),
  status VARCHAR(50) DEFAULT 'RESERVED',
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_seat_reservations_event ON seat_reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_tenant ON seat_reservations(tenant_id);

-- Create floor_plan_configs table
CREATE TABLE IF NOT EXISTS floor_plan_configs (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id BIGINT NOT NULL,
  plan_name VARCHAR(255),
  layout_data JSONB,
  sections JSONB,
  total_seats INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_floor_plan_configs_event ON floor_plan_configs(event_id);
CREATE INDEX IF NOT EXISTS idx_floor_plan_configs_tenant ON floor_plan_configs(tenant_id);
