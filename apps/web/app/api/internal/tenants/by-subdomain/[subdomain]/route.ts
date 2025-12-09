import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Internal API - Get tenant by subdomain
export async function GET(req: NextRequest, { params }: { params: { subdomain: string } }) {
  try {
    // Security: Only allow internal requests
    const isInternal = req.headers.get('x-internal-request') === 'true'
    if (!isInternal) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: params.subdomain },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        status: true,
        plan: true
      }
    })
    
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }
    
    return NextResponse.json(tenant)
  } catch (error: any) {
    console.error('Error fetching tenant by subdomain:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
