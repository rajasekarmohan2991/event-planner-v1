import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const NS = 'smtp_config'

export async function GET(_req: NextRequest) {
  const item = await prisma.keyValue.findUnique({
    where: { namespace_key: { namespace: NS, key: 'default' } },
    select: { value: true },
  })
  return NextResponse.json(item?.value || { host: '', port: 587, secure: false, user: '', pass: '', from: '' })
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(()=> ({}))
  const value = {
    host: String(body.host||''),
    port: Number(body.port||587),
    secure: !!body.secure,
    user: String(body.user||''),
    pass: String(body.pass||''),
    from: String(body.from||'')
  }
  const saved = await prisma.keyValue.upsert({
    where: { namespace_key: { namespace: NS, key: 'default' } },
    create: { namespace: NS, key: 'default', value },
    update: { value },
    select: { value: true },
  })
  return NextResponse.json(saved.value)
}
