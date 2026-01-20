-- Migration: Create lookup management tables
-- Description: Dynamic lookup/dropdown management system for customizable options

-- 1. Lookup Categories Table
CREATE TABLE IF NOT EXISTS lookup_categories (
    id TEXT PRIMARY KEY DEFAULT ('lc_' || gen_random_uuid()::text),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_global BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Lookup Values Table
CREATE TABLE IF NOT EXISTS lookup_values (
    id TEXT PRIMARY KEY DEFAULT ('lv_' || gen_random_uuid()::text),
    category_id TEXT NOT NULL REFERENCES lookup_categories(id) ON DELETE CASCADE,
    tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    color_code TEXT,
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_category_value UNIQUE(category_id, value, tenant_id)
);

-- 3. Lookup Audit Log Table
CREATE TABLE IF NOT EXISTS lookup_audit_log (
    id TEXT PRIMARY KEY DEFAULT ('la_' || gen_random_uuid()::text),
    category_id TEXT REFERENCES lookup_categories(id) ON DELETE CASCADE,
    value_id TEXT REFERENCES lookup_values(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    changed_by TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lookup_values_category ON lookup_values(category_id);
CREATE INDEX IF NOT EXISTS idx_lookup_values_tenant ON lookup_values(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lookup_values_active ON lookup_values(is_active);
CREATE INDEX IF NOT EXISTS idx_lookup_audit_category ON lookup_audit_log(category_id);
CREATE INDEX IF NOT EXISTS idx_lookup_audit_value ON lookup_audit_log(value_id);

-- Insert default lookup categories
INSERT INTO lookup_categories (id, name, code, description, is_global, is_system) VALUES
('cmkl3z1of005qd8yckzh5kpkh', 'Template For', 'template_for', 'Entity types for document templates', TRUE, TRUE),
('lc_dietary', 'Dietary Restrictions', 'dietary_restrictions', 'Dietary preferences and restrictions', TRUE, TRUE),
('lc_tshirt', 'T-Shirt Sizes', 'tshirt_sizes', 'Standard t-shirt sizes', TRUE, TRUE),
('lc_gender', 'Gender', 'gender', 'Gender options', TRUE, TRUE),
('lc_payment', 'Payment Methods', 'payment_methods', 'Available payment methods', TRUE, TRUE),
('lc_event_type', 'Event Types', 'event_types', 'Types of events', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert default lookup values for Template For
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('cmkl3z1of005qd8yckzh5kpkh', 'VENDOR', 'VENDOR', 'Vendor agreements and contracts', TRUE, TRUE, FALSE, 1),
('cmkl3z1of005qd8yckzh5kpkh', 'SPONSOR', 'SPONSOR', 'Sponsorship agreements', TRUE, TRUE, FALSE, 2),
('cmkl3z1of005qd8yckzh5kpkh', 'EXHIBITOR', 'EXHIBITOR', 'Exhibitor agreements', TRUE, TRUE, FALSE, 3),
('cmkl3z1of005qd8yckzh5kpkh', 'SPEAKER', 'SPEAKER', 'Speaker contracts', TRUE, TRUE, FALSE, 4),
('cmkl3z1of005qd8yckzh5kpkh', 'ATTENDEE', 'ATTENDEE', 'Attendee terms and conditions', TRUE, TRUE, FALSE, 5),
('cmkl3z1of005qd8yckzh5kpkh', 'STAFF', 'STAFF', 'Staff agreements', TRUE, TRUE, FALSE, 6)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

-- Insert default lookup values for Dietary Restrictions
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('lc_dietary', 'NONE', 'None', 'No dietary restrictions', TRUE, TRUE, TRUE, 1),
('lc_dietary', 'VEGETARIAN', 'Vegetarian', 'Vegetarian diet', TRUE, TRUE, FALSE, 2),
('lc_dietary', 'VEGAN', 'Vegan', 'Vegan diet', TRUE, TRUE, FALSE, 3),
('lc_dietary', 'GLUTEN_FREE', 'Gluten Free', 'Gluten allergy/intolerance', TRUE, TRUE, FALSE, 4),
('lc_dietary', 'LACTOSE_FREE', 'Lactose Free', 'Lactose intolerance', TRUE, TRUE, FALSE, 5),
('lc_dietary', 'NUT_ALLERGY', 'Nut Allergy', 'Nut allergy', TRUE, TRUE, FALSE, 6),
('lc_dietary', 'SHELLFISH_ALLERGY', 'Shellfish Allergy', 'Shellfish allergy', TRUE, TRUE, FALSE, 7),
('lc_dietary', 'HALAL', 'Halal', 'Halal food only', TRUE, TRUE, FALSE, 8),
('lc_dietary', 'KOSHER', 'Kosher', 'Kosher food only', TRUE, TRUE, FALSE, 9)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

-- Insert default lookup values for T-Shirt Sizes
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('lc_tshirt', 'XS', 'XS', 'Extra Small', TRUE, TRUE, FALSE, 1),
('lc_tshirt', 'S', 'S', 'Small', TRUE, TRUE, FALSE, 2),
('lc_tshirt', 'M', 'M', 'Medium', TRUE, TRUE, TRUE, 3),
('lc_tshirt', 'L', 'L', 'Large', TRUE, TRUE, FALSE, 4),
('lc_tshirt', 'XL', 'XL', 'Extra Large', TRUE, TRUE, FALSE, 5),
('lc_tshirt', 'XXL', 'XXL', '2X Large', TRUE, TRUE, FALSE, 6),
('lc_tshirt', 'XXXL', 'XXXL', '3X Large', TRUE, TRUE, FALSE, 7)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

-- Insert default lookup values for Gender
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('lc_gender', 'MALE', 'Male', 'Male', TRUE, TRUE, FALSE, 1),
('lc_gender', 'FEMALE', 'Female', 'Female', TRUE, TRUE, FALSE, 2),
('lc_gender', 'OTHER', 'Other', 'Other/Prefer not to say', TRUE, TRUE, FALSE, 3)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

-- Insert default lookup values for Payment Methods
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('lc_payment', 'CASH', 'Cash', 'Cash payment', TRUE, TRUE, FALSE, 1),
('lc_payment', 'CARD', 'Credit/Debit Card', 'Card payment', TRUE, TRUE, TRUE, 2),
('lc_payment', 'UPI', 'UPI', 'UPI payment', TRUE, TRUE, FALSE, 3),
('lc_payment', 'BANK_TRANSFER', 'Bank Transfer', 'Direct bank transfer', TRUE, TRUE, FALSE, 4),
('lc_payment', 'CHEQUE', 'Cheque', 'Cheque payment', TRUE, TRUE, FALSE, 5)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

-- Insert default lookup values for Event Types
INSERT INTO lookup_values (category_id, value, label, description, is_system, is_active, is_default, sort_order) VALUES
('lc_event_type', 'CONFERENCE', 'Conference', 'Professional conference', TRUE, TRUE, FALSE, 1),
('lc_event_type', 'SEMINAR', 'Seminar', 'Educational seminar', TRUE, TRUE, FALSE, 2),
('lc_event_type', 'WORKSHOP', 'Workshop', 'Hands-on workshop', TRUE, TRUE, FALSE, 3),
('lc_event_type', 'WEBINAR', 'Webinar', 'Online webinar', TRUE, TRUE, FALSE, 4),
('lc_event_type', 'MEETUP', 'Meetup', 'Casual meetup', TRUE, TRUE, FALSE, 5),
('lc_event_type', 'EXHIBITION', 'Exhibition', 'Trade exhibition', TRUE, TRUE, FALSE, 6),
('lc_event_type', 'CONCERT', 'Concert', 'Music concert', TRUE, TRUE, FALSE, 7),
('lc_event_type', 'FESTIVAL', 'Festival', 'Festival event', TRUE, TRUE, FALSE, 8)
ON CONFLICT (category_id, value, tenant_id) DO NOTHING;

COMMENT ON TABLE lookup_categories IS 'Lookup categories for dynamic dropdown management';
COMMENT ON TABLE lookup_values IS 'Lookup values for each category';
COMMENT ON TABLE lookup_audit_log IS 'Audit trail for lookup changes';
