import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any)
    if (!session || !(session as any).user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check authorization - only SUPER_ADMIN and ADMIN
    const userRole = (session as any).user.role as string
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole)) {
      return NextResponse.json(
        { message: 'Forbidden' },
        { status: 403 }
      )
    }

    // Return mock organizations data for now
    const organizations = [
      {
        id: '1',
        name: 'Default Organization',
        slug: 'default-org',
        status: 'ACTIVE',
        plan: 'PRO',
        createdAt: new Date().toISOString(),
        memberCount: 5,
        eventCount: 12,
        owner: {
          name: 'System Admin',
          email: 'admin@eventplanner.com'
        }
      },
      {
        id: '2',
        name: 'Event Management Corp',
        slug: 'event-mgmt',
        status: 'ACTIVE',
        plan: 'ENTERPRISE',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        memberCount: 15,
        eventCount: 25,
        owner: {
          name: 'John Doe',
          email: 'john@eventmgmt.com'
        }
      }
    ]

    return NextResponse.json({
      organizations
    })

  } catch (error: any) {
    console.error('Error fetching organizations:', error)
    
    // Return empty array on error
    return NextResponse.json({ 
      organizations: [] 
    })
  }
}
