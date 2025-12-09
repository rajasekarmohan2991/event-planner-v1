import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

export async function PUT(req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  
  console.log('🎫 Update ticket - Session check:', {
    hasSession: !!session,
    hasAccessToken: !!accessToken,
    userEmail: (session as any)?.user?.email,
    eventId: params.id,
    ticketId: params.ticketId
  })
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized - Please log in' }, { status: 401 })
  }
  
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized - No access token. Please log out and log in again.' }, { status: 401 })
  }
  
  const body = await req.text()
  try {
    const url = `${API_BASE}/events/${params.id}/tickets/${params.ticketId}`
    console.log('🔗 PUT request to Java API:', url)
    
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body,
      credentials: 'include',
    })
    
    console.log('📥 Java API response status:', res.status)
    
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    
    if (!res.ok) {
      console.error('❌ Java API error:', text)
      
      if (res.status === 403) {
        return NextResponse.json({ 
          message: 'Access denied. You do not have permission to edit this ticket. Please contact your administrator.' 
        }, { status: 403 })
      }
      
      return NextResponse.json(payload || { message: 'Update failed' }, { status: res.status })
    }
    
    return NextResponse.json(payload)
  } catch (e: any) {
    console.error('❌ Update ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string, ticketId: string } }) {
  const session = await getServerSession(authOptions as any)
  const accessToken = (session as any)?.accessToken as string | undefined
  
  console.log('🗑️ Delete ticket - Session check:', {
    hasSession: !!session,
    hasAccessToken: !!accessToken,
    userEmail: (session as any)?.user?.email,
    eventId: params.id,
    ticketId: params.ticketId
  })
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized - Please log in' }, { status: 401 })
  }
  
  if (!accessToken) {
    return NextResponse.json({ message: 'Unauthorized - No access token. Please log out and log in again.' }, { status: 401 })
  }
  
  try {
    const url = `${API_BASE}/events/${params.id}/tickets/${params.ticketId}`
    console.log('🔗 DELETE request to Java API:', url)
    
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
    
    console.log('📥 Java API response status:', res.status)
    
    const text = await res.text()
    const isJson = (res.headers.get('content-type') || '').includes('application/json')
    const payload = isJson && text ? JSON.parse(text) : (text ? { message: text } : {})
    
    if (!res.ok) {
      console.error('❌ Java API error:', text)
      
      if (res.status === 403) {
        return NextResponse.json({ 
          message: 'Access denied. You do not have permission to delete this ticket. Please contact your administrator.' 
        }, { status: 403 })
      }
      
      return NextResponse.json(payload || { message: 'Delete failed' }, { status: res.status })
    }
    
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('❌ Delete ticket error:', e)
    return NextResponse.json({ message: e?.message || 'Delete failed' }, { status: 500 })
  }
}
