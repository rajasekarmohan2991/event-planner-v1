import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * SCHEMA DIAGNOSTIC ENDPOINT
 * 
 * This endpoint probes the production database to determine the actual schema.
 * Access: /api/debug/schema-check
 * 
 * It will tell us:
 * 1. Which tables exist
 * 2. What columns they have
 * 3. What data types are used
 */

export async function GET(req: NextRequest) {
    try {
        const results: any = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            tables: {}
        }

        // List of tables to check
        const tablesToCheck = [
            'speakers',
            'sponsors',
            'event_vendors',
            'exhibitors',
            'floor_plans',
            'EventRoleAssignment',
            'Ticket',
            'Order',
            'registrations',
            'events'
        ]

        for (const tableName of tablesToCheck) {
            try {
                // Check if table exists and get its columns
                const columns = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          ORDER BY ordinal_position
        `) as any[]

                if (columns.length > 0) {
                    results.tables[tableName] = {
                        exists: true,
                        columns: columns.map(c => ({
                            name: c.column_name,
                            type: c.data_type,
                            nullable: c.is_nullable === 'YES'
                        }))
                    }
                } else {
                    results.tables[tableName] = {
                        exists: false,
                        error: 'Table not found'
                    }
                }
            } catch (e: any) {
                results.tables[tableName] = {
                    exists: false,
                    error: e.message
                }
            }
        }

        // Try to detect event_id column variations in speakers
        if (results.tables.speakers?.exists) {
            const speakerCols = results.tables.speakers.columns.map((c: any) => c.name)
            results.speakers_event_column = speakerCols.find((c: string) =>
                c.toLowerCase().includes('event')
            ) || 'NOT_FOUND'
        }

        return NextResponse.json(results, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0'
            }
        })

    } catch (error: any) {
        return NextResponse.json({
            error: 'Schema check failed',
            message: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
