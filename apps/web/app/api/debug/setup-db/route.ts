import { NextResponse } from 'next/server'
import { ensureSchema } from '@/lib/ensure-schema'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔧 Starting database schema setup...')
    const success = await ensureSchema()
    if (success) {
      return NextResponse.json({ 
        success: true,
        message: 'Database schema updated successfully',
        timestamp: new Date().toISOString()
      })
    } else {
      return NextResponse.json({ 
        success: false,
        message: 'Failed to setup DB - check server logs',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }
  } catch (error: any) {
    console.error('❌ Setup DB endpoint error:', error)
    return NextResponse.json({ 
      success: false,
      message: 'Failed to setup DB',
      error: error.message,
      details: error.stack,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
