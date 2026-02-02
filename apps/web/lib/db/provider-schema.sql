-- =====================================================
-- VENDOR/SPONSOR/EXHIBITOR MANAGEMENT PORTAL
-- Database Schema - Phase 1
-- =====================================================

-- 1. SERVICE PROVIDERS TABLE
-- Main table for all service providers (vendors, sponsors, exhibitors)
CREATE TABLE IF NOT EXISTS service_providers (
    id BIGSERIAL PRIMARY KEY,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
    
    -- Company Information
    company_name VARCHAR(255) NOT NULL,
    business_registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    
    -- Contact Information
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    
    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    
    -- Business Details
    description TEXT,
    year_established INTEGER,
    team_size VARCHAR(50),
    
    -- Verification & Status
    verification_status VARCHAR(50) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
    verification_documents JSONB DEFAULT '[]'::jsonb,
    verification_notes TEXT,
    verified_at TIMESTAMP,
    verified_by BIGINT,
    is_active BOOLEAN DEFAULT true,
    
    -- Platform Metrics
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    total_bookings INTEGER DEFAULT 0,
    completed_bookings INTEGER DEFAULT 0,
    cancelled_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(15,2) DEFAULT 0.00,
    
    -- Media
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    gallery JSONB DEFAULT '[]'::jsonb,
    
    -- Settings
    commission_rate DECIMAL(5,2) DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    payment_terms VARCHAR(50) DEFAULT 'NET_30' CHECK (payment_terms IN ('NET_15', 'NET_30', 'NET_60', 'IMMEDIATE')),
    subscription_tier VARCHAR(50) DEFAULT 'FREE' CHECK (subscription_tier IN ('FREE', 'PRO', 'ENTERPRISE')),
    subscription_expires_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX IF NOT EXISTS idx_providers_type ON service_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_providers_status ON service_providers(verification_status);
CREATE INDEX IF NOT EXISTS idx_providers_active ON service_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_providers_city ON service_providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON service_providers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_providers_email ON service_providers(email);

-- 2. PROVIDER CATEGORIES
-- Categories and specializations for providers
CREATE TABLE IF NOT EXISTS provider_categories (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(provider_id, category, subcategory)
);

CREATE INDEX IF NOT EXISTS idx_provider_categories_provider ON provider_categories(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_categories_category ON provider_categories(category);

-- 3. PROVIDER SERVICES
-- Service offerings with pricing
CREATE TABLE IF NOT EXISTS provider_services (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(15,2),
    pricing_model VARCHAR(50) DEFAULT 'FIXED' CHECK (pricing_model IN ('FIXED', 'PER_PERSON', 'PER_HOUR', 'PER_DAY', 'CUSTOM')),
    currency VARCHAR(10) DEFAULT 'INR',
    min_order_value DECIMAL(15,2),
    max_capacity INTEGER,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_active ON provider_services(is_active);

-- 4. PROVIDER PORTFOLIO
-- Past work and case studies
CREATE TABLE IF NOT EXISTS provider_portfolio (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_name VARCHAR(255),
    event_date DATE,
    event_type VARCHAR(100),
    client_name VARCHAR(255),
    client_testimonial TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_portfolio_provider ON provider_portfolio(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_portfolio_featured ON provider_portfolio(is_featured);

-- 5. PROVIDER CERTIFICATIONS
-- Certifications and documents
CREATE TABLE IF NOT EXISTS provider_certifications (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    certification_name VARCHAR(255) NOT NULL,
    issuing_authority VARCHAR(255),
    certification_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    document_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_certifications_provider ON provider_certifications(provider_id);

-- 6. PROVIDER AVAILABILITY
-- Calendar availability
CREATE TABLE IF NOT EXISTS provider_availability (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    is_available BOOLEAN DEFAULT true,
    slots_available INTEGER,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(provider_id, date)
);

CREATE INDEX IF NOT EXISTS idx_provider_availability_provider ON provider_availability(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_availability_date ON provider_availability(date);

-- 7. PROVIDER USERS
-- Team members who can access provider portal
CREATE TABLE IF NOT EXISTS provider_users (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'SALES', 'OPERATIONS', 'VIEWER')),
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    invited_by BIGINT REFERENCES "User"(id),
    invited_at TIMESTAMP DEFAULT NOW(),
    joined_at TIMESTAMP,
    
    UNIQUE(provider_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_users_provider ON provider_users(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_users_user ON provider_users(user_id);

-- 8. VENDOR BOOKINGS
-- Vendor service bookings
CREATE TABLE IF NOT EXISTS vendor_bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id),
    service_id BIGINT REFERENCES provider_services(id),
    
    -- Booking Details
    booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_date_from DATE NOT NULL,
    service_date_to DATE NOT NULL,
    attendee_count INTEGER,
    
    -- Pricing
    quoted_amount DECIMAL(15,2) NOT NULL,
    negotiated_amount DECIMAL(15,2),
    final_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Commission
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    provider_payout DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
    
    -- Terms
    terms_and_conditions TEXT,
    special_requirements TEXT,
    cancellation_policy TEXT,
    
    -- Contract
    contract_url VARCHAR(500),
    signed_at TIMESTAMP,
    signed_by_provider BIGINT REFERENCES "User"(id),
    signed_by_client BIGINT REFERENCES "User"(id),
    
    -- Tracking
    created_by BIGINT REFERENCES "User"(id),
    approved_by BIGINT REFERENCES "User"(id),
    approved_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_bookings_event ON vendor_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_provider ON vendor_bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_tenant ON vendor_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_status ON vendor_bookings(status);
CREATE INDEX IF NOT EXISTS idx_vendor_bookings_number ON vendor_bookings(booking_number);

-- 9. SPONSOR DEALS
-- Sponsorship agreements
CREATE TABLE IF NOT EXISTS sponsor_deals (
    id BIGSERIAL PRIMARY KEY,
    deal_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    sponsor_id BIGINT NOT NULL REFERENCES service_providers(id),
    
    -- Sponsorship Details
    sponsorship_tier VARCHAR(50) CHECK (sponsorship_tier IN ('TITLE', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'CUSTOM')),
    sponsorship_package VARCHAR(255),
    
    -- Benefits & Deliverables
    benefits JSONB DEFAULT '[]'::jsonb,
    deliverables JSONB DEFAULT '[]'::jsonb,
    
    -- Pricing
    sponsorship_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Commission
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    sponsor_payout DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'NEGOTIATING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REJECTED')),
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
    
    -- Contract
    contract_url VARCHAR(500),
    signed_at TIMESTAMP,
    
    -- Tracking
    visibility_metrics JSONB DEFAULT '{}'::jsonb,
    created_by BIGINT REFERENCES "User"(id),
    approved_by BIGINT REFERENCES "User"(id),
    approved_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sponsor_deals_event ON sponsor_deals(event_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_deals_sponsor ON sponsor_deals(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_deals_tenant ON sponsor_deals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_deals_status ON sponsor_deals(status);

-- 10. EXHIBITOR BOOKINGS
-- Exhibitor booth bookings
CREATE TABLE IF NOT EXISTS exhibitor_bookings (
    id BIGSERIAL PRIMARY KEY,
    booking_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    tenant_id VARCHAR(255) NOT NULL,
    exhibitor_id BIGINT NOT NULL REFERENCES service_providers(id),
    
    -- Booth Details
    booth_number VARCHAR(50),
    booth_size VARCHAR(50),
    booth_type VARCHAR(50) CHECK (booth_type IN ('STANDARD', 'PREMIUM', 'CORNER', 'ISLAND', 'CUSTOM')),
    booth_location VARCHAR(255),
    floor_plan_position JSONB,
    
    -- Pricing
    booth_rental_fee DECIMAL(15,2) NOT NULL,
    additional_services JSONB DEFAULT '[]'::jsonb,
    total_amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Commission
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    exhibitor_payout DECIMAL(15,2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    payment_status VARCHAR(50) DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIAL', 'PAID', 'REFUNDED')),
    
    -- Setup Details
    setup_date TIMESTAMP,
    teardown_date TIMESTAMP,
    special_requirements TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_event ON exhibitor_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_exhibitor ON exhibitor_bookings(exhibitor_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_tenant ON exhibitor_bookings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exhibitor_bookings_status ON exhibitor_bookings(status);

-- 11. PROVIDER REVIEWS
-- Reviews and ratings
CREATE TABLE IF NOT EXISTS provider_reviews (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    booking_id BIGINT,
    booking_type VARCHAR(50) CHECK (booking_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
    tenant_id VARCHAR(255) NOT NULL,
    reviewer_id BIGINT REFERENCES "User"(id),
    
    -- Ratings (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
    
    -- Review Content
    review_title VARCHAR(255),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    
    -- Media
    images JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    
    -- Response
    provider_response TEXT,
    provider_response_date TIMESTAMP,
    provider_response_by BIGINT REFERENCES "User"(id),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_reviews_provider ON provider_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_rating ON provider_reviews(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_provider_reviews_public ON provider_reviews(is_public);

-- 12. COMMISSION TRANSACTIONS
-- Commission tracking and payments
CREATE TABLE IF NOT EXISTS commission_transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Relationships
    provider_id BIGINT NOT NULL REFERENCES service_providers(id),
    booking_id BIGINT,
    booking_type VARCHAR(50) CHECK (booking_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
    event_id BIGINT REFERENCES events(id),
    tenant_id VARCHAR(255) NOT NULL,
    
    -- Amounts
    booking_amount DECIMAL(15,2) NOT NULL,
    commission_rate DECIMAL(5,2) NOT NULL,
    commission_amount DECIMAL(15,2) NOT NULL,
    provider_payout DECIMAL(15,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    
    -- Status
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED')),
    
    -- Payment Details
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    payment_gateway_fee DECIMAL(15,2) DEFAULT 0.00,
    paid_at TIMESTAMP,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_provider ON commission_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_number ON commission_transactions(transaction_number);

-- 13. PROVIDER PAYMENT ACCOUNTS
-- Payment account details
CREATE TABLE IF NOT EXISTS provider_payment_accounts (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    
    -- Bank Details
    account_holder_name VARCHAR(255),
    bank_name VARCHAR(255),
    account_number VARCHAR(100),
    ifsc_code VARCHAR(20),
    swift_code VARCHAR(20),
    branch_name VARCHAR(255),
    
    -- Alternative Payment Methods
    upi_id VARCHAR(100),
    paypal_email VARCHAR(255),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP,
    verification_document_url VARCHAR(500),
    
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_payment_accounts_provider ON provider_payment_accounts(provider_id);

-- 14. SAVED PROVIDERS
-- Event companies' saved/favorite providers
CREATE TABLE IF NOT EXISTS saved_providers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id VARCHAR(255) NOT NULL,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    saved_by BIGINT REFERENCES "User"(id),
    notes TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_providers_tenant ON saved_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_saved_providers_provider ON saved_providers(provider_id);

-- 15. PROVIDER RECOMMENDATIONS
-- AI-powered recommendations
CREATE TABLE IF NOT EXISTS provider_recommendations (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    recommendation_score DECIMAL(5,2) CHECK (recommendation_score >= 0 AND recommendation_score <= 100),
    recommendation_reason JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'VIEWED', 'CONTACTED', 'BOOKED', 'REJECTED')),
    viewed_at TIMESTAMP,
    contacted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(event_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_provider_recommendations_event ON provider_recommendations(event_id);
CREATE INDEX IF NOT EXISTS idx_provider_recommendations_provider ON provider_recommendations(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_recommendations_score ON provider_recommendations(recommendation_score DESC);

-- 16. PROVIDER EVENT PREFERENCES
-- Provider preferences for event types
CREATE TABLE IF NOT EXISTS provider_event_preferences (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
    event_type VARCHAR(100),
    min_budget DECIMAL(15,2),
    max_budget DECIMAL(15,2),
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    blacklisted_companies JSONB DEFAULT '[]'::jsonb,
    auto_accept_inquiries BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_event_preferences_provider ON provider_event_preferences(provider_id);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_service_providers_updated_at BEFORE UPDATE ON service_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_services_updated_at BEFORE UPDATE ON provider_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_bookings_updated_at BEFORE UPDATE ON vendor_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sponsor_deals_updated_at BEFORE UPDATE ON sponsor_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exhibitor_bookings_updated_at BEFORE UPDATE ON exhibitor_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_reviews_updated_at BEFORE UPDATE ON provider_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_transactions_updated_at BEFORE UPDATE ON commission_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_payment_accounts_updated_at BEFORE UPDATE ON provider_payment_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_event_preferences_updated_at BEFORE UPDATE ON provider_event_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE service_providers IS 'Main table for vendors, sponsors, and exhibitors';
COMMENT ON TABLE vendor_bookings IS 'Vendor service bookings for events';
COMMENT ON TABLE sponsor_deals IS 'Sponsorship agreements and deals';
COMMENT ON TABLE exhibitor_bookings IS 'Exhibitor booth bookings';
COMMENT ON TABLE commission_transactions IS 'Platform commission tracking and payments';
COMMENT ON TABLE provider_reviews IS 'Reviews and ratings for service providers';
