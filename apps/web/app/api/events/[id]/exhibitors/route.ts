
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { randomUUID } from 'crypto'
export const dynamic = 'force-dynamic'

// List exhibitors for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id

    const session = await getServerSession(authOptions) as any
    if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    // 1. Fetch Exhibitors (Raw SQL)
    const exhibitorsRaw = await prisma.$queryRaw`
      SELECT * FROM exhibitors 
      WHERE event_id = ${eventId} 
      ORDER BY created_at DESC
    ` as any[]

    // 2. Fetch Booths
    // Assuming booths table is robust or we skip it if it fails
    // Checking if booths table exists
    let boothsRaw: any[] = []
    try {
      boothsRaw = await prisma.$queryRaw`
          SELECT * FROM booths 
          WHERE event_id = ${eventId}
        ` as any[]
    } catch {
      // Table booths might not exist
    }

    const boothsMap = new Map()
    boothsRaw.forEach((booth: any) => {
      if (booth.exhibitor_id) {
        if (!boothsMap.has(booth.exhibitor_id)) {
          boothsMap.set(booth.exhibitor_id, [])
        }
        boothsMap.get(booth.exhibitor_id).push(booth)
      }
    })

    const items = exhibitorsRaw.map(ex => {
      const exBooths = boothsMap.get(ex.id) || []
      const booth = exBooths[0]
      let status = 'PENDING'
      let payment_status = 'PENDING'

      // status mapping logic...

      return {
        id: ex.id,
        company_name: ex.company || ex.name,
        brand_name: ex.name,
        contact_name: ex.contact_name,
        contact_email: ex.contact_email,
        contact_phone: ex.contact_phone,
        booth_type: ex.booth_type,
        booth_size: ex.booth_option,
        number_of_booths: exBooths.length,
        status: status,
        payment_status: payment_status,
        total_amount: booth?.price_inr || 0,
        created_at: ex.created_at
      }
    })

    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Exhibitors fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Create exhibitor
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json().catch(() => ({}))

    if (!body.company && !body.name) {
      return NextResponse.json({
        error: 'Company name or exhibitor name is required'
      }, { status: 400 })
    }

    // 1. Fetch Event and Tenant
    const events = await prisma.$queryRaw`
      SELECT id, name, tenant_id as "tenantId", "startsAt", "endsAt"
      FROM events 
      WHERE id = ${BigInt(eventId)} 
      LIMIT 1
    ` as any[]

    if (events.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const event = events[0]
    const tenantId = event.tenantId
    const newId = randomUUID()

    // 2. Insert Exhibitor (Raw SQL with all fields)
    await prisma.$executeRawUnsafe(`
      INSERT INTO exhibitors (
        id, event_id, tenant_id,
        name, company, contact_name, contact_email, contact_phone,
        website, notes, 
        first_name, last_name, job_title,
        business_address, company_description, products_services,
        booth_type, booth_option, booth_area,
        electrical_access, display_tables,
        status, email_confirmed,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3,
        $4, $5, $6, $7, $8,
        $9, $10,
        $11, $12, $13,
        $14, $15, $16,
        $17, $18, $19,
        $20, $21,
        $22, $23,
        NOW(), NOW()
      )
    `,
      newId,
      eventId,
      tenantId,
      String(body.name || body.company || '').trim(),
      body.company || null,
      body.contactName || null,
      body.contactEmail || null,
      body.contactPhone || null,
      body.website || null,
      body.notes || null,
      body.firstName || null,
      body.lastName || null,
      body.jobTitle || null,
      body.businessAddress || null,
      body.companyDescription || null,
      body.productsServices || null,
      body.boothType || null,
      body.boothOption || null,
      body.boothArea || null,
      body.electricalAccess || false,
      body.displayTables || false,
      'PENDING_CONFIRMATION',
      false
    )

    // Prepare result object
    const result = {
      id: newId,
      eventId: eventId,
      name: body.name || body.company,
      status: 'PENDING_CONFIRMATION',
      createdAt: new Date()
    }

    // 3. Send Email to Admin
    try {
      const { sendEmail } = await import('@/lib/email')

      // Get admin emails from tenant members
      const admins = await prisma.$queryRaw`
        SELECT DISTINCT u.email, u.name
        FROM users u
        INNER JOIN tenant_members tm ON u.id = tm.user_id
        WHERE tm.tenant_id = ${tenantId}
        AND tm.role IN ('OWNER', 'ADMIN')
      ` as any[]

      console.log(`[EXHIBITOR POST] Found ${admins.length} admins to notify`)

      if (admins.length === 0) {
        console.warn('[EXHIBITOR POST] No admins found, skipping email notification')
        return NextResponse.json(result, { status: 201 })
      }

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Exhibitor Registration</h2>
          <p>A new exhibitor has registered for <strong>${event.name}</strong></p>
          
          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Company Information</h3>
            <p><strong>Company:</strong> ${body.company || 'N/A'}</p>
            <p><strong>Brand Name:</strong> ${body.name || 'N/A'}</p>
            <p><strong>Description:</strong> ${body.companyDescription || 'N/A'}</p>
            <p><strong>Products/Services:</strong> ${body.productsServices || 'N/A'}</p>
          </div>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Contact Details</h3>
            <p><strong>Name:</strong> ${body.firstName || ''} ${body.lastName || ''}</p>
            <p><strong>Job Title:</strong> ${body.jobTitle || 'N/A'}</p>
            <p><strong>Email:</strong> ${body.contactEmail || 'N/A'}</p>
            <p><strong>Phone:</strong> ${body.contactPhone || 'N/A'}</p>
            <p><strong>Address:</strong> ${body.businessAddress || 'N/A'}</p>
          </div>

          <div style="background: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1F2937;">Booth Preferences</h3>
            <p><strong>Booth Type:</strong> ${body.boothType || 'N/A'}</p>
            <p><strong>Booth Option:</strong> ${body.boothOption || 'N/A'}</p>
            <p><strong>Booth Area:</strong> ${body.boothArea || 'N/A'}</p>
            <p><strong>Electrical Access:</strong> ${body.electricalAccess ? 'Yes' : 'No'}</p>
            <p><strong>Display Tables:</strong> ${body.displayTables ? 'Yes' : 'No'}</p>
          </div>

          ${body.notes ? `
          <div style="background: #FEF3C7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #92400E;">Additional Notes</h3>
            <p>${body.notes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
              Please review this registration and allocate a booth to proceed with payment.
            </p>
          </div>
        </div>
      `

      // Send email to each admin
      for (const admin of admins) {
        await sendEmail({
          to: admin.email,
          subject: `New Exhibitor Registration - ${event.name}`,
          html: emailHtml,
          text: `New exhibitor registration for ${event.name}\n\nCompany: ${body.company}\nContact: ${body.contactEmail}`
        })
        console.log(`✅ Admin notification email sent to ${admin.email} for exhibitor:`, newId)
      }
    } catch (emailError) {
      console.error('❌ Failed to send admin email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create exhibitor' }, { status: 500 })
  }
}
