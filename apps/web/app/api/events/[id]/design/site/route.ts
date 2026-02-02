import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'
export const dynamic = 'force-dynamic'

const NS_DRAFT = 'event_site_draft'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const item = await prisma.keyValue.findUnique({
    where: { namespace_key: { namespace: NS_DRAFT, key: params.id } },
    select: { value: true },
  })
  return NextResponse.json(item?.value || { theme: 'default', colors: { primary: '#4f46e5' }, sections: [] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(params.id, ['OWNER','ORGANIZER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const value = await req.json()
    const saved = await prisma.keyValue.upsert({
      where: { namespace_key: { namespace: NS_DRAFT, key: params.id } },
      create: { namespace: NS_DRAFT, key: params.id, value },
      update: { value },
      select: { value: true },
    })
    return NextResponse.json(saved.value)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to save' }, { status: 500 })
  }
}
