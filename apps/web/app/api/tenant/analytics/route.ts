import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = ((session as any)?.user?.currentTenantId as string) || 'default-tenant'

    // Get tenant usage analytics
    const [events, registrations, payments, members] = await Promise.all([
      prisma.$queryRaw`SELECT COUNT(*) as count FROM events WHERE tenant_id = ${tenantId}`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM registrations WHERE tenant_id = ${tenantId}`,
      prisma.$queryRaw`SELECT COUNT(*) as count, SUM(CAST(data_json->>'amount' AS DECIMAL)) as revenue FROM payments WHERE tenant_id = ${tenantId} AND status = 'COMPLETED'`,
      prisma.$queryRaw`SELECT COUNT(*) as count FROM tenant_members WHERE tenant_id = ${tenantId}`
    ])

    const analytics = {
      totalEvents: Number((events as any)[0]?.count || 0),
      totalRegistrations: Number((registrations as any)[0]?.count || 0),
      totalRevenue: Number((payments as any)[0]?.revenue || 0),
      totalMembers: Number((members as any)[0]?.count || 0)
    }

    // Get monthly trends
    const monthlyData = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as registrations
      FROM registrations
      WHERE tenant_id = ${tenantId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month
    `

    return NextResponse.json({ analytics, monthlyData })
  } catch (error: any) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
