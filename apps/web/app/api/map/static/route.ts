import { NextRequest, NextResponse } from 'next/server'

function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN
  return Number.isFinite(n) ? n : def
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = searchParams.get('lat') || searchParams.get('latitude')
  const lon = searchParams.get('lon') || searchParams.get('lng') || searchParams.get('longitude')
  const zoom = toInt(searchParams.get('zoom'), 12)
  const w = toInt(searchParams.get('w') || searchParams.get('width'), 384)
  const h = toInt(searchParams.get('h') || searchParams.get('height'), 256)

  if (!lat || !lon) {
    return NextResponse.json({ message: 'lat and lon are required' }, { status: 400 })
  }

  const upstream = `https://staticmap.openstreetmap.de/staticmap.php?center=${encodeURIComponent(lat)},${encodeURIComponent(lon)}&zoom=${zoom}&size=${w}x${h}&markers=${encodeURIComponent(lat)},${encodeURIComponent(lon)},lightblue1`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  
  try {
    const res = await fetch(upstream, { 
      cache: 'force-cache', 
      signal: controller.signal,
      next: { revalidate: 3600 } // Next.js 13+ cache
    })
    clearTimeout(timeout)
    
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer()
      return new NextResponse(arrayBuf, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      })
    }
  } catch {}

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <rect width='${w}' height='${h}' fill='#eef2ff'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='#99a'>Map unavailable</text>
  </svg>`
  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    }
  })
}
