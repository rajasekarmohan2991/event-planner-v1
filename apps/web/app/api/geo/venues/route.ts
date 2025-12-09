import { NextRequest, NextResponse } from 'next/server'

// Simple venues search using Nominatim (OpenStreetMap)
// Free/open source per project preferences. Server-side to set UA and avoid CORS issues.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = (searchParams.get('city') || '').trim()
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(15, Math.max(1, Number(searchParams.get('limit') || 10)))
  if (!city) return NextResponse.json([], { status: 200 })

  // Build a basic query that biases toward the city
  const query = [q, city].filter(Boolean).join(' ')
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('q', query)

  try {
    const resp = await fetch(url.toString(), {
      headers: {
        'User-Agent': process.env.NOMINATIM_UA || 'EventPlanner/1.0 (contact: support@example.com)',
        'Accept-Language': 'en',
      },
      // Cache briefly to reduce load while typing
      cache: 'no-store'
    })
    if (!resp.ok) return NextResponse.json([], { status: 200 })
    const raw = await resp.json()
    const items = Array.isArray(raw) ? raw : []
    const simplified = items.map((it: any) => ({
      id: it.place_id,
      name: it.display_name?.split(',')[0] || it.name || 'Unnamed',
      displayName: it.display_name,
      lat: it.lat ? Number(it.lat) : null,
      lon: it.lon ? Number(it.lon) : null,
      type: it.type || null,
      category: it.category || null,
      address: it.address || null,
    }))
    return NextResponse.json(simplified)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
