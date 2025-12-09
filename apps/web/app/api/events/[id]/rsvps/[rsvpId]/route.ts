import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

// Proxy: Update RSVP
export async function PUT(req: NextRequest, { params }: { params: { id: string; rsvpId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  const body = await req.text()
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/rsvps/${params.rsvpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body,
      credentials: 'include',
    })
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Update failed' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 500 })
  }
}

// Proxy: Delete RSVP (optional backend support; if not present, return 405)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; rsvpId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/rsvps/${params.rsvpId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    if (res.status === 405 || res.status === 404) {
      return NextResponse.json({ message: 'Delete not supported' }, { status: 405 })
    }
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Delete failed' }, { status: res.status })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
