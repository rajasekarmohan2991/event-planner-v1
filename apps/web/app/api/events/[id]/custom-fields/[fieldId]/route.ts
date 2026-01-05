import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'
export const dynamic = 'force-dynamic'

// Update field
export async function PUT(req: NextRequest, { params }: { params: { id: string; fieldId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { id: eventId, fieldId } = params
  const body = await req.json().catch(() => ({}))
  const updated = await prisma.customField.update({
    where: { id: String(fieldId) },
    data: {
      key: body.key ?? undefined,
      label: body.label ?? undefined,
      type: body.type ?? undefined,
      required: body.required ?? undefined,
      helpText: body.helpText ?? undefined,
      options: body.options ?? undefined,
      order: body.order !== undefined ? Number(body.order) : undefined,
    },
  })
  if (updated.eventId !== eventId) return NextResponse.json({ message: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}

// Delete field
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; fieldId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const { fieldId } = params
  await prisma.customField.delete({ where: { id: String(fieldId) } })
  return NextResponse.json({ success: true })
}
