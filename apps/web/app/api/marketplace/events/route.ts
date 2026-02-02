import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Fetch public events from all tenants
    const events = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.name,
        e.description,
        e.event_type as "eventType",
        e.start_date as "startDate",
        e.end_date as "endDate",
        e.location,
        e.status,
        e.tenant_id as "tenantId",
        t.name as "tenantName",
        t.logo as "tenantLogo",
        t."primaryColor" as "tenantColor",
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as "registrationCount"
      FROM events e
      LEFT JOIN tenants t ON e.tenant_id = t.id
      WHERE e.status = 'PUBLISHED'
        AND e.start_date >= NOW()
        AND t.status = 'ACTIVE'
      ORDER BY e.start_date ASC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const total = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM events e
      LEFT JOIN tenants t ON e.tenant_id = t.id
      WHERE e.status = 'PUBLISHED'
        AND e.start_date >= NOW()
        AND t.status = 'ACTIVE'
    `

    return NextResponse.json({
      events,
      total: Number((total as any)[0]?.count || 0),
      limit,
      offset
    })
  } catch (error: any) {
    console.error('Error fetching marketplace events:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
