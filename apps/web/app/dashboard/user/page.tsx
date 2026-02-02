'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Users, Ticket, Search, Filter, TrendingUp, Star, Clock, IndianRupee, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'
import Image from 'next/image'
import { useLocationDetection } from '@/hooks/useLocationDetection'
import { BannerCarousel } from '@/components/user/BannerCarousel'
import ModernEventCard from '@/components/events/ModernEventCard'

interface Event {
  id: string
  name: string
  description: string
  startsAt: string
  endsAt?: string
  status?: string
  venue: string
  city: string
  registrationCount?: number
  category?: string
  imageUrl?: string
  bannerUrl?: string
  organizerName?: string
  organizerLogo?: string
  organizerEventsCount?: number
  tenantId?: string
  priceInr?: number
  eventMode?: string
}

const categories = [
  { id: 'all', name: 'All Events', icon: '🎯', color: 'from-purple-500 to-purple-600' },
  { id: 'Technology', name: 'Technology', icon: '💻', color: 'from-blue-500 to-blue-600' },
  { id: 'Business', name: 'Business', icon: '💼', color: 'from-gray-500 to-gray-600' },
  { id: 'Art', name: 'Art & Culture', icon: '🎨', color: 'from-pink-500 to-pink-600' },
  { id: 'Music', name: 'Music', icon: '🎵', color: 'from-green-500 to-green-600' },
  { id: 'Food', name: 'Food & Drink', icon: '🍔', color: 'from-orange-500 to-orange-600' },
  { id: 'Sports', name: 'Sports', icon: '⚽', color: 'from-indigo-500 to-indigo-600' },
  { id: 'Education', name: 'Education', icon: '📚', color: 'from-teal-500 to-teal-600' },
]

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const { location } = useLocationDetection()
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedCity, setSelectedCity] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')

  useEffect(() => {
    if (status === 'unauthenticated') return

    const fetchEvents = async () => {
      try {
        // 1. Fetch LIVE events for Carousel (Moving Bar)
        const carouselRes = await fetch('/api/events/public?status=LIVE&limit=5', { credentials: 'include' })
        let carouselEvents: Event[] = []
        if (carouselRes.ok) {
          const cData = await carouselRes.json()
          carouselEvents = cData.events || []
          setTrendingEvents(carouselEvents)
        }

        // 2. Fetch All Events for Grid
        const apiUrl = '/api/events/public?limit=50&status=PUBLISHED,LIVE'

        console.log('🎫 [USER DASHBOARD] Fetching events...')

        const res = await fetch(apiUrl, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          console.log('🎫 [USER DASHBOARD] API Response:', data)
          const events = data.events || []
          setUpcomingEvents(events)

          // Fallback: If no LIVE events found for carousel, use first few from main list
          if (carouselEvents.length === 0) {
            setTrendingEvents(events.slice(0, 4))
          }
        } else {
          console.error('🎫 [USER DASHBOARD] API error:', res.status, res.statusText)
        }
      } catch (error) {
        console.error('🎫 [USER DASHBOARD] Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [status])

  const filteredEvents = upcomingEvents.filter(event => {
    const matchesSearch = !searchQuery ||
      event.name && event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || selectedCategory === 'all' ||
      (event.category && event.category.toLowerCase() === selectedCategory.toLowerCase())

    const matchesCity = selectedCity === 'all' || event.city === selectedCity

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'free' && (!event.priceInr || event.priceInr === 0)) ||
      (priceFilter === 'paid' && event.priceInr && event.priceInr > 0)

    return matchesSearch && matchesCategory && matchesCity && matchesPrice
  })

  if (loading) {
    return (
      <RouteProtection requiredRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="animate-pulse space-y-8">
              <div className="h-64 bg-gradient-to-r from-slate-200 to-slate-300 rounded-3xl"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </RouteProtection>
    )
  }

  return (
    <RouteProtection requiredRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-gray-50/50">

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Welcome Message */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">{session?.user?.name}</span>! 👋
              </h1>
              <p className="text-slate-500 font-medium mt-1">Find your next amazing experience.</p>
            </div>
            <Link href="/dashboard/user/tickets" className="hidden md:inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
              <Ticket className="w-5 h-5 text-rose-500" />
              My Tickets
            </Link>
          </div>

          {/* Dynamic Banner Carousel */}
          <BannerCarousel events={trendingEvents} />

          {/* Compact Floating Search Bar */}
          <div className="relative z-30 -mt-8 px-4 mb-12">
            <div className="max-w-5xl mx-auto bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl shadow-rose-500/10 rounded-full p-2 flex flex-col md:flex-row items-center gap-2">

              {/* Search Input */}
              <div className="flex-[2] w-full md:w-auto relative px-2 hover:bg-slate-50 rounded-full transition-colors group">
                <Search className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform opacity-70" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search events, artists, or venues..."
                  className="w-full pl-12 pr-4 py-3 bg-transparent border-none focus:ring-0 text-slate-800 placeholder:text-slate-400 font-medium h-full"
                />
              </div>

              <div className="hidden md:block w-px h-8 bg-slate-200"></div>

              {/* City Selector */}
              <div className="flex-1 w-full md:w-auto relative px-2 hover:bg-slate-50 rounded-full transition-colors group">
                <MapPin className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform opacity-70" />
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full pl-12 pr-8 py-3 bg-transparent border-none focus:ring-0 text-slate-800 font-medium cursor-pointer appearance-none"
                >
                  <option value="all">All Cities</option>
                  {[...new Set(upcomingEvents.map(e => e.city))].filter(Boolean).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-slate-200"></div>

              {/* Price Filter */}
              <div className="flex-1 w-full md:w-auto relative px-2 hover:bg-slate-50 rounded-full transition-colors group">
                <IndianRupee className="w-5 h-5 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform opacity-70" />
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full pl-12 pr-8 py-3 bg-transparent border-none focus:ring-0 text-slate-800 font-medium cursor-pointer appearance-none"
                >
                  <option value="all">Any Price</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
                <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white rounded-full px-8 py-3 font-bold shadow-lg shadow-rose-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span className="md:hidden">Search</span>
              </button>
            </div>

            {/* Active Filters Summary */}
            {(searchQuery || selectedCity !== 'all' || priceFilter !== 'all') && (
              <div className="text-center mt-3 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('all')
                    setPriceFilter('all')
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full hover:bg-rose-100 transition-colors"
                >
                  Clear Filters ({filteredEvents.length} results)
                  <span className="ml-1 text-rose-400">×</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative z-20">
            {/* Browse by Category */}
            <div className="mb-16">
              <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-rose-500" />
                Explore Categories
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
                    className={`group relative overflow-hidden rounded-3xl p-6 transition-all duration-300 ${(selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                      ? `bg-gradient-to-br ${category.color} shadow-lg shadow-rose-200/50 scale-105 ring-4 ring-white`
                      : 'bg-white hover:bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md'
                      }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                      <p className={`text-xs font-bold uppercase tracking-wide ${(selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                        ? 'text-white'
                        : 'text-slate-600'
                        }`}>
                        {category.name.split(' ')[0]}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            <div className="mb-20" id="events-section">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900">
                  {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name}` : 'Explore Events'}
                </h2>
              </div>

              {filteredEvents.length === 0 ? (
                <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-16 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Calendar className="w-10 h-10 text-slate-300" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No events found</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                    We couldn't find any events matching your criteria. Try adjusting your filters.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchQuery('')
                      setSelectedCity('all')
                    }}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all hover:shadow-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-16">
                  {/* Segregation Logic */}
                  {(() => {
                    const now = new Date()
                    const isPast = (e: Event) => {
                      if (e.endsAt) return new Date(e.endsAt) < now
                      return new Date(e.startsAt) < now
                    }
                    const liveEvents = filteredEvents.filter(e => !isPast(e))
                    const pastEvents = filteredEvents.filter(e => isPast(e))

                    return (
                      <>
                        {liveEvents.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              Upcoming & Live
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                              {liveEvents.map(event => (
                                <ModernEventCard key={event.id} event={event} />
                              ))}
                            </div>
                          </div>
                        )}

                        {pastEvents.length > 0 && (
                          <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-400 flex items-center gap-2 border-t pt-8">
                              <Clock className="w-4 h-4" />
                              Past Events
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 opacity-80 hover:opacity-100 transition-opacity">
                              {pastEvents.map(event => (
                                <ModernEventCard key={event.id} event={event} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </div>

          </div>

          {/* Bottom Padding */}
          <div className="h-20"></div>

        </div>
      </div>
    </RouteProtection >
  )
}
