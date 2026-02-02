import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const placeId = searchParams.get('placeId')

    if (!placeId) {
      return NextResponse.json({ error: 'Place ID is required' }, { status: 400 })
    }

    // Try Google Places Details API first
    const googleKey = process.env.GOOGLE_PLACES_API_KEY
    if (googleKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
        url.searchParams.set('place_id', placeId)
        url.searchParams.set('key', googleKey)
        url.searchParams.set('fields', 'geometry,formatted_address,name')
        
        const response = await fetch(url.toString())
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'OK' && data.result) {
            return NextResponse.json(data.result)
          }
        }
      } catch (error) {
        console.error('Google Places Details error:', error)
      }
    }

    // Fallback to Nominatim lookup
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        osm_ids: `N${placeId}` // Assuming it's a node, could also try W and R
      })

      const response = await fetch(`https://nominatim.openstreetmap.org/lookup?${params.toString()}`, {
        headers: { 'User-Agent': 'EventPlanner/1.0 (place-details)' }
      })

      if (response.ok) {
        const results = await response.json()
        if (results.length > 0) {
          const result = results[0]
          return NextResponse.json({
            geometry: {
              location: {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon)
              }
            },
            formatted_address: result.display_name,
            name: result.name
          })
        }
      }
    } catch (error) {
      console.error('Nominatim lookup error:', error)
    }

    return NextResponse.json({ error: 'Place not found' }, { status: 404 })
  } catch (error) {
    console.error('Place details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
