'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getEvents } from '@/lib/api/events'
import { Calendar, MapPin, Ticket, Users, Filter, ExternalLink, Loader2, Globe } from 'lucide-react'
import { eventbriteAPI, EVENTBRITE_CATEGORIES, CITY_COORDINATES } from '@/lib/eventbrite-api'
import PromoCodeBadge from '@/components/PromoCodeBadge'

export default function ExplorePage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<any[]>([])
  const [marketplaceEvents, setMarketplaceEvents] = useState<any[]>([])
  const [eventbriteEvents, setEventbriteEvents] = useState<any[]>([])
  const [selectedCity, setSelectedCity] = useState('Mumbai')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [showEventbrite, setShowEventbrite] = useState(true)
  const [showMarketplace, setShowMarketplace] = useState(true)
  const [eventbriteLoading, setEventbriteLoading] = useState(false)
  const [eventbriteError, setEventbriteError] = useState('')
  const router = useRouter()

  const currentUserId = useMemo(() => (session?.user as any)?.id || (session as any)?.userId || null, [session])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getEvents({ status: 'LIVE', limit: 12, sortBy: 'startsAt', sortDir: 'ASC' } as any)
        const all = res.events || []
        const filtered = currentUserId
          ? all.filter((e: any) => {
              const ownerId = e.organizerId || e.ownerId || e.createdBy || e?.organizer?.id
              return !ownerId || String(ownerId) !== String(currentUserId)
            })
          : all
        if (!cancelled) setEvents(filtered)
      } catch (error) {
        console.log('Local events fetch failed:', error)
        if (!cancelled) setEvents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [currentUserId, status])

  // Load marketplace events (all tenants)
  useEffect(() => {
    if (showMarketplace) {
      fetch('/api/marketplace/events?limit=20')
        .then(res => res.json())
        .then(data => setMarketplaceEvents(data.events || []))
        .catch(err => console.error('Marketplace fetch failed:', err))
    }
  }, [showMarketplace])

  // Load user's selected city
  useEffect(() => {
    fetch('/api/user/city')
      .then(res => res.json())
      .then(data => {
        if (data.city) {
          const firstCity = data.city.split(',')[0]
          setSelectedCity(firstCity)
        }
      })
      .catch(console.error)
  }, [])

  // Load Eventbrite events
  useEffect(() => {
    if (!showEventbrite) return

    const loadEventbriteEvents = async () => {
      setEventbriteLoading(true)
      setEventbriteError('')
      
      try {
        const coords = CITY_COORDINATES[selectedCity as keyof typeof CITY_COORDINATES]
        const options: any = {}
        
        if (selectedCategory !== 'all') {
          options.category = EVENTBRITE_CATEGORIES[selectedCategory as keyof typeof EVENTBRITE_CATEGORIES]
        }
        
        if (priceFilter !== 'all') {
          options.price = priceFilter
        }

        let fetchedEvents
        if (coords) {
          fetchedEvents = await eventbriteAPI.searchEventsByLocation(coords.lat, coords.lng, options)
        } else {
          fetchedEvents = await eventbriteAPI.searchEventsByCity(selectedCity, options)
        }
        
        setEventbriteEvents(fetchedEvents)
      } catch (error: any) {
        console.error('Eventbrite Error:', error)
        if (error.message.includes('401')) {
          setEventbriteError('Invalid Eventbrite API token. Please configure NEXT_PUBLIC_EVENTBRITE_TOKEN.')
        } else if (error.message.includes('429')) {
          setEventbriteError('Rate limit exceeded. Please wait a moment.')
        } else {
          setEventbriteError('Failed to load Eventbrite events.')
        }
        setEventbriteEvents([])
      } finally {
        setEventbriteLoading(false)
      }
    }

    loadEventbriteEvents()
  }, [selectedCity, selectedCategory, priceFilter, showEventbrite])

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Browse Events
        </h1>
        <p className="text-muted-foreground mt-2">Discover amazing events in your city from multiple sources</p>
      </div>

      {/* Filters Section */}
      <div className="mb-8 p-6 bg-white rounded-xl border shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-lg">Filter Events</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">📍 City</label>
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
              <option value="Ahmedabad">Ahmedabad</option>
              <option value="Navi Mumbai">Navi Mumbai</option>
              <option value="Chandigarh">Chandigarh</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">🎭 Category</label>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
            >
              <option value="all">All Categories</option>
              <option value="music">🎵 Music</option>
              <option value="business">💼 Business & Corporate</option>
              <option value="food_and_drink">🍽️ Food & Drink</option>
              <option value="community">👥 Community</option>
              <option value="arts">🎨 Arts</option>
              <option value="sports">⚽ Sports</option>
              <option value="health">💪 Health</option>
              <option value="science_and_tech">🔬 Science & Tech</option>
              <option value="family">👨‍👩‍👧 Family</option>
              <option value="education">📚 Education</option>
              <option value="fashion">👗 Fashion</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">💰 Price</label>
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

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">🔗 Source</label>
            <label className="flex items-center gap-3 px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input 
                type="checkbox" 
                checked={showEventbrite}
                onChange={(e) => setShowEventbrite(e.target.checked)}
                className="w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium">Eventbrite Events</span>
            </label>
          </div>
        </div>
      </div>

      {/* Your Local Events Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Your Platform Events</span>
          <span className="text-sm font-normal text-gray-500">({events.length})</span>
        </h2>
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 rounded-xl border animate-pulse bg-slate-50" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="rounded-xl border p-8 text-center bg-gray-50">
            <p className="text-gray-600">No local events available right now.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((e: any) => (
              <div key={e.id} className="group rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-all duration-300">
                <div className="h-48 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                  <lottie-player autoplay loop mode="normal" background="transparent" src="https://assets6.lottiefiles.com/packages/lf20_j1adxtyb.json" style={{ width: 240, height: 160 }} />
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg line-clamp-2" title={e.name}>{e.name || 'Untitled Event'}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap">LIVE</span>
                      <PromoCodeBadge eventId={e.id} />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                      <span>{new Date(e.startsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <span>{e.city || 'TBA'}</span>
                    </div>
                  </div>
                  <div className="pt-3 flex items-center gap-3">
                    <button
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                      onClick={() => router.push(`/events/${e.id}/attend`)}
                    >
                      <Ticket className="h-4 w-4" /> Register
                    </button>
                    <Link
                      href={`/events/${e.id}/public`}
                      className="px-4 py-2.5 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Eventbrite Events Section */}
      {showEventbrite && (
        <div>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">Eventbrite Events in {selectedCity}</span>
            <span className="text-sm font-normal text-gray-500">({eventbriteEvents.length})</span>
          </h2>

          {eventbriteError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium mb-2">{eventbriteError}</p>
              {eventbriteError.includes('token') && (
                <div className="text-sm text-red-600 space-y-1">
                  <p>To enable Eventbrite events:</p>
                  <ol className="list-decimal ml-5 space-y-1">
                    <li>Get your token at: <a href="https://www.eventbrite.com/account-settings/apps" target="_blank" rel="noopener noreferrer" className="underline">eventbrite.com/account-settings/apps</a></li>
                    <li>Add to .env.local: <code className="bg-red-100 px-1 rounded">NEXT_PUBLIC_EVENTBRITE_TOKEN=your_token</code></li>
                    <li>Restart the application</li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {eventbriteLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-96 rounded-xl border animate-pulse bg-slate-50" />
              ))}
            </div>
          ) : eventbriteEvents.length === 0 ? (
            <div className="rounded-xl border p-8 text-center bg-gray-50">
              <p className="text-gray-600">No Eventbrite events found for the selected filters.</p>
              <p className="text-sm text-gray-500 mt-2">Try changing the city, category, or price filter.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventbriteEvents.map((event: any) => (
                <div key={event.id} className="group rounded-xl border bg-white overflow-hidden hover:shadow-lg transition-all duration-300">
                  {event.image ? (
                    <div className="h-48 overflow-hidden">
                      <img 
                        src={event.image} 
                        alt={event.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-orange-100 to-pink-100 flex items-center justify-center">
                      <Calendar className="h-16 w-16 text-orange-300" />
                    </div>
                  )}
                  
                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg line-clamp-2" title={event.name}>{event.name}</h3>
                      {event.isSoldOut && (
                        <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-medium whitespace-nowrap">SOLD OUT</span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span>{event.startDate} at {event.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-orange-600" />
                        <span className="line-clamp-1">{event.venue.name}</span>
                      </div>
                      {event.category && (
                        <div className="inline-block px-2.5 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-700">
                          {event.category}
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg text-green-600">{event.priceDisplay}</span>
                        {event.isOnline && (
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">Online</span>
                        )}
                      </div>
                      
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Eventbrite
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
