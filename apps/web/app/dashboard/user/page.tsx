"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Ticket, TrendingUp, Star, ChevronRight, Play } from 'lucide-react'
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
}

const categories = [
  { name: 'Conferences', icon: '◈', color: 'from-sky-600 to-blue-700' },
  { name: 'Workshops', icon: '✦', color: 'from-purple-600 to-violet-700' },
  { name: 'Concerts', icon: '♫', color: 'from-fuchsia-600 to-pink-700' },
  { name: 'Sports', icon: '⚡', color: 'from-teal-600 to-emerald-700' },
  { name: 'Exhibitions', icon: '◆', color: 'from-orange-600 to-red-700' },
  { name: 'Networking', icon: '⬡', color: 'from-indigo-600 to-blue-700' },
]

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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

  const filteredEvents = selectedCategory
    ? upcomingEvents.filter(e => e.category === selectedCategory)
    : upcomingEvents

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
        <div className="relative h-[500px] bg-gradient-to-r from-pink-600 via-fuchsia-600 to-purple-600 overflow-hidden">
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
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
          {/* Categories */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Browse by Category</h2>
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-sm font-medium transition-colors ${selectedCategory === null ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                View All
              </button>
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
                    className={`group relative overflow-hidden rounded-2xl p-6 transition-all duration-500 hover:scale-110 hover:shadow-2xl hover:-translate-y-2 ${animations[index]} ${selectedCategory === category.name
                      ? 'ring-4 ring-pink-500 ring-offset-2 scale-105'
                      : ''
                      }`}
                    style={{
                      animationDelay: `${index * 150}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-6`}></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative z-10 text-center">
                      <div className="text-5xl mb-3 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-300 animate-icon-float">
                        {category.icon}
                      </div>
                      <p className="text-white font-semibold text-sm group-hover:text-base transition-all duration-300">{category.name}</p>
                    </div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-white/20 blur-xl"></div>
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
                  <Link
                    key={event.id}
                    href={`/events/${event.id}/register`}
                    className="group bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Event Image */}
                    <div className="relative h-48 bg-gradient-to-br from-teal-500 to-blue-600 overflow-hidden">
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
                          Book Now
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Trending Events Carousel */}
          {trendingEvents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-8 h-8 text-indigo-600" />
                <h2 className="text-3xl font-bold text-gray-900">Trending This Week</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendingEvents.slice(0, 2).map((event, index) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}/register`}
                    className="group relative bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="relative w-full md:w-1/2 h-64 bg-gradient-to-br from-rose-500 to-purple-600">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                        <div className="absolute top-4 left-4 bg-amber-500 px-4 py-2 rounded-full flex items-center gap-2">
                          <Star className="w-4 h-4 fill-yellow-700 text-yellow-700" />
                          <span className="text-sm font-bold text-yellow-900">Hot Event</span>
                        </div>
                      </div>

                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                            {event.name}
                          </h3>
                          <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className="font-medium">{new Date(event.startsAt).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                              })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-indigo-500" />
                              <span>{event.venue}, {event.city}</span>
                            </div>
                            {event.registrationCount && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" />
                                <span className="font-semibold">{event.registrationCount}+ people interested</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button className="mt-4 w-full bg-gradient-to-r from-teal-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-teal-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                          <Ticket className="w-5 h-5" />
                          Get Tickets Now
                        </button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Padding */}
        <div className="h-20"></div>
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
