-- Digital Signature System Tables

-- Document Templates (Admin configurable)
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template Information
  template_type VARCHAR(20) NOT NULL CHECK (template_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
  document_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('TERMS', 'DISCLAIMER', 'CONTRACT')),
  
  -- Content (Rich Text)
  content TEXT NOT NULL,
  
  -- Versioning
  version INT DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  tenant_id VARCHAR(255),
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type, is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_tenant ON document_templates(tenant_id);

-- Signature Requests
CREATE TABLE IF NOT EXISTS signature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id BIGINT NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('VENDOR', 'SPONSOR', 'EXHIBITOR')),
  entity_id VARCHAR(50) NOT NULL,
  
  -- Signer Information
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255) NOT NULL,
  
  -- Document Information
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('TERMS', 'DISCLAIMER', 'CONTRACT')),
  document_template_id UUID,
  document_content TEXT NOT NULL,
  
  -- Signature Token
  signature_token VARCHAR(255) UNIQUE NOT NULL,
  token_expires_at TIMESTAMP NOT NULL,
  
  -- Status Tracking
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELLED')),
  
  -- Signature Details
  signed_at TIMESTAMP,
  signed_by_user_id BIGINT,
  signature_ip_address VARCHAR(50),
  signature_user_agent TEXT,
  
  -- Metadata
  tenant_id VARCHAR(255),
  created_by BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_signature_template FOREIGN KEY (document_template_id) 
    REFERENCES document_templates(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_signature_requests_token ON signature_requests(signature_token);
CREATE INDEX IF NOT EXISTS idx_signature_requests_email ON signature_requests(signer_email);
CREATE INDEX IF NOT EXISTS idx_signature_requests_status ON signature_requests(status);
CREATE INDEX IF NOT EXISTS idx_signature_requests_event ON signature_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_signature_requests_entity ON signature_requests(entity_type, entity_id);

-- Signature Audit Log
CREATE TABLE IF NOT EXISTS signature_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id UUID NOT NULL,
  
  -- Action Details
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'DOWNLOADED', 'EXPIRED', 'RESENT', 'CANCELLED')),
  performed_by BIGINT,
  ip_address VARCHAR(50),
  user_agent TEXT,
  
  -- Additional Data
  metadata JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT fk_audit_signature_request FOREIGN KEY (signature_request_id) 
    REFERENCES signature_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_signature_audit_request ON signature_audit_log(signature_request_id);
CREATE INDEX IF NOT EXISTS idx_signature_audit_action ON signature_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_signature_audit_created ON signature_audit_log(created_at);

-- Insert default templates for each entity type
INSERT INTO document_templates (template_type, document_name, document_type, content, is_active, version)
VALUES 
  ('VENDOR', 'Vendor Terms & Conditions', 'TERMS', 
   '<h1>VENDOR TERMS & CONDITIONS</h1>
   <p>This agreement is made between {companyName} and {vendorName} for participation in {eventName}.</p>
   
   <h2>1. Payment Terms</h2>
   <ul>
     <li>Full payment is due 30 days before the event date</li>
     <li>Late payments are subject to a 5% penalty</li>
     <li>All payments must be made in {currency}</li>
   </ul>
   
   <h2>2. Cancellation Policy</h2>
   <ul>
     <li>50% refund if cancelled 60+ days before event</li>
     <li>25% refund if cancelled 30-59 days before event</li>
     <li>No refund if cancelled within 30 days of event</li>
   </ul>
   
   <h2>3. Liability</h2>
   <p>The vendor agrees to maintain adequate insurance and assumes all liability for their booth and products.</p>
   
   <h2>4. Compliance</h2>
   <p>Vendor agrees to comply with all event rules, local laws, and regulations.</p>
   
   <p>By signing below, you agree to these terms and conditions.</p>', 
   true, 1),
   
  ('SPONSOR', 'Sponsorship Agreement', 'TERMS',
   '<h1>SPONSORSHIP AGREEMENT</h1>
   <p>This sponsorship agreement is between {companyName} and {sponsorName} for {eventName}.</p>
   
   <h2>1. Sponsorship Benefits</h2>
   <ul>
     <li>Logo placement on event materials</li>
     <li>Booth space at the event</li>
     <li>Speaking opportunity (if applicable)</li>
     <li>Social media mentions</li>
   </ul>
   
   <h2>2. Payment Terms</h2>
   <ul>
     <li>Sponsorship fee: {sponsorshipAmount}</li>
     <li>Payment due upon signing this agreement</li>
     <li>Non-refundable after 30 days</li>
   </ul>
   
   <h2>3. Obligations</h2>
   <p>Sponsor agrees to provide logo and marketing materials by the specified deadline.</p>
   
   <h2>4. Termination</h2>
   <p>Either party may terminate with 60 days written notice.</p>
   
   <p>By signing below, you agree to this sponsorship agreement.</p>',
   true, 1),
   
  ('EXHIBITOR', 'Exhibitor Terms & Conditions', 'TERMS',
   '<h1>EXHIBITOR TERMS & CONDITIONS</h1>
   <p>This agreement is for {exhibitorName} to exhibit at {eventName}.</p>
   
   <h2>1. Booth Assignment</h2>
   <ul>
     <li>Booth number: {boothNumber}</li>
     <li>Booth size: {boothSize}</li>
     <li>Setup time: {setupTime}</li>
     <li>Teardown time: {teardownTime}</li>
   </ul>
   
   <h2>2. Payment Terms</h2>
   <ul>
     <li>Booth fee: {boothFee}</li>
     <li>Payment due 30 days before event</li>
     <li>Additional services billed separately</li>
   </ul>
   
   <h2>3. Rules & Regulations</h2>
   <ul>
     <li>No solicitation outside assigned booth</li>
     <li>Comply with fire and safety regulations</li>
     <li>Maintain professional conduct</li>
     <li>Clean up booth area daily</li>
   </ul>
   
   <h2>4. Liability</h2>
   <p>Exhibitor is responsible for all property and assumes all liability for booth activities.</p>
   
   <p>By signing below, you agree to these terms and conditions.</p>',
   true, 1)
ON CONFLICT DO NOTHING;
