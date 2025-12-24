"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, Users, FileText, Plus, BarChart3, Mail, Settings } from 'lucide-react'
import Link from 'next/link'
import { RouteProtection } from '@/components/RoleBasedNavigation'

interface Event {
  id: string
  name: string
  description: string
  startsAt: string
  status: string
  registrationCount: number
  venue: string
  city: string
}

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  upcomingEvents: number
}

export default function OrganizerDashboard() {
  const { data: session } = useSession()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(1234)

  const handleFollow = () => {
    setIsFollowing(!isFollowing)
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1)
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch organizer's events with live statistics
        const eventsRes = await fetch('/api/events?status=LIVE&includeStats=true', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          const events = eventsData.events || eventsData || []
          setMyEvents(events)

          // Calculate stats from live data
          const now = new Date()
          const totalRegistrations = events.reduce((sum: number, event: Event) =>
            sum + (event.registrationCount || 0), 0)

          setStats({
            totalEvents: events.length,
            activeEvents: events.filter((e: Event) => e.status === 'LIVE').length,
            totalRegistrations,
            upcomingEvents: events.filter((e: Event) => new Date(e.startsAt) > now).length
          })
        }

        // Also fetch real-time stats
        const statsRes = await fetch('/api/dashboard/stats', {
          credentials: 'include',
          cache: 'no-store'
        })
        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(prev => ({ ...prev, ...statsData }))
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchDashboardData()
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchDashboardData, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  if (loading) {
    return <div className="p-6">Loading your organizer dashboard...</div>
  }

  return (
    <RouteProtection requiredRoles={['ORGANIZER']}>
      <div className="p-6 space-y-6">
        {/* Company Profile Header with Follow Button */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {(session as any)?.user?.companyName || (session as any)?.user?.name}
                </h1>
                <button
                  onClick={handleFollow}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                >
                  <Users className="w-4 h-4" />
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                Welcome back! Manage your events and engage with attendees.
              </p>

              {/* Company Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">{followerCount.toLocaleString()}</span>
                  <span className="text-gray-600">Followers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">{stats.totalEvents}</span>
                  <span className="text-gray-600">Events Hosted</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-gray-900">
                    {new Date().getFullYear() - 2020}
                  </span>
                  <span className="text-gray-600">Years in Business</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white to-blue-50/30 rounded-lg border border-blue-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-lg border border-green-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Events</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeEvents}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg border border-purple-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRegistrations}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-lg border border-orange-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-2xl font-bold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">My Events</h2>
            <div className="flex gap-2">
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
              <Link
                href="/events/my"
                className="text-sm text-purple-600 hover:text-purple-800 px-3 py-2"
              >
                View all
              </Link>
            </div>
          </div>

          {myEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">No events created yet</p>
              <p className="text-sm text-gray-500 mb-4">Start by creating your first event</p>
              <Link
                href="/events/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Plus className="w-4 h-4" />
                Create Your First Event
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {myEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">{event.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${event.status === 'LIVE'
                        ? 'bg-green-100 text-green-800'
                        : event.status === 'DRAFT'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                        }`}>
                        {event.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{event.venue}, {event.city}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{new Date(event.startsAt).toLocaleDateString()}</span>
                      <span>{event.registrationCount || 0} registrations</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/events/${event.id}/registrations`}
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="View Registrations"
                    >
                      <Users className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/events/${event.id}/analytics`}
                      className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"
                      title="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/events/${event.id}/communicate`}
                      className="p-2 text-gray-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                      title="Send Communications"
                    >
                      <Mail className="w-4 h-4" />
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage`}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50"
                      title="Manage Event"
                    >
                      <Settings className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips for Organizers */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Tips for Success</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-purple-100 rounded">
                <Calendar className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Plan Ahead</p>
                <p className="text-sm text-gray-600">Create events well in advance to maximize registrations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1 bg-purple-100 rounded">
                <Mail className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Engage Attendees</p>
                <p className="text-sm text-gray-600">Send regular updates and reminders to keep attendees engaged</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteProtection>
  )
}
