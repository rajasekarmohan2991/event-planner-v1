"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Ticket, TrendingUp, Star, ChevronRight, Play, X, Heart, UserPlus, Building2, Mic2, Palette, Music, Zap, Image as ImageIcon, Network, Users2, Search, Filter, IndianRupee } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'
import Image from 'next/image'

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
}

const categories = [
  { name: 'Conferences', IconComponent: Mic2, color: 'from-sky-600 to-blue-700' },
  { name: 'Workshops', IconComponent: Palette, color: 'from-purple-600 to-violet-700' },
  { name: 'Concerts', IconComponent: Music, color: 'from-fuchsia-600 to-pink-700' },
  { name: 'Sports', IconComponent: Zap, color: 'from-teal-600 to-emerald-700' },
  { name: 'Exhibitions', IconComponent: ImageIcon, color: 'from-orange-600 to-red-700' },
  { name: 'Networking', IconComponent: Users2, color: 'from-indigo-600 to-blue-700' },
]

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isInterested, setIsInterested] = useState(false)
  const [isFollowing, setIsFollowing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')

  useEffect(() => {
    if (status === 'loading') return

    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events/public?limit=12', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const events = data.events || []
          setUpcomingEvents(events)
          // Simulate trending events (top 4 by registration count)
          setTrendingEvents(events.slice(0, 4))
        }
      } catch (error) {
        console.error('Error fetching events:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [status])

  const filteredEvents = upcomingEvents.filter(event => {
    if (selectedCategory && event.category !== selectedCategory) return false
    if (searchQuery && !event.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !event.description?.toLowerCase().includes(searchQuery.toLowerCase())) return false
    if (selectedCity !== 'all' && event.city !== selectedCity) return false
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading amazing events...</p>
        </div>
      </div>
    )
  }

  return (
    <RouteProtection requiredRoles={['USER']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Hero Banner */}
        <div className="relative h-[700px] bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItaDJWMzRoLTJ6bTAgNHYyaDJ2LTJoLTJ6bTAtOHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>

          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
                <TrendingUp className="w-4 h-4 text-white" />
                <span className="text-white text-sm font-medium">Trending Now</span>
              </div>

              <h1 className="text-6xl font-bold text-white mb-6 animate-slide-up">
                Discover Amazing
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-300 to-orange-300">
                  Events Near You
                </span>
              </h1>

              <p className="text-xl text-white/90 mb-8 animate-slide-up animation-delay-100">
                Book tickets for conferences, concerts, workshops, and more!
              </p>

              <div className="flex gap-4 animate-slide-up animation-delay-200">
                <Link
                  href="/events/browse"
                  className="group px-8 py-4 bg-white text-teal-700 rounded-full font-semibold hover:bg-amber-400 hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105 flex items-center gap-2"
                >
                  Explore Events
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/my-tickets"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold hover:bg-white/20 transition-all duration-300 border-2 border-white/30 flex items-center gap-2"
                >
                  <Ticket className="w-5 h-5" />
                  My Tickets
                </Link>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-pink-300/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>

          {/* Trending Events in Banner */}
          {trendingEvents.length > 0 && (
            <div className="absolute bottom-8 left-0 right-0 z-20">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center gap-3 mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">Trending This Week</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingEvents.slice(0, 2).map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}/register`}
                      className="group relative bg-white/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="flex flex-row h-40">
                        <div className="relative w-1/3 bg-gradient-to-br from-rose-500 to-purple-600">
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                          <div className="absolute top-3 left-3 bg-amber-500 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                            <Star className="w-3 h-3 fill-yellow-700 text-yellow-700" />
                            <span className="text-xs font-bold text-yellow-900">Hot Event</span>
                          </div>
                        </div>

                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                              {event.name}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1 mb-2">{event.description}</p>

                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-indigo-500" />
                                <span>{new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-indigo-500" />
                                <span>{event.city}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
          {/* Filter Events Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8 animate-slide-up">
            <div className="flex items-center gap-2 mb-6">
              <Filter className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-gray-900">Filter Events</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search Events
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all"
                />
              </div>

              {/* City Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white transition-all"
                >
                  <option value="all">All Cities</option>
                  {[...new Set(upcomingEvents.map(e => e.city))].map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  <IndianRupee className="w-4 h-4 inline mr-1" />
                  Price
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 bg-white transition-all"
                >
                  <option value="all">All Events</option>
                  <option value="free">Free Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <strong>{filteredEvents.length}</strong> of <strong>{upcomingEvents.length}</strong> events
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category, index) => {
                // Different animation for each category
                const animations = [
                  'animate-flip-in',      // Conferences - 3D flip
                  'animate-slide-in',     // Workshops - Slide from left
                  'animate-zoom-bounce',  // Concerts - Zoom with bounce
                  'animate-rotate-in',    // Sports - Rotate entrance
                  'animate-bounce-in',    // Exhibitions - Bounce from top
                  'animate-wave-in'       // Networking - Wave effect
                ];

                return (
                  <button
                    key={category.name}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:-translate-y-3 ${animations[index]} backdrop-blur-md bg-white/10 border border-white/20 ${selectedCategory === category.name
                      ? 'ring-4 ring-orange-400 ring-offset-2 scale-105 shadow-orange-300/50'
                      : ''
                      }`}
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    {/* Glassmorphism gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-110`}></div>

                    {/* Glass overlay */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

                    {/* Animated gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>

                    <div className="relative z-10 text-center">
                      <div className="mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 animate-icon-float flex items-center justify-center">
                        <category.IconComponent className="w-14 h-14 text-white drop-shadow-lg" strokeWidth={2.5} />
                      </div>
                      <p className="text-white font-bold text-base group-hover:text-lg transition-all duration-300 drop-shadow-md">{category.name}</p>
                    </div>

                    {/* Glow effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="absolute inset-0 bg-white/20 blur-2xl"></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommended Events */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold text-gray-900">
                {selectedCategory ? `${selectedCategory} Events` : 'Recommended Events'}
              </h2>
              <Link
                href="/events/browse"
                className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 group"
              >
                See All
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No events available in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredEvents.slice(0, 8).map((event, index) => (
                  <button
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in text-left"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Event Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-200">
                      {event.bannerUrl ? (
                        <Image
                          src={event.bannerUrl}
                          alt={event.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-blue-600" />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                        <span className="text-xs font-bold text-indigo-600">
                          {new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {event.registrationCount && event.registrationCount > 10 && (
                        <div className="absolute top-3 left-3 bg-yellow-400 px-3 py-1 rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-700 text-yellow-700" />
                          <span className="text-xs font-bold text-yellow-900">Trending</span>
                        </div>
                      )}
                    </div>

                    {/* Event Details */}
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {event.name}
                      </h3>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>{new Date(event.startsAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-indigo-500" />
                          <span className="line-clamp-1">{event.city}</span>
                        </div>
                        {event.registrationCount && (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />
                            <span>{event.registrationCount} attending</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <span className="text-sm font-semibold text-gray-900">From ₹500</span>
                        <span className="text-indigo-600 font-semibold text-sm group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          View Details
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Trending Events Carousel */}

        </div>

        {/* Bottom Padding */}
        <div className="h-20"></div>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedEvent(null)}>
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header with Image */}
              <div className="relative h-64 bg-gradient-to-br from-teal-500 to-blue-600">
                <div className="absolute inset-0 bg-black/30"></div>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
                <div className="absolute bottom-4 left-6 right-6">
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedEvent.name}</h2>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedEvent.startsAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Organizer Info */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Organized by</p>
                        <p className="font-bold text-gray-900">Event Masters Inc.</p>
                        <p className="text-xs text-gray-500">24 events hosted</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsFollowing(!isFollowing)}
                      className={`px-4 py-2 rounded-full font-semibold transition-all duration-300 flex items-center gap-2 ${isFollowing
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      {isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                </div>

                {/* Event Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-xl">
                    <Users className="w-6 h-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{selectedEvent.registrationCount || 0}</p>
                    <p className="text-xs text-gray-600">Attending</p>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-xl">
                    <Heart className="w-6 h-6 mx-auto text-pink-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">1.2k</p>
                    <p className="text-xs text-gray-600">Interested</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-xl">
                    <Star className="w-6 h-6 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold text-gray-900">4.8</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                </div>

                {/* Event Description */}
                <div className="mb-6">
                  <h3 className="font-bold text-gray-900 mb-2">About This Event</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedEvent.description || 'Join us for an amazing event experience! This event brings together industry leaders, innovators, and enthusiasts for an unforgettable experience.'}
                  </p>
                </div>

                {/* Event Details */}
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold text-gray-900 mb-3">Event Details</h3>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedEvent.startsAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{selectedEvent.venue}, {selectedEvent.city}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Ticket className="w-5 h-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-900">Ticket Price</p>
                      <p className="text-sm text-gray-600">Starting from ₹500</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsInterested(!isInterested)}
                    className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${isInterested
                      ? 'bg-pink-100 text-pink-700 hover:bg-pink-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    <Heart className={`w-5 h-5 ${isInterested ? 'fill-pink-700' : ''}`} />
                    {isInterested ? 'Interested' : "I'm Interested"}
                  </button>
                  <Link
                    href={`/events/${selectedEvent.id}/register`}
                    className="flex-1 bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-5 h-5" />
                    Book Tickets
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
        }

        .animation-delay-100 {
          animation-delay: 100ms;
        }

        .animation-delay-200 {
          animation-delay: 200ms;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        /* Shimmer animation for glassmorphism */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        /* Unique animations for each category */
        
        /* 1. Flip In - 3D flip effect */
        @keyframes flip-in {
          from {
            opacity: 0;
            transform: perspective(1000px) rotateY(-90deg);
          }
          to {
            opacity: 1;
            transform: perspective(1000px) rotateY(0deg);
          }
        }

        /* 2. Slide In - Slide from left */
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* 3. Zoom Bounce - Zoom in with bounce */
        @keyframes zoom-bounce {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          50% {
            transform: scale(1.15);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        /* 4. Rotate In - Spinning entrance */
        @keyframes rotate-in {
          from {
            opacity: 0;
            transform: rotate(-180deg) scale(0.5);
          }
          to {
            opacity: 1;
            transform: rotate(0deg) scale(1);
          }
        }

        /* 5. Bounce In - Drop from top */
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translateY(-100px);
          }
          60% {
            transform: translateY(10px);
          }
          80% {
            transform: translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* 6. Wave In - Wave effect */
        @keyframes wave-in {
          0% {
            opacity: 0;
            transform: translateY(30px) rotate(-10deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
        }

        /* Icon Float - Gentle floating */
        @keyframes icon-float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* Apply animations */
        .animate-flip-in {
          animation: flip-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-slide-in {
          animation: slide-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-zoom-bounce {
          animation: zoom-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-rotate-in {
          animation: rotate-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-wave-in {
          animation: wave-in 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-icon-float {
          animation: icon-float 3s ease-in-out infinite;
        }
      `}</style>
    </RouteProtection>
  )
}
