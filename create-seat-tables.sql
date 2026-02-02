-- Create seat_inventory table
CREATE TABLE IF NOT EXISTS seat_inventory (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    section VARCHAR(100),
    row_number VARCHAR(10),
    seat_number VARCHAR(10),
    seat_type VARCHAR(50) DEFAULT 'STANDARD',
    base_price DECIMAL(10, 2) DEFAULT 0,
    x_coordinate INTEGER,
    y_coordinate INTEGER,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_seat_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_seat_inventory_event ON seat_inventory(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_inventory_section ON seat_inventory(event_id, section);

-- Create seat_reservations table
CREATE TABLE IF NOT EXISTS seat_reservations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    user_id BIGINT,
    user_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'RESERVED',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_reservation_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_reservation_seat FOREIGN KEY (seat_id) REFERENCES seat_inventory(id) ON DELETE CASCADE,
    CONSTRAINT chk_reservation_status CHECK (status IN ('RESERVED', 'LOCKED', 'CONFIRMED', 'EXPIRED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_seat_reservations_event ON seat_reservations(event_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_seat ON seat_reservations(seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_reservations_status ON seat_reservations(status);

-- Create floor_plan_configs table
CREATE TABLE IF NOT EXISTS floor_plan_configs (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    plan_name VARCHAR(255),
    layout_data TEXT,
    total_seats INTEGER DEFAULT 0,
    sections TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_floor_plan_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_floor_plan_event ON floor_plan_configs(event_id);

-- Add updated_at column to registrations if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='registrations' AND column_name='updated_at') THEN
        ALTER TABLE registrations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Add email column to registrations if it doesn't exist (for quick lookups)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='registrations' AND column_name='email') THEN
        ALTER TABLE registrations ADD COLUMN email VARCHAR(255);
        CREATE INDEX idx_registrations_email ON registrations(email);
    END IF;
END $$;

-- Create trigger to extract email from data_json
CREATE OR REPLACE FUNCTION extract_registration_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.data_json IS NOT NULL THEN
        NEW.email := (NEW.data_json::json->>'email');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_extract_registration_email ON registrations;
CREATE TRIGGER trg_extract_registration_email
    BEFORE INSERT OR UPDATE ON registrations
    FOR EACH ROW
    EXECUTE FUNCTION extract_registration_email();
