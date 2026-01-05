import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  
  if (!session || !(session as any).user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const role = (session as any)?.user?.role as string | undefined
  
  // Only SUPER_ADMIN, ADMIN, TENANT_ADMIN, EVENT_MANAGER can view
  if (!['SUPER_ADMIN', 'ADMIN', 'TENANT_ADMIN', 'EVENT_MANAGER'].includes(role || '')) {
    return NextResponse.json({ message: 'Access denied' }, { status: 403 })
  }

  try {
    const pendingExhibitors = await prisma.$queryRaw<any[]>`
      SELECT 
        er.id::text,
        er.event_id::text as "eventId",
        e.name as "eventName",
        er.company_name as "companyName",
        er.brand_name as "brandName",
        er.contact_name as "contactName",
        er.contact_email as "contactEmail",
        er.contact_phone as "contactPhone",
        er.booth_type as "boothType",
        er.booth_size as "boothSize",
        er.number_of_booths as "numberOfBooths",
        er.total_amount::numeric as "totalAmount",
        er.status,
        er.payment_status as "paymentStatus",
        er.created_at as "createdAt"
      FROM exhibitor_registrations er
      LEFT JOIN events e ON e.id = er.event_id
      WHERE er.status = 'PENDING_APPROVAL'
      ORDER BY er.created_at DESC
      LIMIT 100
    `

    return NextResponse.json({ exhibitors: pendingExhibitors })
  } catch (e: any) {
    console.error('Failed to load pending exhibitors:', e)
    return NextResponse.json({ message: e?.message || 'Failed' }, { status: 500 })
  }
}
