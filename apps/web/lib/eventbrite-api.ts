// Eventbrite API Integration

export const EVENTBRITE_CATEGORIES = {
  'music': 103,
  'business': 101,
  'food_and_drink': 110,
  'community': 113,
  'arts': 105,
  'film_and_media': 104,
  'sports': 108,
  'health': 107,
  'science_and_tech': 102,
  'travel': 109,
  'charity': 111,
  'family': 115,
  'education': 116,
  'fashion': 106,
  'other': 199
}

export const CITY_COORDINATES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Navi Mumbai': { lat: 19.0330, lng: 73.0297 },
  'Chandigarh': { lat: 30.7333, lng: 76.7794 }
}

interface EventbriteEvent {
  id: string
  name: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  venue: {
    name: string
    address: string
    city: string
    latitude?: number
    longitude?: number
  }
  isFree: boolean
  currency: string
  minPrice: number | null
  maxPrice: number | null
  priceDisplay: string
  logo: string
  image: string
  url: string
  category: string
  categoryId: string
  organizer: {
    name: string
    description: string
  }
  isOnline: boolean
  isSoldOut: boolean
}

class EventbriteAPI {
  private token: string
  private baseURL: string = 'https://www.eventbriteapi.com/v3'

  constructor(token: string) {
    this.token = token
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}) {
    const queryString = new URLSearchParams(params).toString()
    const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Eventbrite API Error:', error)
      throw error
    }
  }

  async searchEventsByCity(city: string, options: any = {}): Promise<EventbriteEvent[]> {
    const params: any = {
      'location.address': city,
      'location.within': options.radius || '50km',
      'expand': 'venue,ticket_availability,organizer,category',
      'page': options.page || 1
    }

    if (options.category) {
      params.categories = options.category
    }
    if (options.price === 'free') {
      params.price = 'free'
    } else if (options.price === 'paid') {
      params.price = 'paid'
    }
    if (options.startDate) {
      params['start_date.range_start'] = options.startDate
    }

    const data = await this.makeRequest('/events/search/', params)
    return this.formatEvents(data.events || [])
  }

  async searchEventsByLocation(latitude: number, longitude: number, options: any = {}): Promise<EventbriteEvent[]> {
    try {
      const params = new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        radius: options.radius || '50km',
        page: (options.page || 1).toString()
      })

      if (options.category) params.append('category', options.category)
      if (options.price) params.append('price', options.price)

      const response = await fetch(`/api/external/eventbrite?${params}`)
      
      if (!response.ok) {
        console.warn('Eventbrite proxy API failed, returning empty results')
        return []
      }

      const data = await response.json()
      return data.events || []
    } catch (error) {
      console.error('Eventbrite API Error:', error)
      return []
    }
  }

  private formatEvent(event: any): EventbriteEvent {
    return {
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
      priceDisplay: this.getPriceDisplay(event),
      
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
      isSoldOut: event.ticket_availability?.is_sold_out || false
    }
  }

  private formatEvents(events: any[]): EventbriteEvent[] {
    return events.map(event => this.formatEvent(event))
  }

  private getPriceDisplay(event: any): string {
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
}

// Create API instance (token should be in env)
const EVENTBRITE_TOKEN = process.env.NEXT_PUBLIC_EVENTBRITE_TOKEN || ''
export const eventbriteAPI = new EventbriteAPI(EVENTBRITE_TOKEN)
