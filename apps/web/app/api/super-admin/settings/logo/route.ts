import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get company logo
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get logo from system_settings table
    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT value FROM system_settings WHERE key = 'company_logo' LIMIT 1
      `
      return NextResponse.json({ logo: result[0]?.value || null })
    } catch (dbError: any) {
      // If table doesn't exist, create it
      if (dbError.message?.includes('does not exist')) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS system_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `)
        return NextResponse.json({ logo: null })
      }
      throw dbError
    }
  } catch (error: any) {
    console.error('Error fetching logo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update company logo
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { logo } = body

    // Ensure table exists
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // Upsert logo setting
    await prisma.$executeRawUnsafe(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('company_logo', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `, logo)

    return NextResponse.json({ success: true, logo })
  } catch (error: any) {
    console.error('Error updating logo:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
