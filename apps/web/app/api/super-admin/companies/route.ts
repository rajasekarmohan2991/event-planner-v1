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
      return NextResponse.json({ error: 'Unauthorized - Super Admin only' }, { status: 403 })
    }

    // Fetch real companies data
    const companies = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        status: true,
        billingEmail: true,
        emailFromAddress: true,
        createdAt: true,
        _count: {
          select: { members: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Sort: "default" slug first, then others by createdAt desc
    const sortedCompanies = companies.sort((a, b) => {
      if (a.slug === 'default') return -1
      if (b.slug === 'default') return 1
      return 0 // Maintain existing sort for others
    })

    // Map to match UI expectations
    const companiesWithCounts = sortedCompanies.map(c => {
      const fallbackEmail = c.billingEmail || c.emailFromAddress || process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || `support@${c.slug}.com`
      return {
        ...c,
        billingEmail: fallbackEmail,
        eventCount: 0 // Placeholder to avoid N+1 API calls to Java service
      }
    })

    return NextResponse.json({
      success: true,
      companies: companiesWithCounts
    })
  } catch (error: any) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies', details: error.message },
      { status: 500 }
    )
  }
}
