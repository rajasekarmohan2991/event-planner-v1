import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Missed registrations (MVP):
// - RSVPs accepted/maybe without a completed registration for same email
// - Registrations pending older than 48h
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
  
  const eventId = params.id

  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const now = new Date()
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    // Use raw SQL for RSVP guests - removed dynamic query composition
    const rsvps = await prisma.$queryRaw`
      SELECT id::text, email, name, status, created_at as "createdAt"
      FROM rsvp_guests
      WHERE event_id = ${parseInt(eventId)}
      AND status IN ('GOING', 'INTERESTED')
      ORDER BY created_at DESC
    `.catch(() => [])

    // Get all registration emails (data_json is TEXT, not JSONB)
    const regEmailsRaw = await prisma.$queryRaw`
      SELECT DISTINCT email
      FROM registrations
      WHERE event_id = ${parseInt(eventId)} AND email IS NOT NULL
    `.catch(() => [])

    const registeredEmails = new Set((regEmailsRaw as any[]).map((r: any) => r.email?.toLowerCase()).filter(Boolean))
    let missedRsvps = (rsvps as any[]).filter((r: any) => r.email && !registeredEmails.has(r.email.toLowerCase()))
    
    // Apply search filter in JavaScript if needed
    if (q) {
      missedRsvps = missedRsvps.filter((r: any) => 
        r.email?.toLowerCase().includes(q.toLowerCase())
      )
    }

    // Pending registrations older than 48h (parse TEXT as JSON)
    const pendingRegsRaw = await prisma.$queryRaw`
      SELECT 
        id::text,
        email,
        data_json,
        created_at as "createdAt"
      FROM registrations
      WHERE event_id = ${parseInt(eventId)}
      AND created_at < ${cutoff}
      ORDER BY created_at DESC
    `.catch(() => [])
    
    // Parse data_json and filter for PENDING status
    let pendingRegs = (pendingRegsRaw as any[]).map((r: any) => {
      let dataJson: any = {}
      try {
        dataJson = r.data_json ? JSON.parse(r.data_json) : {}
      } catch (e) {
        console.error('Failed to parse data_json:', e)
      }
      return {
        id: r.id,
        email: r.email || dataJson.email,
        firstName: dataJson.firstName,
        lastName: dataJson.lastName,
        status: dataJson.status || 'PENDING',
        createdAt: r.createdAt
      }
    }).filter((r: any) => r.status === 'PENDING')
    
    // Apply search filter in JavaScript if needed
    if (q) {
      pendingRegs = (pendingRegs as any[]).filter((r: any) => 
        r.email?.toLowerCase().includes(q.toLowerCase())
      )
    }

    return NextResponse.json({ rsvps: missedRsvps, pending: pendingRegs })
  } catch (e: any) {
    return NextResponse.json({ rsvps: [], pending: [] }, { status: 200 })
  }
}
