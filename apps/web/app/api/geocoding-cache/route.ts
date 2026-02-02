import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/geocoding-cache - Get cached coordinates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')

    if (!city) {
      return NextResponse.json({ error: 'city required' }, { status: 400 })
    }

    const cached = await prisma.geocodingCache.findUnique({
      where: { city: city.toLowerCase() }
    })

    if (cached) {
      return NextResponse.json({ lat: cached.lat, lon: cached.lon })
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  } catch (error: any) {
    console.error('Error fetching geocoding cache:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch cache',
      message: error.message
    }, { status: 500 })
  }
}

// POST /api/geocoding-cache - Save coordinates
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { city, lat, lon } = body

    if (!city || lat === undefined || lon === undefined) {
      return NextResponse.json({ error: 'city, lat, lon required' }, { status: 400 })
    }

    const cached = await prisma.geocodingCache.upsert({
      where: { city: city.toLowerCase() },
      update: { lat, lon },
      create: { city: city.toLowerCase(), lat, lon }
    })

    return NextResponse.json({ cached })
  } catch (error: any) {
    console.error('Error saving geocoding cache:', error)
    return NextResponse.json({ 
      error: 'Failed to save cache',
      message: error.message
    }, { status: 500 })
  }
}
