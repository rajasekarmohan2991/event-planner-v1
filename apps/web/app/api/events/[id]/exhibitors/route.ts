import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'

// List exhibitors for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const eventId = params.id
    
    const exhibitors = await prisma.exhibitor.findMany({
      where: { eventId },
      include: {
        booths: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // Map to format expected by frontend (snake_case)
    const items = exhibitors.map(ex => {
      // Derive status from booth status
      const booth = ex.booths[0]
      let status = 'PENDING'
      let payment_status = 'PENDING' // Default
      
      if (booth) {
        if (booth.status === 'RESERVED') status = 'PENDING_APPROVAL'
        if (booth.status === 'ASSIGNED') status = 'APPROVED'
        
        // Map price
        // payment_status is not explicitly in model, assuming derived or PENDING for now
      }

      return {
        id: ex.id,
        company_name: ex.company || ex.name,
        brand_name: ex.name, // Using name as brand name fallback
        contact_name: ex.contactName,
        contact_email: ex.contactEmail,
        contact_phone: ex.contactPhone,
        booth_type: ex.boothType,
        booth_size: ex.boothOption,
        number_of_booths: ex.booths.length,
        status: status,
        payment_status: payment_status,
        total_amount: booth?.priceInr || 0,
        created_at: ex.createdAt
      }
    })
    
    return NextResponse.json(items)
  } catch (error: any) {
    console.error('Exhibitors fetch error:', error)
    return NextResponse.json([])
  }
}

// Create exhibitor
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ message: 'Unauthorized - Please log in' }, { status: 401 })
    }
    
    const eventId = BigInt(params.id)
    const body = await req.json().catch(() => ({}))
    
    // Validate required fields
    if (!body.company && !body.name) {
      return NextResponse.json({ 
        error: 'Company name or exhibitor name is required' 
      }, { status: 400 })
    }
    
    // Use raw SQL to insert exhibitor (table uses bigint IDs)
    const created = await prisma.$queryRaw`
      INSERT INTO exhibitors (
        event_id, name, contact_name, contact_email, contact_phone,
        website, notes, prefix, first_name, last_name, preferred_pronouns,
        work_phone, cell_phone, job_title, company, business_address,
        company_description, products_services, booth_type, staff_list,
        competitors, booth_option, booth_number, booth_area,
        electrical_access, display_tables, created_at, updated_at
      ) VALUES (
        ${eventId},
        ${String(body.name || body.company || '').trim()},
        ${body.contactName || null},
        ${body.contactEmail || null},
        ${body.contactPhone || null},
        ${body.website || null},
        ${body.notes || null},
        ${body.prefix || null},
        ${body.firstName || null},
        ${body.lastName || null},
        ${body.preferredPronouns || null},
        ${body.workPhone || null},
        ${body.cellPhone || null},
        ${body.jobTitle || null},
        ${body.company || null},
        ${body.businessAddress || null},
        ${body.companyDescription || null},
        ${body.productsServices || null},
        ${body.boothType || null},
        ${body.staffList || null},
        ${body.competitors || null},
        ${body.boothOption || null},
        ${body.boothNumber || null},
        ${body.boothArea || null},
        ${Boolean(body.electricalAccess)},
        ${Boolean(body.displayTables)},
        NOW(),
        NOW()
      )
      RETURNING 
        id::text as id,
        event_id as "eventId",
        name,
        contact_name as "contactName",
        contact_email as "contactEmail",
        contact_phone as "contactPhone",
        website,
        notes,
        created_at as "createdAt"
    ` as any[]
    
    return NextResponse.json(created[0], { status: 201 })
  } catch (error: any) {
    console.error('Exhibitor creation error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create exhibitor' }, { status: 500 })
  }
}
