import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const address = searchParams.get('address')
    
    if (!address) {
      return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 })
    }

    // Use Google Geocoding API to get coordinates
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!googleApiKey) {
      return NextResponse.json({ error: 'Google Maps API key not configured' }, { status: 500 })
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${googleApiKey}`
    
    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location
      return NextResponse.json({
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: data.results[0].formatted_address
      })
    } else {
      return NextResponse.json({ error: 'Address not found' }, { status: 404 })
    }
  } catch (error: any) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Failed to fetch coordinates' }, { status: 500 })
  }
}
