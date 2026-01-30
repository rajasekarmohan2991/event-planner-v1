"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Calendar, Users, FileText, Plus, BarChart3, Mail, Settings, TrendingUp, Zap, Activity, Eye, Radio } from 'lucide-react'
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
  liveEvents: number
  totalRegistrations: number
  upcomingEvents: number
}

export default function OrganizerDashboard() {
  const { data: session } = useSession()
  const [myEvents, setMyEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    liveEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch organizer's events with live statistics
        const eventsRes = await fetch('/api/events?includeStats=true', {
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
            liveEvents: events.filter((e: Event) => e.status === 'LIVE').length,
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <RouteProtection requiredRoles={['ORGANIZER']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Header Section */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                  Welcome back, <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{(session as any)?.user?.name?.split(' ')[0]}</span>! 👋
                </h1>
                <p className="text-slate-600 font-medium">Here's what's happening with your events today.</p>
              </div>
              <Link
                href="/events/new"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </div>
          </div>

          {/* Stats Cards - Modern Glassmorphism Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

            {/* Live Events Card */}
            <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-purple-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30">
                    <Radio className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-bold">LIVE</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Live Events</h3>
                <p className="text-4xl font-black text-slate-900 mb-1">{stats.liveEvents}</p>
                <p className="text-xs text-slate-500 font-medium">Currently active</p>
              </div>
            </div>

            {/* Team Members Card */}
            <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Team Members</h3>
                <p className="text-4xl font-black text-slate-900 mb-1">1</p>
                <p className="text-xs text-slate-500 font-medium">Active team size</p>
              </div>
            </div>

            {/* Total Registrations Card */}
            <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-blue-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Total Registrations</h3>
                <p className="text-4xl font-black text-slate-900 mb-1">{stats.totalRegistrations}</p>
                <p className="text-xs text-slate-500 font-medium">All registrations</p>
              </div>
            </div>

            {/* Upcoming Events Card */}
            <div className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-orange-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full blur-2xl"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg shadow-orange-500/30">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">Upcoming</h3>
                <p className="text-4xl font-black text-slate-900 mb-1">{stats.upcomingEvents}</p>
                <p className="text-xs text-slate-500 font-medium">Scheduled events</p>
              </div>
            </div>
          </div>

          {/* Your Events Section */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Your Events</h2>
                <p className="text-slate-600 text-sm font-medium">Manage and track your events</p>
              </div>
              <Link
                href="/events/my"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-bold text-sm transition-colors"
              >
                View All
                <Eye className="w-4 h-4" />
              </Link>
            </div>

            {myEvents.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No events created yet</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">Start by creating your first event and watch your audience grow!</p>
                <Link
                  href="/events/new"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Event
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="group relative overflow-hidden bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-slate-900 text-lg truncate">{event.name}</h3>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full ${event.status === 'LIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : event.status === 'DRAFT'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                            {event.status === 'LIVE' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>}
                            {event.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3 font-medium">{event.venue}, {event.city}</p>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span className="font-medium">{new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-500">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">{event.registrationCount || 0} attendees</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/events/${event.id}/registrations`}
                          className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="View Registrations"
                        >
                          <Users className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/events/${event.id}/analytics`}
                          className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                          title="View Analytics"
                        >
                          <BarChart3 className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/events/${event.id}/communicate`}
                          className="p-3 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                          title="Send Communications"
                        >
                          <Mail className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/events/${event.id}/manage`}
                          className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                          title="Manage Event"
                        >
                          <Settings className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Featured App Highlights */}
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <h2 className="text-lg font-black text-slate-900">Featured App Highlights</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/events/my" className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg shadow-purple-500/30">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Events</h3>
                <p className="text-sm text-slate-600 font-medium">Manage events, tickets, and registrations</p>
              </Link>

              <Link href="/dashboard/organizer/analytics" className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Analytics</h3>
                <p className="text-sm text-slate-600 font-medium">Track performance and insights</p>
              </Link>

              <Link href="/dashboard/organizer/team" className="group relative overflow-hidden bg-white/80 backdrop-blur-xl border border-slate-200 rounded-2xl p-6 hover:border-purple-300 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg shadow-emerald-500/30">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                    ACTIVE
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Team</h3>
                <p className="text-sm text-slate-600 font-medium">Collaborate with your team members</p>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </RouteProtection>
  )
}
