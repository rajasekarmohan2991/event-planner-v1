import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'

// List fields for an event
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const items = await prisma.customField.findMany({
    where: { eventId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  return NextResponse.json(items)
}

// Create field
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const eventId = params.id
  const body = await req.json().catch(() => ({}))
  const { label = '', key, type = 'TEXT', required = false, helpText = null, options = null } = body || {}

  const last = await prisma.customField.findFirst({ where: { eventId }, orderBy: { order: 'desc' } })
  const order = (last?.order || 0) + 1
  const slug = (key || String(label || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).slice(0, 50) || `field-${Date.now()}`
  const created = await prisma.customField.create({
    data: {
      eventId,
      key: slug,
      label: String(label || '').slice(0, 120),
      type,
      required: !!required,
      helpText: helpText || null,
      options: options ?? null,
      order,
    }
  })
  return NextResponse.json(created, { status: 201 })
}
