import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function POST(_req: NextRequest, { params }: { params: { id: string, sessionId: string, speakerId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/sessions/${params.sessionId}/speakers/${params.speakerId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Attach speaker failed' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Attach speaker failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string, sessionId: string, speakerId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/sessions/${params.sessionId}/speakers/${params.speakerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    if (!res.ok) {
      const text = await res.text()
      const isJson = (res.headers.get('content-type') || '').includes('application/json')
      const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
      return NextResponse.json(payload || { message: 'Detach speaker failed' }, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Detach speaker failed' }, { status: 500 })
  }
}
