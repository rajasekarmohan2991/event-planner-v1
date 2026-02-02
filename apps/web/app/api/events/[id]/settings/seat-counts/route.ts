import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getKV, setKV } from '@/lib/kv'

export const dynamic = 'force-dynamic'

// Namespace for storing seat counts
const NS_SEAT_COUNTS = 'event_seat_counts'

// GET /api/events/[id]/settings/seat-counts - Get saved seat allocation counts
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const seatCounts = await getKV<any>(NS_SEAT_COUNTS, eventId)

    return NextResponse.json({
      eventId,
      vipSeats: Number(seatCounts?.vipSeats || 0),
      premiumSeats: Number(seatCounts?.premiumSeats || 0),
      generalSeats: Number(seatCounts?.generalSeats || 0),
      updatedAt: seatCounts?.updatedAt || null,
      isDefault: !seatCounts,
    })
  } catch (error: any) {
    console.error('Get seat counts error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch seat counts' }, { status: 500 })
  }
}

// POST /api/events/[id]/settings/seat-counts - Save seat allocation counts (VIP/Premium/General)
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions as any)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id
    const body = await req.json()
    const vipSeats = Number(body.vipSeats || 0)
    const premiumSeats = Number(body.premiumSeats || 0)
    const generalSeats = Number(body.generalSeats || 0)

    const isValid = [vipSeats, premiumSeats, generalSeats].every(n => Number.isFinite(n) && n >= 0 && n <= 100000)
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid seat counts' }, { status: 400 })
    }

    await setKV(NS_SEAT_COUNTS, eventId, {
      vipSeats,
      premiumSeats,
      generalSeats,
      updatedAt: new Date().toISOString(),
      updatedBy: (session as any)?.user?.email || 'system'
    })

    return NextResponse.json({ success: true, eventId, vipSeats, premiumSeats, generalSeats })
  } catch (error: any) {
    console.error('Save seat counts error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save seat counts' }, { status: 500 })
  }
}
