import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'

// Update exhibitor
export async function PUT(req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { id: eventId, exhibitorId } = params
  const body = await req.json().catch(() => ({}))
  const updated = await prisma.exhibitor.update({
    where: { id: String(exhibitorId) },
    data: {
      name: body.name ?? undefined,
      contactName: body.contactName ?? undefined,
      contactEmail: body.contactEmail ?? undefined,
      contactPhone: body.contactPhone ?? undefined,
      website: body.website ?? undefined,
      notes: body.notes ?? undefined,
      prefix: body.prefix ?? undefined,
      firstName: body.firstName ?? undefined,
      lastName: body.lastName ?? undefined,
      preferredPronouns: body.preferredPronouns ?? undefined,
      workPhone: body.workPhone ?? undefined,
      cellPhone: body.cellPhone ?? undefined,
      jobTitle: body.jobTitle ?? undefined,
      company: body.company ?? undefined,
      businessAddress: body.businessAddress ?? undefined,
      companyDescription: body.companyDescription ?? undefined,
      productsServices: body.productsServices ?? undefined,
      boothType: body.boothType ?? undefined,
      staffList: body.staffList ?? undefined,
      competitors: body.competitors ?? undefined,
      boothOption: body.boothOption ?? undefined,
      boothNumber: body.boothNumber ?? undefined,
      boothArea: body.boothArea ?? undefined,
      electricalAccess: body.electricalAccess !== undefined ? Boolean(body.electricalAccess) : undefined,
      displayTables: body.displayTables !== undefined ? Boolean(body.displayTables) : undefined,
    },
  })
  // Ensure event scope (best-effort)
  if (updated.eventId !== eventId) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

// Delete exhibitor
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; exhibitorId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { exhibitorId } = params
  await prisma.exhibitor.delete({ where: { id: String(exhibitorId) } })
  return NextResponse.json({ success: true })
}
