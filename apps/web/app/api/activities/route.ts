import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const events = await prisma.$queryRawUnsafe<any[]>(`
      SELECT name as "eventName", created_at as "createdAt", 'EVENT' as type 
      FROM events ORDER BY created_at DESC LIMIT 10
    `)
    
    const regs = await prisma.$queryRawUnsafe<any[]>(`
      SELECT r.email, e.name as "eventName", 
      (SELECT COUNT(*)::int FROM seat_inventory WHERE event_id = e.id AND is_available = true) as "seatsRemaining",
      'REGISTRATION' as type
      FROM registrations r 
      JOIN events e ON r.event_id = e.id 
      ORDER BY r.created_at DESC LIMIT 10
    `)
    
    return NextResponse.json([...events, ...regs])
  } catch (e) {
    return NextResponse.json([])
  }
}
