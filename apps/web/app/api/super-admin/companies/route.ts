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
        logo: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
            events: true
          }
        },
        members: {
          where: { role: 'TENANT_ADMIN' },
          take: 1,
          select: {
            user: {
              select: { email: true }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Sort: "super-admin" slug first, then others by createdAt desc
    const sortedCompanies = companies.sort((a, b) => {
      if (a.slug === 'super-admin') return -1
      if (b.slug === 'super-admin') return 1
      return 0 // Maintain existing sort for others
    })

    // Fetch system logo for Super Admin company
    let systemLogo: string | null = null
    try {
      const logoResult = await prisma.$queryRaw<any[]>`
        SELECT value FROM system_settings WHERE key = 'company_logo' LIMIT 1
      `
      systemLogo = logoResult[0]?.value || null
    } catch (e) {
      // Table might not exist yet
    }

    // Map to match UI expectations
    const companiesWithCounts = sortedCompanies.map(c => {
      // Priority: Billing Email -> Email From Address -> Tenant Admin Email -> System Email -> Placeholder
      const adminEmail = c.members[0]?.user.email
      let fallbackEmail = c.billingEmail || c.emailFromAddress || adminEmail || process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || `support@${c.slug}.com`

      // Extract email if format is "Name <email>"
      const emailMatch = fallbackEmail?.match(/<([^>]+)>/)
      if (emailMatch) {
        fallbackEmail = emailMatch[1]
      }
      
      // Use system logo for Super Admin company
      const companyLogo = (c.slug === 'super-admin' || c.slug === 'default-tenant') ? (systemLogo || c.logo) : c.logo
      
      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        plan: c.plan,
        status: c.status,
        logo: companyLogo,
        createdAt: c.createdAt,
        billingEmail: fallbackEmail,
        _count: c._count,
        eventCount: (c._count as any).events || 0
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
