import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  const qs = new URL(req.url).search
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/speakers${qs}`, {
      headers: { ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      credentials: 'include',
      cache: 'no-store',
    })
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Failed to load speakers' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Failed to load speakers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions as any)
  if (!session) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  const accessToken = (session as any)?.accessToken as string | undefined
  const body = await req.text()
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    const tenantId = ((session as any)?.user?.currentTenantId as string | undefined) || process.env.DEFAULT_TENANT_ID || 'default-tenant'
    const role = (session as any)?.user?.role as string | undefined
    if (tenantId) headers['x-tenant-id'] = tenantId
    if (role) headers['x-user-role'] = role
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`
    const res = await fetch(`${API_BASE}/events/${params.id}/speakers`, {
      method: 'POST',
      headers,
      body,
      credentials: 'include',
    })
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    if (!res.ok) return NextResponse.json(payload || { message: 'Create speaker failed' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Create speaker failed' }, { status: 500 })
  }
}
