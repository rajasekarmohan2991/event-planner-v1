import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
export const dynamic = 'force-dynamic'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/purge`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      return NextResponse.json(body || { message: 'Failed to permanently delete event' }, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Failed to permanently delete event' }, { status: 500 })
  }
}
