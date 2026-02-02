import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

// Public endpoint to fetch ordered custom fields for attendee form
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const items = await prisma.customField.findMany({
    where: { eventId },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
  })
  // Map to a lean public shape
  const fields = items.map(f => ({
    id: f.id,
    fieldKey: f.key,
    label: f.label,
    fieldType: f.type,
    required: f.required,
    optionsJson: f.options ? JSON.stringify(f.options) : null,
    orderIndex: f.order ?? 0,
  }))
  return NextResponse.json(fields)
}
