import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const city = searchParams.get('q')

  if (!city) {
    return NextResponse.json({ error: 'City name required' }, { status: 400 })
  }

  try {
    // Use Nominatim API (OpenStreetMap) to geocode the city
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'EventPlanner/1.0',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding service unavailable')
    }

    const data = await response.json()

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    const result = data[0]
    return NextResponse.json({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      display_name: result.display_name,
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode city' },
      { status: 500 }
    )
  }
}
