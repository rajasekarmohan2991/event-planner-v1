'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Calendar, MapPin, Users, Ticket, Search, Filter, TrendingUp, Star, Clock, IndianRupee, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'
import Image from 'next/image'
import { useLocationDetection } from '@/hooks/useLocationDetection'
import { BannerCarousel } from '@/components/user/BannerCarousel'

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

          <div className="relative z-20">
            {/* Search and Filters */}
            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-rose-100/50 border border-rose-50 p-8 mb-16">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-rose-50 rounded-2xl">
                  <Filter className="w-6 h-6 text-rose-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900">
                  Find Events
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Search
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Event name..."
                      className="w-full px-6 py-4 pl-12 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 transition-all bg-slate-50/50 hover:bg-white text-slate-700 font-medium placeholder:text-slate-400"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                    City
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <select
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full px-6 py-4 pl-12 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 bg-slate-50/50 hover:bg-white transition-all text-slate-700 font-medium appearance-none cursor-pointer"
                    >
                      <option value="all">All Cities</option>
                      {[...new Set(upcomingEvents.map(e => e.city))].filter(Boolean).map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Price
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <select
                      value={priceFilter}
                      onChange={(e) => setPriceFilter(e.target.value)}
                      className="w-full px-6 py-4 pl-12 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-100 focus:border-rose-400 bg-slate-50/50 hover:bg-white transition-all text-slate-700 font-medium appearance-none cursor-pointer"
                    >
                      <option value="all">Any Price</option>
                      <option value="free">Free Events</option>
                      <option value="paid">Paid Events</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Found <strong className="text-rose-600">{filteredEvents.length}</strong> events
                </p>
                {(searchQuery || selectedCity !== 'all' || priceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setSelectedCity('all')
                      setPriceFilter('all')
                      setSelectedCategory(null)
                    }}
                    className="text-sm text-rose-600 hover:text-rose-700 font-bold bg-rose-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

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
                  {selectedCategory ? `${categories.find(c => c.id === selectedCategory)?.name}` : 'Upcoming Events'}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredEvents.map(event => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="group bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:shadow-rose-100/50 transition-all duration-500 overflow-hidden border border-slate-100 hover:border-rose-100 hover:-translate-y-2"
                    >
                      <div className="relative h-64 bg-slate-100 overflow-hidden">
                        {event.bannerUrl ? (
                          <Image
                            src={event.bannerUrl}
                            alt={event.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-rose-50">
                            <Sparkles className="w-12 h-12 text-rose-200" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-900 shadow-sm">
                            {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        {event.category && (
                          <div className="absolute bottom-4 left-4 z-10">
                            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white border border-white/10">
                              {event.category}
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>

                      <div className="p-6">
                        <h3 className="font-bold text-xl mb-3 text-slate-900 group-hover:text-rose-600 transition-colors line-clamp-2 leading-tight">
                          {event.name}
                        </h3>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-slate-500 font-medium">
                            <Calendar className="w-4 h-4 mr-2.5 text-rose-400" />
                            {new Date(event.startsAt).toLocaleDateString('en-US', { weekday: 'long' })}
                          </div>

                          {event.city && (
                            <div className="flex items-center text-sm text-slate-500 font-medium">
                              <MapPin className="w-4 h-4 mr-2.5 text-purple-400" />
                              {event.city}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                          <div className="flex items-center text-lg font-black text-slate-900">
                            {event.priceInr && event.priceInr > 0 ? (
                              <>
                                <span className="text-xs text-slate-400 font-bold mr-1 self-start mt-1">₹</span>
                                {event.priceInr}
                              </>
                            ) : (
                              <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded-lg">Free</span>
                            )}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-rose-500 group-hover:text-white transition-all duration-300">
                            <TrendingUp className="w-4 h-4" />
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
      </div>
    </RouteProtection>
  )
}
