"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, FileText, Search, Clock, MapPin, Users, Ticket } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'

interface Event {
  id: string
  name: string
  description: string
  startsAt: string
  venue: string
  city: string
  registrationCount?: number
}

interface Registration {
  id: string
  eventName: string
  status: string
  registeredAt: string
  eventDate: string
}

export default function UserDashboard() {
  const { data: session, status } = useSession()
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])
  const [myRegistrations, setMyRegistrations] = useState<Registration[]>([])
  const [myCreatedEvents, setMyCreatedEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      setLoading(false)
      return
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch upcoming public events
        const eventsRes = await fetch('/api/events/public?limit=6', {
          credentials: 'include'
        })
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setUpcomingEvents(eventsData.events || [])
        }

        // Fetch user's registrations
        const registrationsRes = await fetch('/api/registrations/my', {
          credentials: 'include'
        })
        if (registrationsRes.ok) {
          const registrationsData = await registrationsRes.json()
          setMyRegistrations(registrationsData.registrations || [])
        }

        // Fetch events created by me (including drafts)
        const myEventsRes = await fetch('/api/events?my=true', {
          credentials: 'include'
        })
        if (myEventsRes.ok) {
          const myEventsData = await myEventsRes.json()
          setMyCreatedEvents(myEventsData.events || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [session, status])

  if (loading) {
    return <div className="p-6">Loading your dashboard...</div>
  }

  return (
    <RouteProtection requiredRoles={['USER']}>
      <div className="p-6 space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {(session as any)?.user?.name || 'User'}!
          </h1>
          <p className="text-gray-600">
            Discover amazing events and manage your registrations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">My Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{myRegistrations.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {upcomingEvents.filter(event => {
                    const eventDate = new Date(event.startsAt)
                    const weekFromNow = new Date()
                    weekFromNow.setDate(weekFromNow.getDate() + 7)
                    return eventDate <= weekFromNow
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/events/browse"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
            >
              <Search className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Browse Events</p>
                <p className="text-sm text-gray-600">Discover new events to attend</p>
              </div>
            </Link>

            <Link
              href="/my-tickets"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <Ticket className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">My Tickets</p>
                <p className="text-sm text-gray-600">View and download your tickets</p>
              </div>
            </Link>

            <Link
              href="/registrations/my"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">My Registrations</p>
                <p className="text-sm text-gray-600">View and manage your registrations</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Events Organized by You */}
        {myCreatedEvents.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Events Organized by You</h2>
            </div>
            <div className="space-y-3">
              {myCreatedEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{event.name}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(event.startDate).toLocaleDateString()} • {event.location}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.status === 'LIVE' ? 'bg-green-100 text-green-800' :
                        event.status === 'DRAFT' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                          'bg-indigo-100 text-indigo-800'
                      }`}>
                      {event.status}
                    </span>
                    <div className="flex gap-3">
                      <Link href={`/events/${event.id}/edit`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                      <Link href={`/events/${event.id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Registrations */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Registrations</h2>
            <Link
              href="/registrations/my"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          {myRegistrations.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No registrations yet</p>
              <p className="text-sm text-gray-500">Start by browsing available events</p>
              <Link
                href="/events/browse"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Search className="w-4 h-4" />
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myRegistrations.slice(0, 3).map((registration) => (
                <div key={registration.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{registration.eventName}</p>
                    <p className="text-sm text-gray-600">
                      Registered on {new Date(registration.registeredAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${registration.status === 'CONFIRMED'
                      ? 'bg-green-100 text-green-800'
                      : registration.status === 'PENDING'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                      }`}>
                      {registration.status}
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(registration.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link
              href="/events/browse"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View all
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">No upcoming events available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.slice(0, 6).map((event) => (
                <div key={event.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <h3 className="font-medium text-gray-900 mb-2">{event.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue}, {event.city}</span>
                    </div>
                    {event.registrationCount && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{event.registrationCount} registered</span>
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/events/${event.id}/register`}
                    className="mt-4 w-full inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    Register Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RouteProtection>
  )
}
