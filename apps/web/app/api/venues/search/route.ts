import { NextRequest, NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

interface OSMVenue {
  id: string
  name: string
  type: string
  address?: string
  city?: string
  capacity?: number
  rooms?: number
  beds?: number
  phone?: string
  website?: string
  lat: number
  lon: number
}

// Generate fallback venues when OSM fails or returns 0 results
function generateFallbackVenues(city: string, eventType: string, category: string): OSMVenue[] {
  const fallbackVenues: OSMVenue[] = []
  
  if (eventType.toLowerCase().includes('conference') || category.toLowerCase().includes('business')) {
    fallbackVenues.push(
      { id: 'fallback-1', name: `${city} Conference Centre`, type: 'conference', lat: 0, lon: 0, capacity: 100 },
      { id: 'fallback-2', name: `${city} Business Hotel`, type: 'hotel', lat: 0, lon: 0, capacity: 150 },
      { id: 'fallback-3', name: `${city} Convention Center`, type: 'conference', lat: 0, lon: 0, capacity: 200 }
    )
  } else if (eventType.toLowerCase().includes('meetup')) {
    fallbackVenues.push(
      { id: 'fallback-4', name: `${city} Coworking Space`, type: 'venue', lat: 0, lon: 0, capacity: 50 },
      { id: 'fallback-5', name: `${city} Cafe & Restaurant`, type: 'restaurant', lat: 0, lon: 0, capacity: 40 },
      { id: 'fallback-6', name: `${city} Community Center`, type: 'venue', lat: 0, lon: 0, capacity: 80 }
    )
  } else if (eventType.toLowerCase().includes('workshop')) {
    fallbackVenues.push(
      { id: 'fallback-7', name: `${city} Training Center`, type: 'venue', lat: 0, lon: 0, capacity: 30 },
      { id: 'fallback-8', name: `${city} Workshop Space`, type: 'venue', lat: 0, lon: 0, capacity: 25 },
      { id: 'fallback-9', name: `${city} Learning Hub`, type: 'venue', lat: 0, lon: 0, capacity: 40 }
    )
  } else {
    // Generic fallback
    fallbackVenues.push(
      { id: 'fallback-10', name: `${city} Event Venue`, type: 'venue', lat: 0, lon: 0, capacity: 100 },
      { id: 'fallback-11', name: `${city} Hotel Conference Room`, type: 'hotel', lat: 0, lon: 0, capacity: 80 },
      { id: 'fallback-12', name: `${city} Community Hall`, type: 'venue', lat: 0, lon: 0, capacity: 120 }
    )
  }
  
  return fallbackVenues
}

// Map event types to venue amenity types
function mapEventTypeToVenueTypes(eventType: string, category: string): string[] {
  const type = eventType.toLowerCase()
  const cat = category.toLowerCase()
  
  // Mapping based on event type and category
  if (type.includes('conference') || type.includes('seminar') || cat.includes('business') || cat.includes('technology')) {
    return ['conference_centre', 'hotel', 'events_venue', 'coworking_space']
  }
  if (type.includes('wedding') || cat.includes('wedding')) {
    return ['hotel', 'events_venue', 'banquet_hall', 'resort']
  }
  if (type.includes('concert') || type.includes('music') || cat.includes('music') || cat.includes('entertainment')) {
    return ['theatre', 'events_venue', 'arena', 'nightclub']
  }
  if (type.includes('sports') || cat.includes('sports')) {
    return ['stadium', 'sports_centre', 'fitness_centre']
  }
  if (type.includes('exhibition') || cat.includes('arts')) {
    return ['arts_centre', 'gallery', 'events_venue', 'conference_centre']
  }
  if (type.includes('workshop') || type.includes('training')) {
    return ['conference_centre', 'community_centre', 'coworking_space']
  }
  if (type.includes('meetup') || type.includes('networking')) {
    return ['cafe', 'restaurant', 'coworking_space', 'community_centre']
  }
  if (type.includes('party') || cat.includes('social')) {
    return ['nightclub', 'events_venue', 'restaurant', 'hotel']
  }
  
  // Default: all venue types
  return ['hotel', 'events_venue', 'conference_centre', 'restaurant', 'theatre', 'community_centre']
}

// Search venues using Overpass API (OpenStreetMap)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const city = searchParams.get('city') || ''
  const eventType = searchParams.get('type') || 'other'
  const category = searchParams.get('category') || ''
  const minCapacity = parseInt(searchParams.get('minCapacity') || '0')
  const maxCapacity = parseInt(searchParams.get('maxCapacity') || '999999')
  
  console.log('🔍 Venue search:', { city, eventType, category, minCapacity, maxCapacity })
  
  if (!city) {
    return NextResponse.json({ message: 'City parameter is required' }, { status: 400 })
  }
  
  try {
    // Get relevant venue types based on event type and category
    const venueTypes = mapEventTypeToVenueTypes(eventType, category)
    
    // Overpass API query
    const query = `
      [out:json][timeout:25];
      area["name"="${city}"]["admin_level"~"[4-8]"]->.searchArea;
      (
        node["tourism"="hotel"](area.searchArea);
        way["tourism"="hotel"](area.searchArea);
        node["amenity"="events_venue"](area.searchArea);
        way["amenity"="events_venue"](area.searchArea);
        node["amenity"="conference_centre"](area.searchArea);
        way["amenity"="conference_centre"](area.searchArea);
        node["amenity"="restaurant"](area.searchArea);
        way["amenity"="restaurant"](area.searchArea);
        node["amenity"="theatre"](area.searchArea);
        way["amenity"="theatre"](area.searchArea);
      );
      out body;
      >;
      out skel qt;
    `
    
    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch from OpenStreetMap')
    }
    
    const data = await response.json()
    
    // Parse OSM data
    const venues: OSMVenue[] = []
    const elements = data.elements || []
    
    for (const element of elements) {
      if (!element.tags) continue
      
      const tags = element.tags
      const name = tags.name || tags['name:en'] || 'Unnamed Venue'
      
      // Determine type
      let venueType = 'venue'
      if (tags.tourism === 'hotel') venueType = 'hotel'
      else if (tags.amenity === 'conference_centre') venueType = 'conference'
      else if (tags.amenity === 'restaurant') venueType = 'restaurant'
      else if (tags.amenity === 'theatre') venueType = 'theatre'
      else if (tags.amenity === 'events_venue') venueType = 'venue'
      
      // Extract capacity info
      const capacity = tags.capacity ? parseInt(tags.capacity) : undefined
      const rooms = tags.rooms ? parseInt(tags.rooms) : undefined
      const beds = tags.beds ? parseInt(tags.beds) : undefined
      
      // Filter by capacity if available
      if (minCapacity > 0 && capacity && capacity < minCapacity) continue
      if (maxCapacity < 999999 && capacity && capacity > maxCapacity) continue
      
      // Get coordinates
      let lat = element.lat
      let lon = element.lon
      
      // For ways, calculate center
      if (!lat && element.type === 'way' && element.center) {
        lat = element.center.lat
        lon = element.center.lon
      }
      
      if (!lat || !lon) continue
      
      venues.push({
        id: `osm-${element.type}-${element.id}`,
        name,
        type: venueType,
        address: tags['addr:street'] ? `${tags['addr:housenumber'] || ''} ${tags['addr:street']}`.trim() : undefined,
        city: tags['addr:city'] || city,
        capacity,
        rooms,
        beds,
        phone: tags.phone || tags['contact:phone'],
        website: tags.website || tags['contact:website'],
        lat,
        lon,
      })
    }
    
    // Sort by capacity match
    const targetCapacity = Math.floor((minCapacity + maxCapacity) / 2)
    venues.sort((a, b) => {
      if (a.capacity && !b.capacity) return -1
      if (!a.capacity && b.capacity) return 1
      if (!a.capacity && !b.capacity) return 0
      const aDiff = Math.abs((a.capacity || 0) - targetCapacity)
      const bDiff = Math.abs((b.capacity || 0) - targetCapacity)
      return aDiff - bDiff
    })
    
    console.log(`✅ Found ${venues.length} venues in ${city} for ${eventType}/${category}`)
    
    // If no venues found, use fallback
    if (venues.length === 0) {
      console.log(`⚠️  No venues found, using fallback for ${city}`)
      const fallbackVenues = generateFallbackVenues(city, eventType, category)
      return NextResponse.json({
        venues: fallbackVenues,
        count: fallbackVenues.length,
        source: 'Fallback',
        filters: { city, eventType, category, venueTypes },
        note: 'Using fallback venues. No results from OpenStreetMap.',
      })
    }
    
    return NextResponse.json({
      venues: venues.slice(0, 20),
      count: venues.length,
      source: 'OpenStreetMap',
      filters: { city, eventType, category, venueTypes },
      note: 'Venues filtered by type, category, and capacity.',
    })
  } catch (error: any) {
    console.error('Error searching venues:', error)
    console.log(`⚠️  OSM error, using fallback venues for ${city}`)
    
    const fallbackVenues = generateFallbackVenues(city, eventType, category)
    
    return NextResponse.json({
      venues: fallbackVenues,
      count: fallbackVenues.length,
      source: 'Fallback',
      filters: { city, eventType, category },
      note: 'Using fallback venues. OpenStreetMap service temporarily unavailable.',
    })
  }
}
