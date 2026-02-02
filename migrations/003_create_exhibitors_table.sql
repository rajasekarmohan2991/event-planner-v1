-- Create exhibitors table
CREATE TABLE IF NOT EXISTS exhibitors (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(255),
  website VARCHAR(255),
  notes TEXT,
  prefix VARCHAR(50),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  preferred_pronouns VARCHAR(100),
  work_phone VARCHAR(100),
  cell_phone VARCHAR(100),
  job_title VARCHAR(255),
  company VARCHAR(255),
  business_address TEXT,
  company_description TEXT,
  products_services TEXT,
  booth_type VARCHAR(50),
  staff_list TEXT,
  competitors TEXT,
  booth_option VARCHAR(255),
  booth_number VARCHAR(50),
  booth_area VARCHAR(50),
  electrical_access BOOLEAN DEFAULT false,
  display_tables BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

-- Create booths table
CREATE TABLE IF NOT EXISTS booths (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_id VARCHAR(255) NOT NULL,
  exhibitor_id VARCHAR(255),
  booth_number VARCHAR(255) NOT NULL,
  size_sqm INTEGER DEFAULT 9,
  type VARCHAR(50) DEFAULT 'STANDARD',
  status VARCHAR(50) DEFAULT 'AVAILABLE',
  price_inr INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

-- Create booth_assets table
CREATE TABLE IF NOT EXISTS booth_assets (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  booth_id VARCHAR(255) NOT NULL,
  kind VARCHAR(50) DEFAULT 'URL',
  url TEXT NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  tenant_id VARCHAR(255)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exhibitors_event_name ON exhibitors(event_id, name);
CREATE INDEX IF NOT EXISTS idx_exhibitors_tenant ON exhibitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booths_event_number ON booths(event_id, booth_number);
CREATE INDEX IF NOT EXISTS idx_booth_assets_booth ON booth_assets(booth_id);
