import { NextRequest, NextResponse } from 'next/server'

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_TOKEN || ''
const EVENTBRITE_BASE_URL = 'https://www.eventbriteapi.com/v3'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const latitude = searchParams.get('latitude')
    const longitude = searchParams.get('longitude')
    const radius = searchParams.get('radius') || '50km'
    const page = searchParams.get('page') || '1'

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    if (!EVENTBRITE_TOKEN) {
      // Return empty results if no token is configured
      return NextResponse.json({ 
        events: [],
        message: 'Eventbrite integration not configured'
      })
    }

    const params = new URLSearchParams({
      'location.latitude': latitude,
      'location.longitude': longitude,
      'location.within': radius,
      'expand': 'venue,ticket_availability,organizer,category',
      'page': page
    })

    const response = await fetch(`${EVENTBRITE_BASE_URL}/events/search/?${params}`, {
      headers: {
        'Authorization': `Bearer ${EVENTBRITE_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Eventbrite API error:', response.status, response.statusText)
      return NextResponse.json({ 
        events: [],
        error: 'Failed to fetch external events'
      })
    }

    const data = await response.json()
    
    // Format the events for our frontend
    const formattedEvents = (data.events || []).map((event: any) => ({
      id: event.id,
      name: event.name?.text || 'Untitled Event',
      description: event.description?.text || event.summary || 'No description available',
      startDate: event.start?.local?.split('T')[0] || '',
      startTime: event.start?.local?.split('T')[1]?.substring(0, 5) || 'TBA',
      endDate: event.end?.local?.split('T')[0] || '',
      endTime: event.end?.local?.split('T')[1]?.substring(0, 5) || 'TBA',
      venue: {
        name: event.venue?.name || 'Online Event',
        address: event.venue?.address?.localized_address_display || event.venue?.address?.address_1 || '',
        city: event.venue?.address?.city || '',
        latitude: event.venue?.latitude,
        longitude: event.venue?.longitude
      },
      isFree: event.is_free || false,
      currency: event.ticket_availability?.minimum_ticket_price?.currency || 'INR',
      minPrice: event.ticket_availability?.minimum_ticket_price?.value ? 
        (event.ticket_availability.minimum_ticket_price.value / 100) : null,
      maxPrice: event.ticket_availability?.maximum_ticket_price?.value ?
        (event.ticket_availability.maximum_ticket_price.value / 100) : null,
      priceDisplay: getPriceDisplay(event),
      logo: event.logo?.url || event.logo?.original?.url || '',
      image: event.image?.url || event.image?.original?.url || event.logo?.url || '',
      url: event.url,
      category: event.category?.name || 'Other',
      categoryId: event.category?.id,
      organizer: {
        name: event.organizer?.name || '',
        description: event.organizer?.description?.text || ''
      },
      isOnline: event.online_event || false,
      isSoldOut: event.ticket_availability?.is_sold_out || false,
      source: 'eventbrite'
    }))

    return NextResponse.json({ 
      events: formattedEvents,
      pagination: data.pagination
    })

  } catch (error: any) {
    console.error('Error fetching Eventbrite events:', error)
    return NextResponse.json({ 
      events: [],
      error: 'Failed to fetch external events'
    })
  }
}

function getPriceDisplay(event: any): string {
  if (event.is_free) return 'Free'
  
  const minPrice = event.ticket_availability?.minimum_ticket_price
  const maxPrice = event.ticket_availability?.maximum_ticket_price
  
  if (!minPrice) return 'Check website'
  
  const currency = minPrice.currency
  const min = minPrice.value / 100
  
  if (maxPrice && maxPrice.value !== minPrice.value) {
    const max = maxPrice.value / 100
    return `${currency} ${min} - ${max}`
  }
  
  return `${currency} ${min}`
}
