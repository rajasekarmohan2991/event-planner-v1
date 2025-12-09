import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any)
  
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized - Please log in' }, { status: 401 })
  }

  // Get access token from session
  const accessToken = (session as any)?.accessToken as string | undefined
  const eventId = parseInt(params.id)

  try {
    // 1. Try Java API first
    const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
    const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}`
    const url = `${API_BASE}/api/events/${params.id}/publish`
    
    let javaSuccess = false
    let javaResponse = {}

    if (accessToken) {
      try {
        const response = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          cache: 'no-store',
        })
        
        if (response.ok) {
          javaSuccess = true
          javaResponse = await response.json().catch(() => ({}))
        } else {
          console.error('Java API publish failed:', response.status)
        }
      } catch (err) {
        console.error('Java API connection error:', err)
      }
    }

    // 2. Direct DB Update (Fallback/Ensure)
    // We strictly set status to 'PUBLISHED' so the frontend logic can take over (calculating UPCOMING/LIVE)
    await prisma.$executeRaw`
      UPDATE events 
      SET status = 'PUBLISHED', updated_at = NOW() 
      WHERE id = ${eventId}
    `
    
    console.log(`✅ Event ${eventId} force-published to DB`)

    return NextResponse.json({
      success: true,
      message: 'Event published successfully',
      ...javaResponse
    })

  } catch (error: any) {
    console.error('Publish event error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
