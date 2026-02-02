import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`

    // Test table access
    const userCount = await prisma.user.count();
    const tenantCount = await prisma.tenant.count();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      },
      counts: {
        users: userCount,
        tenants: tenantCount
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed'
    }, { status: 503 })
  }
}
