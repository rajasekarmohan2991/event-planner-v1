-- ============================================================================
-- TICKET CLASS IMPLEMENTATION - Complete Database Schema
-- ============================================================================
-- Date: November 15, 2025 10:00 PM IST
-- Purpose: Implement proper ticket class functionality with seat linking
-- ============================================================================

-- Step 1: Add ticket_class column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_class VARCHAR(20) DEFAULT 'GENERAL';

-- Step 2: Add ticket_class column to seat_inventory table  
ALTER TABLE seat_inventory
ADD COLUMN IF NOT EXISTS ticket_class VARCHAR(20) DEFAULT 'GENERAL';

-- Step 3: Add min_purchase and max_purchase columns to tickets table
ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS min_purchase INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_purchase INTEGER DEFAULT 10;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tickets_class ON tickets(event_id, ticket_class);
CREATE INDEX IF NOT EXISTS idx_seats_class ON seat_inventory(event_id, ticket_class);

-- Step 5: Update existing tickets with proper ticket classes (if any exist)
-- This is a safe operation - only updates if tickets exist
UPDATE tickets SET ticket_class = 'VIP' WHERE name ILIKE '%vip%';
UPDATE tickets SET ticket_class = 'PREMIUM' WHERE name ILIKE '%premium%';
UPDATE tickets SET ticket_class = 'GENERAL' WHERE ticket_class IS NULL OR ticket_class = '';

-- Step 6: Update existing seats with proper ticket classes based on seat_type
UPDATE seat_inventory SET ticket_class = 'VIP' WHERE seat_type = 'VIP';
UPDATE seat_inventory SET ticket_class = 'PREMIUM' WHERE seat_type = 'PREMIUM';
UPDATE seat_inventory SET ticket_class = 'GENERAL' WHERE seat_type = 'STANDARD' OR seat_type IS NULL;

-- Step 7: Add floor_plan_image column to store separate floor plans per class
ALTER TABLE seat_inventory
ADD COLUMN IF NOT EXISTS floor_plan_image TEXT;

-- Step 8: Create a table to store floor plan configurations per event and ticket class
CREATE TABLE IF NOT EXISTS floor_plans (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_class VARCHAR(20) NOT NULL DEFAULT 'GENERAL',
    floor_plan_image TEXT,
    layout_config JSONB, -- Store rows, columns, seat numbering config
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, ticket_class)
);

CREATE INDEX IF NOT EXISTS idx_floor_plans_event ON floor_plans(event_id);
CREATE INDEX IF NOT EXISTS idx_floor_plans_class ON floor_plans(event_id, ticket_class);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tickets table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name IN ('ticket_class', 'min_purchase', 'max_purchase')
ORDER BY ordinal_position;

-- Verify seat_inventory table structure
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'seat_inventory' 
AND column_name IN ('ticket_class', 'floor_plan_image')
ORDER BY ordinal_position;

-- Verify floor_plans table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'floor_plans';

-- ============================================================================
-- SAMPLE DATA FOR TESTING (Event ID 8)
-- ============================================================================

-- Create 3 ticket classes for event 8
INSERT INTO tickets (event_id, name, ticket_class, is_free, price_in_minor, currency, quantity, min_purchase, max_purchase, status)
VALUES 
    (8, 'VIP Ticket', 'VIP', false, 50000, 'INR', 50, 1, 5, 'Open'),
    (8, 'Premium Ticket', 'PREMIUM', false, 30000, 'INR', 100, 1, 10, 'Open'),
    (8, 'General Admission', 'GENERAL', false, 15000, 'INR', 200, 1, 20, 'Open')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

/*
TICKET CLASS FUNCTIONALITY:

1. **Ticket Creation**:
   - Each ticket has a ticket_class (VIP, PREMIUM, GENERAL)
   - Each ticket has min_purchase and max_purchase limits
   - Each ticket has price_in_minor (price in smallest currency unit - paise)
   - Each ticket has quantity (total available seats for this class)

2. **Seat Assignment**:
   - Seats in seat_inventory are linked to ticket_class
   - Floor planner creates separate floor plans for each ticket class
   - Seat selector filters seats by selected ticket class

3. **Floor Planner**:
   - floor_plans table stores separate configurations for VIP, PREMIUM, GENERAL
   - Each floor plan has its own image and layout configuration
   - Seats created from floor planner are automatically assigned ticket_class

4. **Registration Flow**:
   - User selects ticket class (VIP/Premium/General)
   - System shows only seats for that ticket class
   - System enforces min/max purchase limits
   - System calculates price based on ticket class price

5. **Pricing**:
   - price_in_minor is stored in paise (₹500 = 50000 paise)
   - Frontend displays: price_in_minor / 100 = ₹500
   - Backend stores: ₹500 * 100 = 50000 paise

6. **Purchase Limits**:
   - min_purchase: Minimum tickets user must buy (default: 1)
   - max_purchase: Maximum tickets user can buy (default: 10)
   - Enforced during registration

EXAMPLE QUERIES:

-- Get all ticket classes for an event
SELECT id, name, ticket_class, price_in_minor/100 as price_rupees, quantity, min_purchase, max_purchase
FROM tickets 
WHERE event_id = 8 
ORDER BY price_in_minor DESC;

-- Get seats for a specific ticket class
SELECT id, section, row_number, seat_number, ticket_class, base_price, is_available
FROM seat_inventory
WHERE event_id = 8 AND ticket_class = 'VIP' AND is_available = true
ORDER BY section, row_number, seat_number;

-- Get floor plan for a ticket class
SELECT * FROM floor_plans WHERE event_id = 8 AND ticket_class = 'VIP';

*/
