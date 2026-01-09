import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔧 Testing database connection...')
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful:', result)
    
    // Test if invoices table exists
    try {
      const invoiceCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM invoices`
      console.log('✅ Invoices table exists, count:', invoiceCount)
      return NextResponse.json({ 
        success: true,
        message: 'Database connected, invoices table exists',
        invoiceCount,
        timestamp: new Date().toISOString()
      })
    } catch (tableError: any) {
      console.log('⚠️ Invoices table does not exist:', tableError.message)
      
      // Try to create invoices table
      console.log('📝 Creating invoices table...')
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          event_id BIGINT,
          number TEXT NOT NULL,
          date DATE NOT NULL,
          due_date DATE NOT NULL,
          recipient_type TEXT NOT NULL,
          recipient_id TEXT,
          recipient_name TEXT NOT NULL,
          recipient_email TEXT,
          recipient_address TEXT,
          recipient_tax_id TEXT,
          status TEXT DEFAULT 'DRAFT',
          currency TEXT DEFAULT 'USD',
          subtotal DOUBLE PRECISION DEFAULT 0,
          tax_total DOUBLE PRECISION DEFAULT 0,
          discount_total DOUBLE PRECISION DEFAULT 0,
          grand_total DOUBLE PRECISION DEFAULT 0,
          notes TEXT,
          terms TEXT,
          is_signed BOOLEAN DEFAULT FALSE,
          signature_url TEXT,
          exchange_rate DOUBLE PRECISION DEFAULT 1,
          base_currency TEXT DEFAULT 'USD',
          base_currency_amount DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      
      console.log('✅ Invoices table created')
      
      // Create invoice_line_items table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS invoice_line_items (
          id TEXT PRIMARY KEY,
          invoice_id TEXT NOT NULL,
          description TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DOUBLE PRECISION NOT NULL,
          tax_rate DOUBLE PRECISION DEFAULT 0,
          tax_amount DOUBLE PRECISION DEFAULT 0,
          discount DOUBLE PRECISION DEFAULT 0,
          total DOUBLE PRECISION NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      
      console.log('✅ Invoice line items table created')
      
      // Create tax_structures table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS tax_structures (
          id TEXT PRIMARY KEY,
          tenant_id TEXT NOT NULL,
          name TEXT NOT NULL,
          rate DOUBLE PRECISION NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `)
      
      console.log('✅ Tax structures table created')
      
      return NextResponse.json({ 
        success: true,
        message: 'Database connected, tables created successfully',
        tablesCreated: ['invoices', 'invoice_line_items', 'tax_structures'],
        timestamp: new Date().toISOString()
      })
    }
  } catch (error: any) {
    console.error('❌ Database test failed:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Database test failed',
      error: error.message,
      code: error.code,
      details: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
