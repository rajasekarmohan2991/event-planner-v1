-- Activity Log Table for tracking user actions
CREATE TABLE IF NOT EXISTS activity_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  action_type VARCHAR(50) NOT NULL, -- 'EVENT_CREATED', 'USER_REGISTERED', 'USER_CREATED', etc.
  action_description TEXT NOT NULL,
  entity_type VARCHAR(50), -- 'EVENT', 'USER', 'REGISTRATION', etc.
  entity_id BIGINT,
  entity_name VARCHAR(255),
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_action_type ON activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- Module Access Matrix Table
CREATE TABLE IF NOT EXISTS module_access_matrix (
  id BIGSERIAL PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  can_view BOOLEAN DEFAULT FALSE,
  can_create BOOLEAN DEFAULT FALSE,
  can_edit BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(module_name, role)
);

-- Lookup Options Table for configurable dropdowns
CREATE TABLE IF NOT EXISTS lookup_options (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(100) NOT NULL, -- 'EVENT_TYPE', 'EVENT_STATUS', 'TICKET_TYPE', etc.
  option_key VARCHAR(100) NOT NULL,
  option_value VARCHAR(255) NOT NULL,
  option_label VARCHAR(255) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category, option_key)
);

-- Insert default module access matrix
INSERT INTO module_access_matrix (module_name, role, can_view, can_create, can_edit, can_delete) VALUES
  -- SUPER_ADMIN
  ('Events', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Users', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Speakers', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Sponsors', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Registrations', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Team Management', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Admin Dashboard', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('System Settings', 'SUPER_ADMIN', TRUE, TRUE, TRUE, TRUE),
  
  -- ADMIN
  ('Events', 'ADMIN', TRUE, TRUE, TRUE, FALSE),
  ('Users', 'ADMIN', TRUE, FALSE, FALSE, FALSE),
  ('Speakers', 'ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Sponsors', 'ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Registrations', 'ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Team Management', 'ADMIN', TRUE, TRUE, TRUE, TRUE),
  ('Admin Dashboard', 'ADMIN', TRUE, FALSE, FALSE, FALSE),
  ('System Settings', 'ADMIN', FALSE, FALSE, FALSE, FALSE),
  
  -- EVENT_MANAGER
  ('Events', 'EVENT_MANAGER', TRUE, TRUE, TRUE, FALSE),
  ('Users', 'EVENT_MANAGER', FALSE, FALSE, FALSE, FALSE),
  ('Speakers', 'EVENT_MANAGER', TRUE, TRUE, TRUE, TRUE),
  ('Sponsors', 'EVENT_MANAGER', TRUE, TRUE, TRUE, TRUE),
  ('Registrations', 'EVENT_MANAGER', TRUE, TRUE, TRUE, FALSE),
  ('Team Management', 'EVENT_MANAGER', TRUE, TRUE, TRUE, FALSE),
  ('Admin Dashboard', 'EVENT_MANAGER', FALSE, FALSE, FALSE, FALSE),
  ('System Settings', 'EVENT_MANAGER', FALSE, FALSE, FALSE, FALSE),
  
  -- USER
  ('Events', 'USER', TRUE, FALSE, FALSE, FALSE),
  ('Users', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('Speakers', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('Sponsors', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('Registrations', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('Team Management', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('Admin Dashboard', 'USER', FALSE, FALSE, FALSE, FALSE),
  ('System Settings', 'USER', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (module_name, role) DO NOTHING;

-- Insert default lookup options
INSERT INTO lookup_options (category, option_key, option_value, option_label, display_order) VALUES
  -- Event Types
  ('EVENT_TYPE', 'CONFERENCE', 'CONFERENCE', 'Conference', 1),
  ('EVENT_TYPE', 'WORKSHOP', 'WORKSHOP', 'Workshop', 2),
  ('EVENT_TYPE', 'SEMINAR', 'SEMINAR', 'Seminar', 3),
  ('EVENT_TYPE', 'WEBINAR', 'WEBINAR', 'Webinar', 4),
  ('EVENT_TYPE', 'MEETUP', 'MEETUP', 'Meetup', 5),
  ('EVENT_TYPE', 'EXHIBITION', 'EXHIBITION', 'Exhibition', 6),
  ('EVENT_TYPE', 'NETWORKING', 'NETWORKING', 'Networking Event', 7),
  ('EVENT_TYPE', 'OTHER', 'OTHER', 'Other', 8),
  
  -- Event Status
  ('EVENT_STATUS', 'DRAFT', 'DRAFT', 'Draft', 1),
  ('EVENT_STATUS', 'LIVE', 'LIVE', 'Live', 2),
  ('EVENT_STATUS', 'COMPLETED', 'COMPLETED', 'Completed', 3),
  ('EVENT_STATUS', 'CANCELLED', 'CANCELLED', 'Cancelled', 4),
  ('EVENT_STATUS', 'TRASHED', 'TRASHED', 'Trashed', 5),
  
  -- Ticket Types
  ('TICKET_TYPE', 'VIP', 'VIP', 'VIP', 1),
  ('TICKET_TYPE', 'PREMIUM', 'PREMIUM', 'Premium', 2),
  ('TICKET_TYPE', 'GENERAL', 'GENERAL', 'General', 3),
  ('TICKET_TYPE', 'EARLY_BIRD', 'EARLY_BIRD', 'Early Bird', 4),
  ('TICKET_TYPE', 'STUDENT', 'STUDENT', 'Student', 5),
  ('TICKET_TYPE', 'GROUP', 'GROUP', 'Group', 6),
  
  -- Payment Status
  ('PAYMENT_STATUS', 'PENDING', 'PENDING', 'Pending', 1),
  ('PAYMENT_STATUS', 'COMPLETED', 'COMPLETED', 'Completed', 2),
  ('PAYMENT_STATUS', 'FAILED', 'FAILED', 'Failed', 3),
  ('PAYMENT_STATUS', 'REFUNDED', 'REFUNDED', 'Refunded', 4),
  ('PAYMENT_STATUS', 'FREE', 'FREE', 'Free', 5),
  
  -- Registration Status
  ('REGISTRATION_STATUS', 'PENDING', 'PENDING', 'Pending', 1),
  ('REGISTRATION_STATUS', 'CONFIRMED', 'CONFIRMED', 'Confirmed', 2),
  ('REGISTRATION_STATUS', 'CANCELLED', 'CANCELLED', 'Cancelled', 3),
  ('REGISTRATION_STATUS', 'WAITLIST', 'WAITLIST', 'Waitlist', 4),
  
  -- User Roles
  ('USER_ROLE', 'SUPER_ADMIN', 'SUPER_ADMIN', 'Super Admin', 1),
  ('USER_ROLE', 'ADMIN', 'ADMIN', 'Admin', 2),
  ('USER_ROLE', 'EVENT_MANAGER', 'EVENT_MANAGER', 'Event Manager', 3),
  ('USER_ROLE', 'USER', 'USER', 'User', 4)
ON CONFLICT (category, option_key) DO NOTHING;
