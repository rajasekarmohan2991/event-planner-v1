import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔧 Creating finance tables...')
    
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS tds_deductions (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_id BIGINT,
        payout_id TEXT,
        vendor_name TEXT NOT NULL,
        pan_number TEXT,
        gross_amount DOUBLE PRECISION NOT NULL,
        tds_rate DOUBLE PRECISION NOT NULL,
        tds_amount DOUBLE PRECISION NOT NULL,
        net_amount DOUBLE PRECISION NOT NULL,
        financial_year TEXT NOT NULL,
        quarter TEXT NOT NULL,
        certificate_number TEXT,
        certificate_issued_date DATE,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS legal_consents (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_id BIGINT,
        user_id TEXT,
        document_type TEXT NOT NULL,
        document_version TEXT NOT NULL,
        document_hash TEXT,
        consent_given BOOLEAN DEFAULT FALSE,
        consent_given_at TIMESTAMP WITH TIME ZONE,
        ip_address TEXT,
        user_agent TEXT,
        signature_type TEXT,
        signature_data TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS refund_requests (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_id BIGINT,
        payment_id TEXT NOT NULL,
        user_id TEXT,
        original_amount DOUBLE PRECISION NOT NULL,
        refund_amount DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD',
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reviewed_by TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        processed_at TIMESTAMP WITH TIME ZONE,
        gateway_refund_id TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS finance_audit_logs (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_id BIGINT,
        user_id TEXT,
        action_type TEXT NOT NULL,
        action_description TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        amount DOUBLE PRECISION,
        currency TEXT,
        metadata JSONB DEFAULT '{}',
        ip_address TEXT,
        external_reference TEXT,
        webhook_event_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS payment_webhook_logs (
        id TEXT PRIMARY KEY,
        gateway TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_id TEXT,
        payload JSONB NOT NULL,
        signature_valid BOOLEAN DEFAULT FALSE,
        processed BOOLEAN DEFAULT FALSE,
        received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS payment_records (
        id TEXT PRIMARY KEY,
        invoice_id TEXT,
        amount DOUBLE PRECISION NOT NULL,
        method TEXT NOT NULL,
        reference TEXT,
        status TEXT DEFAULT 'PENDING',
        notes TEXT,
        currency TEXT DEFAULT 'USD',
        exchange_rate DOUBLE PRECISION DEFAULT 1,
        gateway TEXT,
        gateway_transaction_id TEXT,
        gateway_fee DOUBLE PRECISION DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS payouts (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        event_id BIGINT,
        recipient_type TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        amount DOUBLE PRECISION NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'PENDING',
        method TEXT,
        reference TEXT,
        notes TEXT,
        exchange_rate DOUBLE PRECISION DEFAULT 1,
        base_currency TEXT DEFAULT 'USD',
        base_currency_amount DOUBLE PRECISION,
        tds_rate DOUBLE PRECISION DEFAULT 0,
        tds_amount DOUBLE PRECISION DEFAULT 0,
        gross_amount DOUBLE PRECISION,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)
    
    console.log('✅ Finance tables created')
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_tds_deductions_tenant ON tds_deductions(tenant_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_legal_consents_tenant ON legal_consents(tenant_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_finance_audit_tenant ON finance_audit_logs(tenant_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_refund_requests_tenant ON refund_requests(tenant_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_refund_requests_status ON refund_requests(status)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payment_records_invoice ON payment_records(invoice_id)`)
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_payouts_tenant ON payouts(tenant_id)`)
    
    // Add effective_from and effective_to columns to tax_structures for time-based tax application
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_from TIMESTAMP WITH TIME ZONE`)
      await prisma.$executeRawUnsafe(`ALTER TABLE tax_structures ADD COLUMN IF NOT EXISTS effective_to TIMESTAMP WITH TIME ZONE`)
    } catch (e) {
      // Columns might already exist
    }
    
    // Add status column to tenants for disable functionality
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE'`)
    } catch (e) {
      // Column might already exist
    }
    
    console.log('✅ Indexes created')
    
    return NextResponse.json({ 
      success: true,
      message: 'Finance tables created successfully',
      tables: [
        'tds_deductions',
        'legal_consents', 
        'refund_requests',
        'finance_audit_logs',
        'payment_webhook_logs',
        'payment_records',
        'payouts'
      ],
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Setup finance tables failed:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Failed to create finance tables',
      error: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
