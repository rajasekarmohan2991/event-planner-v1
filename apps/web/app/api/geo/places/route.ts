import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

// Venue suggestions using Google Places API (fallback to Nominatim)
// Query params: city, q, limit
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')?.trim() || ''
    const q = searchParams.get('q')?.trim() || ''
    const limit = Math.min(Number(searchParams.get('limit') || '5'), 10)

    // Try Google Places API first if key is available
    const googleKey = process.env.GOOGLE_PLACES_API_KEY
    if (googleKey && city) {
      try {
        const query = q || 'convention center auditorium hall venue'
        const searchQuery = `${query} in ${city}`
        const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
        url.searchParams.set('query', searchQuery)
        url.searchParams.set('key', googleKey)
        
        const res = await fetch(url.toString(), { next: { revalidate: 300 } })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'OK' && Array.isArray(data.results)) {
            const items = data.results.slice(0, limit).map((r: any) => ({
              id: r.place_id || String(Math.random()),
              name: r.name || 'Venue',
              displayName: r.formatted_address || r.name || 'Venue',
              lat: r.geometry?.location?.lat,
              lon: r.geometry?.location?.lng,
              address: r.formatted_address || '',
              city: city,
              state: '',
              country: '',
            }))
            return NextResponse.json({ items, source: 'google' })
          }
        }
      } catch (e) {
        console.error('Google Places API error:', e)
        // Fall through to Nominatim
      }
    }

    // Normalize city (strip suffixes like Corporation/Metropolitan/City)
    const baseCity = city
      .replace(/corporation|metropolitan|city|district|taluk|municipality|muncipality|mc/gi, '')
      .replace(/\s+/g, ' ')
      .trim()
    const effectiveCity = baseCity || city

    // Resolve city to bounding box and country code (global)
    let viewbox: { left: string; top: string; right: string; bottom: string } | null = null
    let countryCode: string | null = null
    if (effectiveCity) {
      try {
        const cs = new URLSearchParams({ format: 'jsonv2', addressdetails: '1', limit: '1', q: effectiveCity })
        const cres = await fetch(`https://nominatim.openstreetmap.org/search?${cs.toString()}`, {
          headers: { 'User-Agent': 'EventPlanner/1.0 (places-autocomplete-city)' },
          next: { revalidate: 300 },
        })
        if (cres.ok) {
          const cj = await cres.json() as any[]
          const c0 = cj?.[0]
          if (c0?.boundingbox && Array.isArray(c0.boundingbox) && c0.boundingbox.length === 4) {
            // Nominatim bbox: [south, north, west, east]
            const [south, north, west, east] = c0.boundingbox
            viewbox = { left: String(west), top: String(north), right: String(east), bottom: String(south) }
          }
          countryCode = c0?.address?.country_code || null
        }
      } catch {}
    }

    // Helper to call Nominatim
    const callNominatim = async (query: string) => {
      const params = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        limit: String(Math.max(limit * 3, 30)), // Fetch more to improve locality and variety
        q: effectiveCity ? `${query}, ${effectiveCity}` : query,
      })
      if (viewbox) {
        params.set('viewbox', `${viewbox.left},${viewbox.top},${viewbox.right},${viewbox.bottom}`)
        params.set('bounded', '1')
      }
      if (countryCode) params.set('countrycodes', countryCode)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'User-Agent': 'EventPlanner/1.0 (places-autocomplete)' },
        next: { revalidate: 60 },
      })
      if (!res.ok) return [] as any[]
      const results = await res.json() as any[]
      
      // Filter to only include results from the specified city or nearby
      if (effectiveCity) {
        const filtered = results.filter((r: any) => {
          const target = effectiveCity.toLowerCase()
          const resultCity = (r.address?.city || r.address?.town || r.address?.village || r.address?.hamlet || '').toLowerCase()
          const displayName = (r.display_name || '').toLowerCase()
          // Accept if the place's city matches or the display string mentions the target city
          return resultCity.includes(target) || displayName.includes(target)
        })
        // If overly strict filtering yields no results, fall back to viewbox-bounded raw results
        if (filtered.length === 0) return results.slice(0, limit)
        return filtered.slice(0, limit)
      }
      
      return results.slice(0, limit)
    }

    let data: any[] = []
    if (!q) {
      // Seeded keywords for venues when user hasn't typed yet
      const seeds = ['convention center', 'auditorium', 'exhibition', 'hall', 'banquet', 'hotel', 'stadium', 'expo center']
      const results = await Promise.allSettled(seeds.map(s => callNominatim(s)))
      const merged: any[] = []
      const seen = new Set<string>()
      for (const r of results) {
        if (r.status === 'fulfilled') {
          for (const d of r.value) {
            const key = String(d.place_id)
            if (!seen.has(key)) { seen.add(key); merged.push(d) }
          }
        }
      }
      data = merged
    } else {
      data = await callNominatim(q)
    }

    // Overpass (OpenStreetMap) free, no key: precise venue search bounded to city
    // Only run if we have a city bounding box
    let overpassItems: Array<{ id: string; name: string; displayName: string; lat: number; lon: number }> = []
    try {
      if (viewbox) {
        const south = Number(viewbox.bottom)
        const west = Number(viewbox.left)
        const north = Number(viewbox.top)
        const east = Number(viewbox.right)
        const bbox = `${south},${west},${north},${east}`
        const queryParts = [
          '[out:json][timeout:12];',
          '(',
          `  node["amenity"="conference_centre"](${bbox});`,
          `  way["amenity"="conference_centre"](${bbox});`,
          `  relation["amenity"="conference_centre"](${bbox});`,
          `  node["amenity"="theatre"](${bbox});`,
          `  way["amenity"="theatre"](${bbox});`,
          `  node["building"~"^(auditorium|stadium)$"](${bbox});`,
          `  way["building"~"^(auditorium|stadium)$"](${bbox});`,
          `  node["amenity"="community_centre"](${bbox});`,
          `  way["amenity"="community_centre"](${bbox});`,
          ');',
          'out center 60;',
        ].join('\n')
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ data: queryParts }),
          next: { revalidate: 60 },
        })
        if (res.ok) {
          const json = await res.json().catch(()=>null)
          const elems = Array.isArray(json?.elements) ? json.elements : []
          overpassItems = elems.map((e: any) => {
            const lat = Number(e.lat || e.center?.lat)
            const lon = Number(e.lon || e.center?.lon)
            const name = e.tags?.name || ''
            const addr = [e.tags?.['addr:street'], e.tags?.['addr:city'], e.tags?.['addr:state'], e.tags?.['addr:country']]
              .filter(Boolean).join(', ')
            return {
              id: String(e.id),
              name: name || 'Venue',
              displayName: name ? (addr ? `${name}, ${addr}` : name) : (addr || 'Venue'),
              lat, lon,
            }
          }).filter((x: any) => x.name && Number.isFinite(x.lat) && Number.isFinite(x.lon))
        }
      }
    } catch {}

    // Optional: OpenTripMap venues (requires OPENTRIPMAP_API_KEY)
    const otmKey = process.env.OPENTRIPMAP_API_KEY
    let otmItems: Array<{ id: string; name: string; displayName: string; lat: number; lon: number }> = []
    try {
      if (otmKey && viewbox) {
        const lon = (Number(viewbox.left) + Number(viewbox.right)) / 2
        const lat = (Number(viewbox.top) + Number(viewbox.bottom)) / 2
        const radius = 15000 // 15km around city center
        const kinds = 'theatres,stadiums,cinemas,concert_halls,exhibit,convention_centers,amusements,performing_arts,historic'
        const url = new URL('https://api.opentripmap.com/0.1/en/places/radius')
        url.searchParams.set('lon', String(lon))
        url.searchParams.set('lat', String(lat))
        url.searchParams.set('radius', String(radius))
        url.searchParams.set('limit', String(Math.max(limit * 2, 20)))
        url.searchParams.set('kinds', kinds)
        url.searchParams.set('apikey', otmKey)
        const r = await fetch(url.toString(), { headers: { 'User-Agent': 'EventPlanner/1.0 (opentripmap)' }, next: { revalidate: 60 } })
        if (r.ok) {
          const json = await r.json().catch(()=>null)
          const feats = Array.isArray(json?.features) ? json.features : []
          otmItems = feats.map((f: any) => ({
            id: String(f.id || f.properties?.xid || `${f.geometry?.coordinates?.[0]}_${f.geometry?.coordinates?.[1]}`),
            name: f.properties?.name || 'Venue',
            displayName: f.properties?.name || 'Venue',
            lat: Number(f.geometry?.coordinates?.[1]),
            lon: Number(f.geometry?.coordinates?.[0]),
          })).filter((x: any) => x.name && Number.isFinite(x.lat) && Number.isFinite(x.lon))
        }
      }
    } catch {}

    const nominatimItems = Array.isArray(data) ? data.slice(0, Math.max(limit * 2, 20)).map((d: any) => ({
      id: String(d.place_id),
      name: d.name || d.display_name?.split(',')[0] || 'Place',
      displayName: d.display_name,
      lat: d.lat ? Number(d.lat) : undefined,
      lon: d.lon ? Number(d.lon) : undefined,
      address: d.address?.road || d.address?.neighbourhood || d.address?.suburb || '',
      city: d.address?.city || d.address?.town || d.address?.village || d.address?.hamlet || '',
      state: d.address?.state || '',
      country: d.address?.country || '',
    })) : []

    // Merge in order: Overpass (most precise), then OpenTripMap, then Nominatim. Dedupe by name+coords.
    const merged: any[] = []
    const seen = new Set<string>()
    const push = (it: any) => {
      const key = `${(it.name || it.displayName || '').toLowerCase()}_${it.lat}_${it.lon}`
      if (!seen.has(key)) { seen.add(key); merged.push(it) }
    }
    for (const it of overpassItems) push(it)
    for (const it of otmItems) push(it)
    for (const it of nominatimItems) push(it)

    return NextResponse.json({ items: merged.slice(0, limit) })
  } catch (e) {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
