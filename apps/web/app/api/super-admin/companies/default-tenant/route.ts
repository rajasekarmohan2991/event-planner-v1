import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as any
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    const userRole = session.user.role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Find the default tenant (usually the first one or one marked with specific flag/slug)
    // Assuming 'default' slug or the oldest tenant is the super admin tenant
    const defaultTenant = await prisma.tenant.findFirst({
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        billingEmail: true,
        createdAt: true,
        _count: {
          select: { members: true }
        }
      }
    })

    if (!defaultTenant) {
      return NextResponse.json({ error: 'Default tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      company: {
        ...defaultTenant,
        eventCount: 0 // Placeholder
      }
    })
  } catch (error: any) {
    console.error('Error fetching default tenant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch default tenant', details: error.message },
      { status: 500 }
    )
  }
}
