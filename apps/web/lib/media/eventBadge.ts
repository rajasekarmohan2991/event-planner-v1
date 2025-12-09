export type BasicEvent = {
  id?: string | number
  name?: string
  city?: string
  category?: string
  eventMode?: string
}

const CATEGORY_QUERIES: Record<string, string> = {
  "Art & Photos": "art,exhibition,gallery",
  "Art": "art,exhibition,gallery",
  "Photography": "photography,exhibition,gallery",
  "Music": "music,concert,stage",
  "Business": "business,conference,meeting",
  "Tech": "technology,conference,code",
  "Technology": "technology,conference,code",
  "Sports": "sports,stadium,game",
  "Education": "education,lecture,classroom",
  "Food & Drink": "food,festival,cuisine",
  "Health & Wellness": "wellness,fitness,yoga",
  "Theatre": "theatre,drama,performance",
  "Film": "film,cinema,screening",
  "Community": "community,meetup,networking",
}

export function getEventBadgeQuery(ev: BasicEvent): string {
  const cat = (ev.category || '').trim()
  const mode = (ev.eventMode || '').toLowerCase()
  const city = (ev.city || '').trim()

  let base = ''
  if (cat && CATEGORY_QUERIES[cat]) base = CATEGORY_QUERIES[cat]
  else if (city) base = `${city},event`
  else base = 'event,people,venue'

  if (mode) base = `${base},${mode}`
  return base
}

export function getEventBadgeSeed(ev: BasicEvent): string {
  return `${ev.name || ev.id || 'event'}:${ev.eventMode || ''}`
}
