import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

const RAW_API_BASE = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081'
const API_BASE = `${RAW_API_BASE.replace(/\/$/, '')}/api`

// Public endpoint to get event details without authentication
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const eventId = params.id
  
  try {
    // Fetch from Java API without auth
    const response = await fetch(`${API_BASE}/events/${eventId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ message: 'Event not found' }, { status: 404 })
      }
      return NextResponse.json({ message: 'Failed to fetch event' }, { status: response.status })
    }
    
    const event = await response.json()
    return NextResponse.json(event)
  } catch (error: any) {
    console.error('Error fetching public event:', error)
    return NextResponse.json({ message: error.message || 'Failed to fetch event' }, { status: 500 })
  }
}
