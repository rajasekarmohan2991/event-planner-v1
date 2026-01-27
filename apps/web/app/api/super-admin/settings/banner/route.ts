import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Get company banner
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        try {
            const result = await prisma.$queryRaw<any[]>`
        SELECT value FROM system_settings WHERE key = 'company_banner' LIMIT 1
      `
            return NextResponse.json({ banner: result[0]?.value || null })
        } catch (dbError: any) {
            if (dbError.message?.includes('does not exist')) {
                return NextResponse.json({ banner: null })
            }
            throw dbError
        }
    } catch (error: any) {
        console.error('Error fetching banner:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH - Update company banner
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        const { banner } = body

        // Ensure table exists (just in case)
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) UNIQUE NOT NULL,
        value TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

        // Upsert banner setting
        await prisma.$executeRawUnsafe(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('company_banner', $1, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()
    `, banner)

        return NextResponse.json({ success: true, banner })
    } catch (error: any) {
        console.error('Error updating banner:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Remove company banner
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.$executeRawUnsafe(`
      UPDATE system_settings SET value = NULL WHERE key = 'company_banner'
    `)

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting banner:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
