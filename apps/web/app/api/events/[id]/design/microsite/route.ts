import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions, checkUserRole } from '@/lib/auth'
import { getKV, setKV } from '@/lib/kv'
export const dynamic = 'force-dynamic'

const ns = (eventId: string) => `design:${eventId}`
const key = 'microsite'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const data = await getKV(ns(params.id), key)
  return NextResponse.json(data ?? {})
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || !checkUserRole(session, ['ADMIN', 'ORGANIZER'])) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  await setKV(ns(params.id), key, body || {})
  return NextResponse.json({ ok: true })
}
