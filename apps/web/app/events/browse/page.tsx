'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Ticket, Users, Clock, IndianRupee, Search, Filter, Compass, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { toast } from '@/components/ui/use-toast'

type Event = {
  id: string
  name: string
  description: string
  startsAt: string
  endsAt: string
  city: string
  venue: string
  address: string
  priceInr: number
  status: string
  category: string
  bannerUrl: string
  capacity: number
  registrationCount: number
  country?: string
}

type CategoryCard = {
  name: string
  image: string
  color: string
}

export default function BrowseEventsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [nearbyCity, setNearbyCity] = useState('')
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [popularCities, setPopularCities] = useState<string[]>([])
  const [allCities, setAllCities] = useState<{city: string, country: string}[]>([])
  
  // Category cards - Simple icon style (matching Image 1)
  const categoryCards: CategoryCard[] = [
    {
      name: "Business",
      image: "💼",
      color: "from-blue-600 to-indigo-700"
    },
    {
      name: "Technology",
      image: "💻",
      color: "from-cyan-500 to-blue-600"
    },
    {
      name: "Art",
      image: "🎨",
      color: "from-purple-500 to-pink-600" 
    },
    {
      name: "Music",
      image: "🎵",
      color: "from-pink-500 to-red-500"
    },
    {
      name: "Food",
      image: "🍔", 
      color: "from-orange-500 to-red-600"
    },
    {
      name: "Sports",
      image: "⚽",
      color: "from-green-500 to-emerald-600"
    },
    {
      name: "Health",
      image: "💪",
      color: "from-teal-500 to-green-600"
    },
    {
      name: "Education",
      image: "📚",
      color: "from-yellow-500 to-orange-600"
    },
    {
      name: "Other",
      image: "📌",
      color: "from-gray-500 to-gray-700"
    }
  ]

  useEffect(() => {
    loadEvents()
    loadWorldCities()
    getUserLocation()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [events, searchQuery, selectedCity, selectedCategory, priceFilter])
  
  // Extract all unique categories from events
  useEffect(() => {
    if (events.length > 0) {
      // Extract all unique cities
      const cities = [...new Set(events.map(event => event.city))].filter(Boolean)
      setPopularCities(cities)
    }
  }, [events])
  
  // Get user's location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      setLoadingLocation(true)
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation({ lat: latitude, lng: longitude })
          try {
            // Reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
            )
            const data = await response.json()
            if (data.address) {
              const city = data.address.city || data.address.town || data.address.village || ''
              setNearbyCity(city)
              if (city) {
                setSelectedCity(city)
                toast({
                  title: "Location detected",
                  description: `Showing events near ${city}`,
                  duration: 3000
                })
              }
            }
          } catch (error) {
            console.error('Error getting location:', error)
          } finally {
            setLoadingLocation(false)
          }
        },
        (error) => {
          console.error('Error getting user location:', error)
          setLoadingLocation(false)
        }
      )
    }
  }
  
  // Load global cities dataset
  const loadWorldCities = async () => {
    try {
      // This would normally fetch from an API or a static JSON file
      // For this example, we'll use a subset of major cities
      setAllCities([
        { city: "New York", country: "United States" },
        { city: "London", country: "United Kingdom" },
        { city: "Tokyo", country: "Japan" },
        { city: "Paris", country: "France" },
        { city: "Mumbai", country: "India" },
        { city: "Delhi", country: "India" },
        { city: "Bangalore", country: "India" },
        { city: "Chennai", country: "India" },
        { city: "Kolkata", country: "India" },
        { city: "Hyderabad", country: "India" },
        { city: "Pune", country: "India" },
        { city: "Ahmedabad", country: "India" },
        { city: "Sydney", country: "Australia" },
        { city: "Dubai", country: "United Arab Emirates" },
        { city: "Singapore", country: "Singapore" },
        { city: "Berlin", country: "Germany" },
        { city: "Hong Kong", country: "China" },
        { city: "Toronto", country: "Canada" },
        { city: "Barcelona", country: "Spain" },
        { city: "São Paulo", country: "Brazil" },
        { city: "Rome", country: "Italy" },
        { city: "Bangkok", country: "Thailand" },
        { city: "Amsterdam", country: "Netherlands" },
        { city: "Istanbul", country: "Turkey" },
        { city: "Seoul", country: "South Korea" },
      ])
    } catch (error) {
      console.error('Error loading world cities:', error)
    }
  }

  const loadEvents = async () => {
    try {
      setLoading(true)
      // Use public endpoint to allow non-admin users to browse events
      const res = await fetch('/api/events/public?limit=50', { cache: 'no-store' })
      
      if (res.ok) {
        const data = await res.json()
        // Public endpoint returns an array directly
        const items = Array.isArray(data) ? data : (data.events || [])
        setEvents(items as any)
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error('Error loading events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = [...events]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // City filter
    if (selectedCity !== 'all') {
      filtered = filtered.filter(event => event.city === selectedCity)
    }

    // Category filter - match either exact or partial category name
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => 
        event.category === selectedCategory ||
        event.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(event.category?.toLowerCase() || '')
      )
    }

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(event => !event.priceInr || event.priceInr === 0)
    } else if (priceFilter === 'paid') {
      filtered = filtered.filter(event => event.priceInr && event.priceInr > 0)
    }

    setFilteredEvents(filtered)
  }

  const handleRegister = (eventId: string) => {
    router.push(`/events/${eventId}/register-with-seats`)
  }

  const handleViewDetails = (eventId: string) => {
    router.push(`/events/${eventId}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Browse Events
          </h1>
          <p className="text-gray-600">Discover and register for amazing events</p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">Filter Events</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <Search className="w-4 h-4 inline mr-1" />
                Search Events
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or description..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* City Filter with Worldwide Cities */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  <MapPin className="w-4 h-4 inline mr-1" /> City
                </label>
                {nearbyCity && (
                  <button 
                    onClick={() => setSelectedCity(nearbyCity)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" /> {nearbyCity}
                  </button>
                )}
              </div>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Cities</option>
                
                {/* Nearby city (if available) */}
                {nearbyCity && (
                  <option value={nearbyCity}>{nearbyCity} (Near Me)</option>
                )}
                
                {/* Popular cities from events */}
                {popularCities.length > 0 && (
                  <optgroup label="Popular Cities">
                    {popularCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </optgroup>
                )}
                
                {/* World cities */}
                {allCities.length > 0 && (
                  <optgroup label="Worldwide">
                    {allCities.map(({city, country}) => (
                      <option key={`${city}-${country}`} value={city}>{city}, {country}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Price Filter (replacing category dropdown) */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                <IndianRupee className="w-4 h-4 inline mr-1" /> Price
              </label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="all">All Events</option>
                <option value="free">Free Only</option>
                <option value="paid">Paid Only</option>
              </select>
            </div>
          </div>

          {/* User location and get nearby events button */}
          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={getUserLocation}
              className={`flex items-center gap-2 px-4 py-2 ${loadingLocation ? 'bg-gray-300' : 'bg-indigo-100'} text-indigo-800 rounded-lg hover:bg-indigo-200 transition-all`}
              disabled={loadingLocation}
            >
              <Compass className="w-4 h-4" />
              {loadingLocation ? 'Detecting location...' : userLocation ? 'Refresh location' : 'Use my location'}
            </button>
            
            {selectedCity !== 'all' && selectedCity !== nearbyCity && (
              <button
                onClick={() => setSelectedCity('all')}
                className="text-sm text-gray-500 hover:text-gray-800"
              >
                Clear city filter
              </button>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Showing <strong>{filteredEvents.length}</strong> of <strong>{events.length}</strong> events
            </p>
          </div>
        </div>

        {/* Category Cards Section - Simple Icon Style (Image 1) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Browse by Category</h2>
          <div className="flex gap-8 overflow-x-auto pb-4 justify-center px-4">
            {categoryCards.map((card, index) => (
              <div
                key={index}
                onClick={() => setSelectedCategory(card.name)}
                className={`flex flex-col items-center gap-3 cursor-pointer transition-all duration-300 ${
                  selectedCategory === card.name
                    ? 'scale-110'
                    : 'hover:scale-105 opacity-70 hover:opacity-100'
                }`}
              >
                {/* Icon Circle */}
                <div className={`w-20 h-20 rounded-full bg-white border-2 flex items-center justify-center text-3xl shadow-md ${
                  selectedCategory === card.name
                    ? 'border-indigo-500 shadow-lg'
                    : 'border-gray-200'
                }`}>
                  {card.image}
                </div>
                
                {/* Category Name */}
                <span className={`text-sm font-medium text-center max-w-[100px] leading-tight ${
                  selectedCategory === card.name
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-700'
                }`}>
                  {card.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-96 rounded-xl border animate-pulse bg-white" />
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCity !== 'all' || selectedCategory !== 'all' || priceFilter !== 'all'
                ? 'Try adjusting your filters to find more events'
                : 'No live events available at the moment'}
            </p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCity('all')
                setSelectedCategory('all')
                setPriceFilter('all')
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="group bg-white rounded-xl border overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Event Banner Image - Top Section */}
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                  {event.bannerUrl ? (
                    <img
                      src={event.bannerUrl}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-20 h-20 text-indigo-300" />
                    </div>
                  )}
                </div>

                {/* Event Details - Bottom Section */}
                <div className="p-5">
                  {/* Event Name - Title */}
                  <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">
                    {event.name}
                  </h3>
                  
                  {/* Event Details in a clean layout with icons */}
                  <div className="flex flex-col space-y-3 mb-4">
                    {/* Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        {new Date(event.startsAt).toLocaleDateString('en-IN', { 
                          weekday: 'short',
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        {new Date(event.startsAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                    
                    {/* Duration - Calculate from start/end time */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">
                        {Math.round((new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / (1000 * 60))} minutes
                      </span>
                    </div>
                    
                    {/* Age Limit */}
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">Age Limit - All ages</span>
                    </div>
                    
                    {/* Language */}
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center text-gray-500">🗣️</span>
                      <span className="text-gray-700">English</span>
                    </div>
                    
                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center text-gray-500">🎭</span>
                      <span className="text-gray-700">{event.category}</span>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-700">{event.venue}: {event.city}</span>
                    </div>
                  </div>
                  
                  {/* Alert Message */}
                  <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 flex items-center justify-center text-yellow-700">ℹ️</span>
                      <span className="text-sm text-yellow-800">Bookings are filling fast for {event.city}</span>
                    </div>
                  </div>
                  
                  {/* Price and Buttons */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <IndianRupee className="w-5 h-5 text-gray-800" />
                          <span className="text-2xl font-bold">
                            {event.priceInr && event.priceInr > 0 ? event.priceInr : 'FREE'}
                          </span>
                        </div>
                        <p className="text-orange-500 text-sm font-medium">Filling Fast</p>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRegister(event.id)
                        }}
                        className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-semibold rounded-lg"
                      >
                        Register
                      </button>
                    </div>
                    
                    {/* I'm Interested Button */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          const res = await fetch(`/api/events/${event.id}/rsvp-interest`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            // 'I'm Interested' maps to MAYBE for RSVP interests
                            body: JSON.stringify({ responseType: 'MAYBE' })
                          })
                          if (res.ok) {
                            toast({
                              title: "Interest Recorded!",
                              description: "We'll keep you updated about this event.",
                            })
                          }
                        } catch (error) {
                          console.error('Error recording interest:', error)
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg border border-blue-200 flex items-center justify-center gap-2"
                    >
                      💙 I'm Interested
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">How to Register</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
              <li>Click on any event card to view full details</li>
              <li>Click "Register" to start the registration process</li>
              <li>Select your seats from the interactive floor plan (if available)</li>
              <li>Fill in your attendee details and apply promo codes (optional)</li>
              <li>Choose payment method (Dummy payment for testing)</li>
              <li>After successful registration, you'll receive a QR code</li>
              <li>Show the QR code at the event entrance for check-in</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  )
}
