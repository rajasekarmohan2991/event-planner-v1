import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔧 Adding logo column to tenants table...')
    
    // Add logo column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo TEXT
    `)
    
    console.log('✅ Logo column added/verified')
    
    // Test the column exists
    const result: any[] = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'logo'
    `)
    
    return NextResponse.json({ 
      success: true,
      message: 'Logo column verified',
      columnExists: result.length > 0,
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('❌ Failed to add logo column:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Failed to add logo column',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
