import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query')?.trim()

    if (!query || query.length < 3) {
      return NextResponse.json({ predictions: [] })
    }

    // Try Google Places Autocomplete API first
    const googleKey = process.env.GOOGLE_PLACES_API_KEY
    if (googleKey) {
      try {
        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json')
        url.searchParams.set('input', query)
        url.searchParams.set('key', googleKey)
        url.searchParams.set('types', 'address')
        
        const response = await fetch(url.toString())
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'OK') {
            return NextResponse.json(data)
          }
        }
      } catch (error) {
        console.error('Google Places Autocomplete error:', error)
      }
    }

    // Fallback to Nominatim for address search
    try {
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: '5',
        q: query
      })

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'EventPlanner/1.0 (address-autocomplete)' }
      })

      if (response.ok) {
        const results = await response.json()
        
        // Convert Nominatim results to Google Places format
        const predictions = results.map((result: any) => ({
          place_id: result.place_id,
          description: result.display_name,
          structured_formatting: {
            main_text: result.name || result.display_name?.split(',')[0] || '',
            secondary_text: result.display_name?.split(',').slice(1).join(',').trim() || ''
          }
        }))

        return NextResponse.json({ predictions })
      }
    } catch (error) {
      console.error('Nominatim error:', error)
    }

    return NextResponse.json({ predictions: [] })
  } catch (error) {
    console.error('Address autocomplete error:', error)
    return NextResponse.json({ predictions: [] })
  }
}
