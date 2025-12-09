import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function PUT(req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  if (!accessToken) return NextResponse.json({ message: 'Not authenticated' }, { status: 401 })
  const url = new URL(req.url)
  const qp = url.search ? url.search : ''
  try {
    const res = await fetch(`${API_BASE}/events/${params.id}/team/members/${params.memberId}${qp}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${accessToken}` },
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

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; memberId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  
  console.log('🔍 DELETE team member - Session check:', {
    hasSession: !!session,
    hasAccessToken: !!accessToken,
    userEmail: (session as any)?.user?.email,
    eventId: params.id,
    memberId: params.memberId
  })
  
  // If no session, return 401 Unauthorized (not 403)
  if (!session) {
    return NextResponse.json({ 
      message: 'Unauthorized. Please log in.' 
    }, { status: 401 })
  }
  
  // Continue even without accessToken - Java API might handle it
  
  try {
    const url = `${API_BASE}/events/${params.id}/team/members/${params.memberId}`
    console.log('🔗 DELETE request to Java API:', url)
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include',
    })
    
    console.log('📥 Java API response status:', res.status)
    
    if (!res.ok) {
      const text = await res.text()
      console.error('❌ Java API error:', text)
      const isJson = (res.headers.get('content-type') || '').includes('application/json')
      const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
      return NextResponse.json(payload || { message: 'Delete failed' }, { status: res.status })
    }
    return new NextResponse(null, { status: 204 })
  } catch (e: any) {
    console.error('❌ DELETE team member error:', e)
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
