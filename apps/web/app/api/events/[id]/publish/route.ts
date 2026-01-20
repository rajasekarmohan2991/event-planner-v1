import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
export const dynamic = 'force-dynamic'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions as any)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized - Please log in' }, { status: 401 })
  }

  const eventId = parseInt(params.id)

  try {
    // 1. IMMEDIATE DB Update - Don't wait for anything else
    console.log(`📝 Publishing event ${eventId}...`)

    await prisma.$executeRaw`
      UPDATE events 
      SET status = 'PUBLISHED', updated_at = NOW() 
      WHERE id = ${eventId}
    `

    console.log(`✅ Event ${eventId} published to DB`)

    // 2. Fire-and-forget Java API call (async, don't wait)
    // This runs in the background and won't block the response
    const accessToken = (session as any)?.accessToken as string | undefined
    if (accessToken) {
      const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
      const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}`
      const url = `${API_BASE}/api/events/${params.id}/publish`

      // Fire and forget - don't await
      fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
        .then(response => {
          if (response.ok) {
            console.log(`✅ Java API publish succeeded for event ${eventId}`)
          } else {
            console.warn(`⚠️ Java API publish failed for event ${eventId}:`, response.status)
          }
        })
        .catch(err => {
          console.warn(`⚠️ Java API connection error for event ${eventId}:`, err.message)
        })
    }

    // 3. Return immediately (don't wait for Java API)
    return NextResponse.json({
      success: true,
      message: 'Event published successfully',
      eventId: params.id,
      status: 'PUBLISHED'
    })

  } catch (error: any) {
    console.error('❌ Publish event error:', error)
    return NextResponse.json(
      { message: error?.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
