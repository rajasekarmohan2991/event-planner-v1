import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions as any)

        if (!session || (session.user as any)?.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        console.log('🔧 Fixing tenants table schema...')
        const results: string[] = []

        // Add digital_signature_url column if it doesn't exist
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE tenants 
                ADD COLUMN IF NOT EXISTS digital_signature_url TEXT
            `)
            results.push('✅ Added digital_signature_url column to tenants table')
        } catch (error: any) {
            results.push(`⚠️ digital_signature_url column: ${error.message}`)
        }

        // Add other potentially missing columns
        try {
            await prisma.$executeRawUnsafe(`
                ALTER TABLE tenants 
                ADD COLUMN IF NOT EXISTS max_storage INT DEFAULT 1024
            `)
            results.push('✅ Added max_storage column to tenants table')
        } catch (error: any) {
            results.push(`⚠️ max_storage column: ${error.message}`)
        }

        // Verify the fix
        const columns = await prisma.$queryRawUnsafe(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tenants' 
            AND column_name IN ('digital_signature_url', 'max_storage')
        `)

        results.push(`\n📊 Verified columns: ${JSON.stringify(columns, null, 2)}`)

        return NextResponse.json({
            success: true,
            message: 'Tenant schema fixed successfully',
            results
        })

    } catch (error: any) {
        console.error('❌ Schema fix error:', error)
        return NextResponse.json({
            error: 'Failed to fix tenant schema',
            details: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
