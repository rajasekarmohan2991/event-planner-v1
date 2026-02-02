// Google Places API for City and Venue Autocomplete

interface PlacePrediction {
  description: string
  place_id: string
}

interface PlaceDetails {
  name: string
  formatted_address: string
  geometry?: {
    location: {
      lat: number
      lng: number
    }
  }
}

// Mock venue data for major Indian cities
const VENUE_DATABASE: Record<string, string[]> = {
  "Mumbai": [
    "Nehru Centre", "Bombay Exhibition Centre", "Jio World Centre", 
    "Mahalaxmi Racecourse", "Bandra-Worli Sea Link", "Gateway of India",
    "Royal Opera House", "Prithvi Theatre", "NCPA", "JW Marriott Sahar"
  ],
  "Delhi": [
    "India Habitat Centre", "Pragati Maidan", "Connaught Place",
    "India Gate Lawns", "National Stadium", "Talkatora Stadium",
    "Sirifort Auditorium", "DTU Convention Centre", "The Ashok"
  ],
  "Bangalore": [
    "Bangalore Palace", "Kanteerava Stadium", "White Orchid",
    "NIMHANS Convention Centre", "MLR Convention Centre", "The Lalit",
    "Sheraton Grand", "Phoenix Marketcity", "Innovative Film City"
  ],
  "Chennai": [
    "Chennai Trade Centre", "Madhavaram", "Ramanujan IT City",
    "Chennai Convention Centre", "Hilton Chennai", "ITC Grand Chola",
    "Anna University", "M.A. Chidambaram Stadium", "Music Academy"
  ],
  "Kolkata": [
    "Science City", "Netaji Indoor Stadium", "Royal Calcutta Golf Club",
    "Swabhumi", "ITC Sonar", "Hyatt Regency", "Taj Bengal",
    "Nazrul Mancha", "Biswa Bangla Convention Centre"
  ],
  "Hyderabad": [
    "HICC - Hitex", "N Convention", "Shilparamam", "Gachibowli Stadium",
    "Taj Falaknuma Palace", "Hyderabad International Convention Centre",
    "Novotel Hyderabad", "HITEC City", "Taramati Baradari"
  ],
  "Pune": [
    "Balewadi Stadium", "Maharashtra Institute of Technology",
    "Symbiosis International", "Pune University Ground",
    "The Westin Pune", "Conrad Pune", "JW Marriott Pune"
  ],
  "Ahmedabad": [
    "GMDC Ground", "Science City Ahmedabad", "Sardar Patel Stadium",
    "Riverside Sports Club", "The Grand Bhagwati", "Hyatt Ahmedabad",
    "IIM Ahmedabad", "NID Campus", "Adalaj Stepwell"
  ]
}

export async function getCityPredictions(input: string): Promise<PlacePrediction[]> {
  // Mock implementation - in production, use Google Places API
  const cities = Object.keys(VENUE_DATABASE)
  const filtered = cities.filter(city => 
    city.toLowerCase().includes(input.toLowerCase())
  )
  
  return filtered.map(city => ({
    description: city,
    place_id: city.toLowerCase()
  }))
}

export async function getVenueSuggestions(city: string): Promise<string[]> {
  return VENUE_DATABASE[city] || []
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  // Mock implementation
  return {
    name: placeId.charAt(0).toUpperCase() + placeId.slice(1),
    formatted_address: placeId.charAt(0).toUpperCase() + placeId.slice(1) + ", India"
  }
}
