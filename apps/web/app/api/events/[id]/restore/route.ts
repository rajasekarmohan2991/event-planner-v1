import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) {
    return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  }
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/restore`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    const bodyText = await res.text()
    const contentType = res.headers.get('content-type') || ''
    const body = contentType.includes('application/json') ? (bodyText ? JSON.parse(bodyText) : {}) : { message: bodyText }
    if (!res.ok) {
      return NextResponse.json(body || { message: 'Failed to restore event' }, { status: res.status })
    }
    return NextResponse.json(body)
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'Failed to restore event' }, { status: 500 })
  }
}
