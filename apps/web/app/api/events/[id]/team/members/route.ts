import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  const sessionToken = (session as any)?.accessToken as string | undefined
  // Fallback to client-provided Authorization header when session token is not present
  const authHeader = req.headers.get('authorization') || (sessionToken ? `Bearer ${sessionToken}` : undefined)
  const url = new URL(req.url)
  const qp = url.search ? url.search : ''
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/team/members${qp}`, {
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      credentials: 'include',
      cache: 'no-store',
    })
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Failed to load team' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to load team' }, { status: 500 })
  }
}
