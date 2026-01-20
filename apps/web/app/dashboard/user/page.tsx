'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Users, Ticket, Search, Filter, TrendingUp, Star, Clock, IndianRupee, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'
import Image from 'next/image'
import { useLocationDetection } from '@/hooks/useLocationDetection'

interface Event {
  id: string
  name: string
  description: string
  startsAt: string
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
        const apiUrl = '/api/events/public?limit=50'

        console.log('🎫 [USER DASHBOARD] Fetching all events (no city filter)')
        console.log('🎫 [USER DASHBOARD] API URL:', apiUrl)

        const res = await fetch(apiUrl, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          console.log('🎫 [USER DASHBOARD] API Response:', data)
          const events = data.events || []
          console.log('🎫 [USER DASHBOARD] Events count:', events.length)
          console.log('🎫 [USER DASHBOARD] Total in DB:', data.debug?.totalInDb)
          setUpcomingEvents(events)
          setTrendingEvents(events.slice(0, 4))
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
      event.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = !selectedCategory || selectedCategory === 'all' || event.category === selectedCategory

    const matchesCity = selectedCity === 'all' || event.city === selectedCity

    const matchesPrice =
      priceFilter === 'all' ||
      (priceFilter === 'free' && (!event.priceInr || event.priceInr === 0)) ||
      (priceFilter === 'paid' && event.priceInr && event.priceInr > 0)

    return matchesSearch && matchesCategory && matchesCity && matchesPrice
  })

  if (loading) {
    return (
      <RouteProtection allowedRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
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
    <RouteProtection allowedRoles={['USER', 'ADMIN', 'SUPER_ADMIN']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

          <div className="relative max-w-7xl mx-auto px-6 py-20">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-6">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-white font-semibold">Welcome back, {session?.user?.name}!</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                Discover Amazing
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-pink-200">
                  Events Near You
                </span>
              </h1>

              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Book tickets for conferences, concerts, workshops, and more!
              </p>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/dashboard/user/tickets" className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Ticket className="w-5 h-5" />
                  My Tickets
                </Link>
                <button className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md text-white border-2 border-white/30 px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all">
                  <TrendingUp className="w-5 h-5" />
                  Trending Now
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">

          {/* Search and Filter Section */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl">
                <Filter className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Filter Events
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  Search Events
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or description..."
                    className="w-full px-4 py-3.5 pl-11 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all bg-white shadow-sm"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white transition-all shadow-sm"
                >
                  <option value="all">All Cities</option>
                  {[...new Set(upcomingEvents.map(e => e.city))].filter(Boolean).map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-semibold mb-3 text-gray-700">
                  Price
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white transition-all shadow-sm"
                >
                  <option value="all">All Events</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <strong className="text-purple-600">{filteredEvents.length}</strong> of <strong className="text-gray-900">{upcomingEvents.length}</strong> events
              </p>
              {(searchQuery || selectedCity !== 'all' || priceFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCity('all')
                    setPriceFilter('all')
                    setSelectedCategory(null)
                  }}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Browse by Category */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
                  className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 ${(selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                      ? `bg-gradient-to-br ${category.color} shadow-xl scale-105`
                      : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg'
                    }`}
                >
                  <div className="text-center">
                    <div className="text-4xl mb-2">{category.icon}</div>
                    <p className={`text-xs font-semibold ${(selectedCategory === category.id || (category.id === 'all' && !selectedCategory))
                        ? 'text-white'
                        : 'text-gray-700'
                      }`}>
                      {category.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Events Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name} Events` : 'All Events'}
              </h2>
              {filteredEvents.length > 0 && (
                <Link href="/events" className="text-purple-600 hover:text-purple-700 font-semibold flex items-center gap-2">
                  See All
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg mb-2">
                  {upcomingEvents.length === 0
                    ? 'No events available yet'
                    : 'No events match your filters'}
                </p>
                {upcomingEvents.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    Create your first event or check back later!
                  </p>
                )}
                {upcomingEvents.length > 0 && filteredEvents.length === 0 && (
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      setSearchQuery('')
                      setSelectedCity('all')
                    }}
                    className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredEvents.map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}/register`}
                    className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden hover:-translate-y-2"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400 overflow-hidden">
                      {event.bannerUrl ? (
                        <Image
                          src={event.bannerUrl}
                          alt={event.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-white/50" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-purple-600">
                          {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      {event.category && (
                        <div className="absolute bottom-4 left-4">
                          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
                            {event.category}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                        {event.name}
                      </h3>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                          {new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>

                        {event.city && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-pink-500" />
                            {event.city}
                          </div>
                        )}

                        {event.registrationCount !== undefined && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-blue-500" />
                            {event.registrationCount} attending
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-lg font-bold text-purple-600">
                          {event.priceInr && event.priceInr > 0 ? (
                            <>
                              <IndianRupee className="w-4 h-4" />
                              {event.priceInr}
                            </>
                          ) : (
                            <span className="text-green-600">FREE</span>
                          )}
                        </div>
                        <div className="text-sm text-purple-600 font-semibold group-hover:translate-x-1 transition-transform">
                          View Details →
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Bottom Padding */}
        <div className="h-20"></div>

      </div>
    </RouteProtection>
  )
}
