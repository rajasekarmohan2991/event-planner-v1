import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'

// Update exhibitor
export async function PUT(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId, exhibitorId } = params
    const body = await req.json().catch(() => ({}))

    console.log(`[EXHIBITOR PUT] Updating exhibitor ${exhibitorId} for event ${eventId}:`, body)

    // Build UPDATE query dynamically based on provided fields
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) { updates.push(`name = $${paramIndex++}`); values.push(body.name) }
    if (body.company !== undefined) { updates.push(`company = $${paramIndex++}`); values.push(body.company) }
    if (body.contactName !== undefined) { updates.push(`contact_name = $${paramIndex++}`); values.push(body.contactName) }
    if (body.contactEmail !== undefined) { updates.push(`contact_email = $${paramIndex++}`); values.push(body.contactEmail) }
    if (body.contactPhone !== undefined) { updates.push(`contact_phone = $${paramIndex++}`); values.push(body.contactPhone) }
    if (body.website !== undefined) { updates.push(`website = $${paramIndex++}`); values.push(body.website) }
    if (body.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); values.push(body.notes) }
    if (body.firstName !== undefined) { updates.push(`first_name = $${paramIndex++}`); values.push(body.firstName) }
    if (body.lastName !== undefined) { updates.push(`last_name = $${paramIndex++}`); values.push(body.lastName) }
    if (body.jobTitle !== undefined) { updates.push(`job_title = $${paramIndex++}`); values.push(body.jobTitle) }
    if (body.businessAddress !== undefined) { updates.push(`business_address = $${paramIndex++}`); values.push(body.businessAddress) }
    if (body.companyDescription !== undefined) { updates.push(`company_description = $${paramIndex++}`); values.push(body.companyDescription) }
    if (body.productsServices !== undefined) { updates.push(`products_services = $${paramIndex++}`); values.push(body.productsServices) }
    if (body.boothType !== undefined) { updates.push(`booth_type = $${paramIndex++}`); values.push(body.boothType) }
    if (body.boothOption !== undefined) { updates.push(`booth_option = $${paramIndex++}`); values.push(body.boothOption) }
    if (body.boothArea !== undefined) { updates.push(`booth_area = $${paramIndex++}`); values.push(body.boothArea) }
    if (body.electricalAccess !== undefined) { updates.push(`electrical_access = $${paramIndex++}`); values.push(Boolean(body.electricalAccess)) }
    if (body.displayTables !== undefined) { updates.push(`display_tables = $${paramIndex++}`); values.push(Boolean(body.displayTables)) }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(exhibitorId)

    const query = `
      UPDATE exhibitors 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await prisma.$queryRawUnsafe(query, ...values) as any[]

    if (!result || result.length === 0) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    console.log(`[EXHIBITOR PUT] Successfully updated exhibitor ${exhibitorId}`)
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('[EXHIBITOR PUT] Error:', error)
    return NextResponse.json({ message: 'Failed to update exhibitor', error: error.message }, { status: 500 })
  }
}

// Delete exhibitor
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { exhibitorId } = params
    console.log(`[EXHIBITOR DELETE] Deleting exhibitor ${exhibitorId}`)

    const result = await prisma.$queryRawUnsafe(`
      DELETE FROM exhibitors WHERE id = $1 RETURNING id
    `, exhibitorId) as any[]

    if (!result || result.length === 0) {
      return NextResponse.json({ message: 'Exhibitor not found' }, { status: 404 })
    }

    console.log(`[EXHIBITOR DELETE] Successfully deleted exhibitor ${exhibitorId}`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[EXHIBITOR DELETE] Error:', error)
    return NextResponse.json({ message: 'Failed to delete exhibitor', error: error.message }, { status: 500 })
  }
}
