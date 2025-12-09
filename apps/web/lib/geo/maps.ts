export type MapTarget = {
  latitude?: number
  longitude?: number
  city?: string
}

// Build a Google Maps link prioritizing coordinates, falling back to city text search
export function getMapLink(x: MapTarget): string {
  if (typeof x.latitude === 'number' && typeof x.longitude === 'number') {
    const lat = x.latitude
    const lon = x.longitude
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
  }
  if (x.city && x.city.trim().length > 0) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.city)}`
  }
  return 'https://www.google.com/maps'
}
