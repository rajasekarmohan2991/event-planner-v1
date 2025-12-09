import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { requireEventRole } from '@/lib/rbac'

const NS_DRAFT = 'event_site_draft'
const NS_PUB = 'event_site_published'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const allowed = await requireEventRole(params.id, ['OWNER','ORGANIZER'])
  if (!allowed) return NextResponse.json({ message: 'Forbidden' }, { status: 403 })

  try {
    const draft = await prisma.keyValue.findUnique({ where: { namespace_key: { namespace: NS_DRAFT, key: params.id } }, select: { value: true } })
    const value = {
      site: draft?.value || { theme: 'default', colors: { primary: '#4f46e5' }, sections: [] },
      publishedAt: new Date().toISOString(),
    }
    const saved = await prisma.keyValue.upsert({
      where: { namespace_key: { namespace: NS_PUB, key: params.id } },
      create: { namespace: NS_PUB, key: params.id, value },
      update: { value },
      select: { value: true },
    })
    return NextResponse.json(saved.value)
  } catch (e:any) {
    return NextResponse.json({ message: e?.message || 'Publish failed' }, { status: 500 })
  }
}
