import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const res = await fetch(`${API_BASE}/team-invitations/${params.token}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    
    if (!res.ok) return NextResponse.json(payload || { message: 'Accept failed' }, { status: res.status })
    return NextResponse.json(payload)
  } catch (e: any) {
    return NextResponse.json({ message: e?.message || 'Accept failed' }, { status: 500 })
  }
}
