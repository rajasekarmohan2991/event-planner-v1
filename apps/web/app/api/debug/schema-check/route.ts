import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Simple test - just try to query information_schema
        const tables = await prisma.$queryRawUnsafe(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as any[]

        return NextResponse.json({
            success: true,
            environment: process.env.NODE_ENV,
            database: 'connected',
            tables: tables.map(t => t.table_name),
            message: 'Now check each table individually'
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
