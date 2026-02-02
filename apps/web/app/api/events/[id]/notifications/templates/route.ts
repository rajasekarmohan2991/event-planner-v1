import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const NS = 'email_templates'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  const url = new URL(req.url)
  const key = url.searchParams.get('key') || 'rsvp_confirmation'
  const item = await prisma.keyValue.findUnique({
    where: { namespace_key: { namespace: NS, key: `${eventId}:${key}` } },
    select: { value: true },
  })
  return NextResponse.json(item?.value || { subject: '', html: '' })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const eventId = params.id
  const allowed = await requireEventRole(eventId, ['STAFF','ORGANIZER','OWNER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  const url = new URL(req.url)
  const key = url.searchParams.get('key') || 'rsvp_confirmation'
  const body = await req.json().catch(()=> ({}))
  const value = { subject: String(body.subject||''), html: String(body.html||'') }
  const saved = await prisma.keyValue.upsert({
    where: { namespace_key: { namespace: NS, key: `${eventId}:${key}` } },
    create: { namespace: NS, key: `${eventId}:${key}`, value },
    update: { value },
    select: { value: true }
  })
  return NextResponse.json(saved.value)
}
