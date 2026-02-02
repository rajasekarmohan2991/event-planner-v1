import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ensureSchema } from '@/lib/ensure-schema'
import { sendMail } from '@/lib/email/mailer'

  // Polyfill for BigInt serialization
  ; (BigInt.prototype as any).toJSON = function () {
    return this.toString()
  }

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = 'then' in context.params ? await context.params : context.params
    const tenantId = params.id

    const session = await getServerSession(authOptions as any) as any
    // Checks
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const userRole = session.user.role
    const currentTenantId = (session.user as any).currentTenantId
    if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (userRole === 'ADMIN' && currentTenantId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Fetch company with a robust strategy
    let company: any | null = null
    try {
      company = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          status: true,
          billingEmail: true,
          emailFromAddress: true,
          createdAt: true,
          maxEvents: true,
          maxUsers: true,
          maxStorage: true,
          trialEndsAt: true,
          subscriptionStartedAt: true,
          subscriptionEndsAt: true,
        }
      })
    } catch (e: any) {
      console.warn('Prisma select failed due to schema mismatch, using minimal fallback select', e?.message)
      const rows = await prisma.$queryRaw<any[]>`
        SELECT id, name, slug, status
        FROM tenants
        WHERE id = ${tenantId}
        LIMIT 1
      `
      if (rows && rows.length > 0) {
        const r = rows[0]
        company = {
          id: String(r.id),
          name: r.name,
          slug: r.slug,
          status: r.status,
          plan: 'FREE',
          billingEmail: null,
          emailFromAddress: null,
          createdAt: null,
          maxEvents: null,
          maxUsers: null,
          maxStorage: null,
          trialEndsAt: null,
          subscriptionStartedAt: null,
          subscriptionEndsAt: null,
        }
      }
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Fetch members
    const members = await prisma.tenantMember.findMany({
      where: { tenantId: tenantId },
      include: {
        user: { select: { name: true, email: true } }
      }
    })

    // Fetch company events directly from Prisma
    let eventsList: any[] = []
    try {
      eventsList = await prisma.event.findMany({
        where: { tenantId: tenantId },
        orderBy: { startsAt: 'desc' }
      })
    } catch (error) {
      console.error('Failed to fetch events from Prisma:', error)
      eventsList = []
    }

    // Calculate real-time registrations
    const eventIds = eventsList.map((e: any) => e.id)
    const registrationCounts: Record<string, number> = {}

    if (eventIds.length > 0) {
      const regCounts = await prisma.registration.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: eventIds },
          tenantId: tenantId
        },
        _count: { eventId: true }
      })
      regCounts.forEach((row) => {
        registrationCounts[String(row.eventId)] = row._count.eventId
      })
    }

    // Map events
    const events = eventsList.map((e: any) => ({
      id: String(e.id),
      name: e.name,
      start_date: e.startsAt,
      end_date: e.endsAt,
      location: e.city || e.venue || 'Online',
      status: e.status,
      priceInr: e.priceInr || 0,
      capacity: e.expectedAttendees || 0,
      _count: {
        registrations: registrationCounts[String(e.id)] || 0
      }
    }))

    const fallbackEmail = company.billingEmail || company.emailFromAddress || process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER || `support@${company.slug}.com`

    const formattedCompany = {
      ...company,
      billingEmail: fallbackEmail,
      events,
      members: members.map(m => ({
        id: m.id,
        role: m.role,
        user: m.user
      }))
    }

    return NextResponse.json({
      success: true,
      company: formattedCompany
    })

  } catch (error: any) {
    console.error('Error fetching company details:', error)
    if (error.message?.includes('column') || error.message?.includes('exist') || error.code === 'P2010' || error.code === '42703') {
      try {
        await ensureSchema()
        return NextResponse.json({ message: 'System updated. Please refresh.' }, { status: 503 })
      } catch (e) { console.error(e) }
    }
    return NextResponse.json(
      { error: 'Failed to fetch company details', details: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = 'then' in context.params ? await context.params : context.params

    const session = await getServerSession(authOptions as any) as any
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { plan, status } = body

    // Use Raw SQL for updating to avoid schema mismatch issues
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (plan !== undefined) {
      updates.push(`plan = $${idx++}`)
      values.push(plan)
    }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`)
      values.push(status)
    }

    if (updates.length > 0) {
      values.push(params.id)
      await prisma.$executeRawUnsafe(
        `UPDATE tenants SET ${updates.join(', ')} WHERE id = $${idx}`,
        ...values
      )
    }

    // Fetch updated record to return
    let updatedTenant = null
    let billingEmail = null
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM tenants WHERE id = ${params.id}`
      if (rows && rows.length > 0) {
        updatedTenant = rows[0]
        updatedTenant.id = String(updatedTenant.id)
        billingEmail = updatedTenant.billing_email || updatedTenant.email_from_address
      }
    } catch (e) { console.log('Fetch after update failed', e) }

    // Send email notification if plan was updated
    let emailSent = false
    let emailError = null
    if (plan !== undefined && billingEmail) {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aypheneventplanner.vercel.app'
        await sendMail({
          to: billingEmail,
          subject: `Your Subscription Plan Has Been Updated to ${plan}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">Subscription Plan Updated</h2>
              <p>Hello,</p>
              <p>Your subscription plan has been updated to <strong>${plan}</strong>.</p>
              <p>If you have any questions about your new plan or need assistance, please contact our support team.</p>
              <div style="margin: 24px 0;">
                <a href="${baseUrl}/dashboard" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                  Go to Dashboard
                </a>
              </div>
              <p style="color: #6B7280; font-size: 14px;">Thank you for using Ayphen Event Planner.</p>
            </div>
          `
        })
        emailSent = true
      } catch (err: any) {
        console.error('Failed to send plan update email:', err)
        emailError = err.message
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Company plan updated successfully',
      company: updatedTenant,
      emailSent,
      emailError
    })
  } catch (error: any) {
    console.error('Error updating company:', error)

    if (error.message?.includes('column') || error.message?.includes('exist') || error.code === 'P2010' || error.code === '42703') {
      try {
        await ensureSchema()
        return NextResponse.json({ message: 'System updated. Please try again.' }, { status: 503 })
      } catch (e) { console.error(e) }
    }

    return NextResponse.json(
      { error: 'Failed to update company', details: error.message },
      { status: 500 }
    )
  }
}
