-- =====================================================
-- FINANCE MODULE - MISSING TABLES
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. TDS/WITHHOLDING TAX TABLE
-- Tracks tax deducted at source when paying vendors/speakers
CREATE TABLE IF NOT EXISTS tds_deductions (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event_id BIGINT,
    
    -- Payout Reference
    payout_id TEXT,
    
    -- Recipient Details
    recipient_type TEXT NOT NULL, -- VENDOR, SPEAKER, STAFF
    recipient_id TEXT,
    recipient_name TEXT NOT NULL,
    recipient_pan TEXT, -- PAN number for India
    
    -- TDS Details
    section TEXT, -- 194J, 194C, etc. (India specific)
    tds_rate DOUBLE PRECISION NOT NULL DEFAULT 10,
    gross_amount DOUBLE PRECISION NOT NULL,
    tds_amount DOUBLE PRECISION NOT NULL,
    net_amount DOUBLE PRECISION NOT NULL, -- gross_amount - tds_amount
    
    currency TEXT DEFAULT 'INR',
    
    -- Status
    status TEXT DEFAULT 'PENDING', -- PENDING, DEDUCTED, DEPOSITED, CERTIFICATE_ISSUED
    deducted_at TIMESTAMP,
    deposited_at TIMESTAMP,
    certificate_number TEXT,
    certificate_issued_at TIMESTAMP,
    
    -- Financial Year
    financial_year TEXT, -- 2025-26
    quarter TEXT, -- Q1, Q2, Q3, Q4
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tds_deductions_tenant ON tds_deductions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tds_deductions_recipient ON tds_deductions(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_tds_deductions_status ON tds_deductions(status);
CREATE INDEX IF NOT EXISTS idx_tds_deductions_fy ON tds_deductions(financial_year, quarter);

-- 2. LEGAL CONSENT TRACKING TABLE
-- Tracks T&C acceptance, disclaimers, waivers with versioning
CREATE TABLE IF NOT EXISTS legal_consents (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event_id BIGINT,
    
    -- User/Entity who gave consent
    user_id BIGINT,
    entity_type TEXT, -- ATTENDEE, EXHIBITOR, VENDOR, SPONSOR, SPEAKER
    entity_id TEXT,
    entity_email TEXT NOT NULL,
    entity_name TEXT NOT NULL,
    
    -- Document Details
    document_type TEXT NOT NULL, -- TERMS_AND_CONDITIONS, PRIVACY_POLICY, REFUND_POLICY, DISCLAIMER, WAIVER, VENDOR_AGREEMENT, SPONSOR_AGREEMENT
    document_version TEXT NOT NULL, -- v1.0, v2.0, etc.
    document_hash TEXT, -- SHA256 hash of document content
    document_url TEXT, -- Link to the document
    
    -- Consent Details
    consent_method TEXT NOT NULL, -- CHECKBOX, TYPED_NAME, OTP, DIGITAL_SIGNATURE
    typed_name TEXT, -- If consent_method is TYPED_NAME
    signature_url TEXT, -- If digital signature was captured
    otp_verified BOOLEAN DEFAULT FALSE,
    
    -- Audit
    ip_address TEXT,
    user_agent TEXT,
    consent_given_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Revocation (if applicable)
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP,
    revocation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_legal_consents_tenant ON legal_consents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_event ON legal_consents(event_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_user ON legal_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_entity ON legal_consents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_legal_consents_document ON legal_consents(document_type, document_version);

-- 3. AUDIT LOG TABLE
-- Comprehensive audit trail for all financial operations
CREATE TABLE IF NOT EXISTS finance_audit_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event_id BIGINT,
    
    -- Action Details
    action_type TEXT NOT NULL, -- INVOICE_CREATED, PAYMENT_RECEIVED, PAYOUT_INITIATED, TDS_DEDUCTED, REFUND_PROCESSED, etc.
    action_description TEXT,
    
    -- Entity Reference
    entity_type TEXT NOT NULL, -- INVOICE, PAYMENT, PAYOUT, REFUND, TDS, CHARGE, CREDIT
    entity_id TEXT NOT NULL,
    
    -- Before/After State (JSON)
    previous_state JSONB,
    new_state JSONB,
    
    -- Amount Changes
    amount DOUBLE PRECISION,
    currency TEXT,
    
    -- User who performed action
    performed_by_user_id BIGINT,
    performed_by_name TEXT,
    performed_by_email TEXT,
    
    -- Audit Metadata
    ip_address TEXT,
    user_agent TEXT,
    request_id TEXT, -- For tracing
    
    -- Webhook/External Reference
    external_reference TEXT, -- Stripe/Razorpay transaction ID
    webhook_event_id TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finance_audit_tenant ON finance_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_event ON finance_audit_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_entity ON finance_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_finance_audit_action ON finance_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_finance_audit_date ON finance_audit_logs(created_at);

-- 4. PLATFORM COMMISSION CONFIG TABLE
-- Super Admin level commission rules
CREATE TABLE IF NOT EXISTS platform_commission_config (
    id TEXT PRIMARY KEY,
    
    -- Commission Type
    commission_type TEXT NOT NULL, -- TICKET_SALE, SPONSOR_PAYMENT, EXHIBITOR_PAYMENT, VENDOR_PAYMENT
    
    -- Rate Configuration
    rate_type TEXT NOT NULL, -- PERCENTAGE, FIXED, TIERED
    percentage_rate DOUBLE PRECISION DEFAULT 0, -- e.g., 2.5 for 2.5%
    fixed_amount DOUBLE PRECISION DEFAULT 0,
    
    -- Tiered Rates (JSON array)
    tiered_rates JSONB, -- [{"min": 0, "max": 10000, "rate": 3}, {"min": 10001, "max": 50000, "rate": 2.5}]
    
    -- Currency
    currency TEXT DEFAULT 'USD',
    
    -- Caps
    min_commission DOUBLE PRECISION DEFAULT 0,
    max_commission DOUBLE PRECISION, -- NULL means no cap
    
    -- Applicability
    country TEXT, -- NULL means global
    subscription_plan TEXT, -- NULL means all plans, or FREE, STARTER, PRO, ENTERPRISE
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_until TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_commission_type ON platform_commission_config(commission_type);
CREATE INDEX IF NOT EXISTS idx_platform_commission_active ON platform_commission_config(is_active);

-- 5. INVOICE NUMBER SEQUENCE TABLE
-- Auto-increment invoice numbers per tenant
CREATE TABLE IF NOT EXISTS invoice_sequences (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    
    -- Current sequence numbers
    invoice_sequence INT DEFAULT 0,
    receipt_sequence INT DEFAULT 0,
    payout_sequence INT DEFAULT 0,
    
    -- Prefix settings (can override finance_settings)
    invoice_prefix TEXT DEFAULT 'INV',
    receipt_prefix TEXT DEFAULT 'REC',
    payout_prefix TEXT DEFAULT 'PAY',
    
    -- Format settings
    year_format TEXT DEFAULT 'YYYY', -- YYYY or YY
    include_month BOOLEAN DEFAULT FALSE,
    padding_length INT DEFAULT 4, -- INV-2026-0001
    
    -- Reset settings
    reset_yearly BOOLEAN DEFAULT TRUE,
    last_reset_year INT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoice_sequences_tenant ON invoice_sequences(tenant_id);

-- 6. COUNTRY TAX CONFIG TABLE
-- Country-wise tax rules (Super Admin managed)
CREATE TABLE IF NOT EXISTS country_tax_config (
    id TEXT PRIMARY KEY,
    
    -- Country
    country_code TEXT NOT NULL, -- IN, US, GB, etc.
    country_name TEXT NOT NULL,
    
    -- Tax Type
    tax_type TEXT NOT NULL, -- GST, VAT, SALES_TAX, SERVICE_TAX
    tax_name TEXT NOT NULL, -- "Goods and Services Tax", "Value Added Tax"
    
    -- Rates
    default_rate DOUBLE PRECISION NOT NULL,
    
    -- Category-wise rates (JSON)
    category_rates JSONB, -- {"TICKET": 18, "SPONSOR": 18, "EXHIBITOR": 18, "VENDOR": 18}
    
    -- Tax Registration
    registration_required BOOLEAN DEFAULT TRUE,
    registration_label TEXT, -- "GSTIN", "VAT Number", "Tax ID"
    registration_format TEXT, -- Regex pattern for validation
    
    -- TDS/Withholding (for payouts)
    has_withholding_tax BOOLEAN DEFAULT FALSE,
    withholding_rates JSONB, -- {"VENDOR": 10, "SPEAKER": 10, "PROFESSIONAL": 10}
    
    -- Reverse Charge
    has_reverse_charge BOOLEAN DEFAULT FALSE,
    reverse_charge_threshold DOUBLE PRECISION,
    
    -- State/Region based (for US, India)
    has_state_taxes BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_country_tax_country ON country_tax_config(country_code);
CREATE INDEX IF NOT EXISTS idx_country_tax_type ON country_tax_config(tax_type);
CREATE INDEX IF NOT EXISTS idx_country_tax_active ON country_tax_config(is_active);

-- 7. STATE TAX CONFIG TABLE (for US/India)
CREATE TABLE IF NOT EXISTS state_tax_config (
    id TEXT PRIMARY KEY,
    country_tax_id TEXT NOT NULL REFERENCES country_tax_config(id) ON DELETE CASCADE,
    
    state_code TEXT NOT NULL, -- CA, NY, MH, KA, etc.
    state_name TEXT NOT NULL,
    
    -- Tax Rates
    state_tax_rate DOUBLE PRECISION DEFAULT 0,
    local_tax_rate DOUBLE PRECISION DEFAULT 0, -- City/County tax
    combined_rate DOUBLE PRECISION DEFAULT 0, -- Total
    
    -- Category overrides
    category_rates JSONB,
    
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_state_tax_country ON state_tax_config(country_tax_id);
CREATE INDEX IF NOT EXISTS idx_state_tax_state ON state_tax_config(state_code);

-- 8. PAYMENT GATEWAY CONFIG TABLE (Super Admin)
CREATE TABLE IF NOT EXISTS payment_gateway_config (
    id TEXT PRIMARY KEY,
    
    -- Gateway Details
    gateway_name TEXT NOT NULL, -- STRIPE, RAZORPAY, PAYPAL
    display_name TEXT NOT NULL,
    
    -- Environment
    environment TEXT NOT NULL DEFAULT 'sandbox', -- sandbox, production
    
    -- API Keys (encrypted in production)
    api_key TEXT,
    secret_key TEXT,
    webhook_secret TEXT,
    
    -- Supported Features
    supported_currencies JSONB, -- ["USD", "EUR", "GBP", "INR"]
    supported_payment_methods JSONB, -- ["card", "upi", "netbanking", "wallet"]
    
    -- Country Restrictions
    supported_countries JSONB, -- ["US", "IN", "GB"]
    
    -- Fees
    processing_fee_percentage DOUBLE PRECISION DEFAULT 0,
    processing_fee_fixed DOUBLE PRECISION DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_gateway_name ON payment_gateway_config(gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_active ON payment_gateway_config(is_active);

-- 9. PAYMENT WEBHOOK LOGS TABLE
CREATE TABLE IF NOT EXISTS payment_webhook_logs (
    id TEXT PRIMARY KEY,
    
    -- Gateway
    gateway TEXT NOT NULL, -- STRIPE, RAZORPAY
    
    -- Webhook Details
    event_type TEXT NOT NULL, -- payment_intent.succeeded, order.paid, etc.
    event_id TEXT NOT NULL, -- Gateway's event ID
    
    -- Payload
    payload JSONB NOT NULL,
    headers JSONB,
    
    -- Processing
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    processing_error TEXT,
    retry_count INT DEFAULT 0,
    
    -- Reference
    tenant_id TEXT,
    invoice_id TEXT,
    payment_id TEXT,
    
    -- Signature Verification
    signature_valid BOOLEAN,
    
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_gateway ON payment_webhook_logs(gateway);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON payment_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed ON payment_webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_tenant ON payment_webhook_logs(tenant_id);

-- 10. REFUND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS refund_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    event_id BIGINT,
    
    -- Original Payment
    payment_id TEXT NOT NULL,
    invoice_id TEXT,
    order_id TEXT,
    
    -- Requester
    requester_type TEXT NOT NULL, -- ATTENDEE, EXHIBITOR, SPONSOR
    requester_id TEXT,
    requester_name TEXT NOT NULL,
    requester_email TEXT NOT NULL,
    
    -- Refund Details
    original_amount DOUBLE PRECISION NOT NULL,
    refund_amount DOUBLE PRECISION NOT NULL,
    currency TEXT NOT NULL,
    
    -- Reason
    reason_category TEXT, -- CANCELLED_EVENT, DUPLICATE_PAYMENT, CUSTOMER_REQUEST, OTHER
    reason_description TEXT,
    
    -- Status
    status TEXT DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, PROCESSING, COMPLETED, FAILED
    
    -- Approval
    approved_by_user_id BIGINT,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    -- Processing
    gateway_refund_id TEXT, -- Stripe/Razorpay refund ID
    processed_at TIMESTAMP,
    processing_error TEXT,
    
    -- Partial Refund
    is_partial BOOLEAN DEFAULT FALSE,
    partial_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refund_requests_tenant ON refund_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_event ON refund_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_payment ON refund_requests(payment_id);
CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status);

-- =====================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add multi-currency columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS base_currency_amount DOUBLE PRECISION;

-- Add multi-currency columns to payments
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway TEXT; -- STRIPE, RAZORPAY, CASH
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;
ALTER TABLE payment_records ADD COLUMN IF NOT EXISTS gateway_fee DOUBLE PRECISION DEFAULT 0;

-- Add multi-currency columns to payouts
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS exchange_rate DOUBLE PRECISION DEFAULT 1;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS base_currency_amount DOUBLE PRECISION;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tds_rate DOUBLE PRECISION DEFAULT 0;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS tds_amount DOUBLE PRECISION DEFAULT 0;
ALTER TABLE payouts ADD COLUMN IF NOT EXISTS gross_amount DOUBLE PRECISION;

-- Add platform commission tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_commission DOUBLE PRECISION DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_commission_rate DOUBLE PRECISION DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_to_organizer DOUBLE PRECISION;

-- =====================================================
-- INSERT DEFAULT DATA
-- =====================================================

-- Default Platform Commission Config
INSERT INTO platform_commission_config (id, commission_type, rate_type, percentage_rate, currency, is_active)
VALUES 
    ('comm_ticket', 'TICKET_SALE', 'PERCENTAGE', 2.5, 'USD', true),
    ('comm_sponsor', 'SPONSOR_PAYMENT', 'PERCENTAGE', 2.0, 'USD', true),
    ('comm_exhibitor', 'EXHIBITOR_PAYMENT', 'PERCENTAGE', 2.0, 'USD', true),
    ('comm_vendor', 'VENDOR_PAYMENT', 'PERCENTAGE', 1.5, 'USD', true)
ON CONFLICT (id) DO NOTHING;

-- Default Country Tax Config
INSERT INTO country_tax_config (id, country_code, country_name, tax_type, tax_name, default_rate, category_rates, registration_label, has_withholding_tax, withholding_rates)
VALUES 
    ('tax_in', 'IN', 'India', 'GST', 'Goods and Services Tax', 18, '{"TICKET": 18, "SPONSOR": 18, "EXHIBITOR": 18, "VENDOR": 18}', 'GSTIN', true, '{"VENDOR": 10, "SPEAKER": 10, "PROFESSIONAL": 10}'),
    ('tax_us', 'US', 'United States', 'SALES_TAX', 'Sales Tax', 0, '{"TICKET": 0, "SPONSOR": 0, "EXHIBITOR": 0, "VENDOR": 0}', 'Tax ID', false, '{}'),
    ('tax_gb', 'GB', 'United Kingdom', 'VAT', 'Value Added Tax', 20, '{"TICKET": 20, "SPONSOR": 20, "EXHIBITOR": 20, "VENDOR": 20}', 'VAT Number', false, '{}'),
    ('tax_eu', 'EU', 'European Union', 'VAT', 'Value Added Tax', 21, '{"TICKET": 21, "SPONSOR": 21, "EXHIBITOR": 21, "VENDOR": 21}', 'VAT Number', false, '{}'),
    ('tax_ae', 'AE', 'United Arab Emirates', 'VAT', 'Value Added Tax', 5, '{"TICKET": 5, "SPONSOR": 5, "EXHIBITOR": 5, "VENDOR": 5}', 'TRN', false, '{}'),
    ('tax_sg', 'SG', 'Singapore', 'GST', 'Goods and Services Tax', 9, '{"TICKET": 9, "SPONSOR": 9, "EXHIBITOR": 9, "VENDOR": 9}', 'GST Reg No', false, '{}')
ON CONFLICT (id) DO NOTHING;

-- Default Payment Gateway Config
INSERT INTO payment_gateway_config (id, gateway_name, display_name, environment, supported_currencies, supported_payment_methods, supported_countries, is_active)
VALUES 
    ('gw_stripe', 'STRIPE', 'Stripe', 'sandbox', '["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED"]', '["card", "apple_pay", "google_pay"]', '["US", "GB", "EU", "IN", "AU", "CA", "SG", "AE"]', true),
    ('gw_razorpay', 'RAZORPAY', 'Razorpay', 'sandbox', '["INR"]', '["card", "upi", "netbanking", "wallet"]', '["IN"]', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DONE! All finance tables created
-- =====================================================
