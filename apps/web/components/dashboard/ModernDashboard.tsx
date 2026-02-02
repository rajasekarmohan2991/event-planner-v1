"use client"

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Calendar, Users, Ticket, TrendingUp, Plus, Sparkles, 
  MapPin, Clock, Star, Award, PartyPopper, Zap 
} from 'lucide-react'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalRegistrations: number
  upcomingEvents: number
  totalRevenue?: number
  attendanceRate?: number
}

interface Event {
  id: string
  name: string
  startsAt: string
  status: string
  registrationCount: number
  city: string
  venue: string
}

export default function ModernDashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    upcomingEvents: 0,
  })
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, eventsRes] = await Promise.all([
          fetch('/api/dashboard/stats', { cache: 'no-store' }),
          fetch('/api/events?status=LIVE&limit=4', { cache: 'no-store' })
        ])

        if (statsRes.ok) {
          const statsData = await statsRes.json()
          setStats(statsData)
        }

        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setRecentEvents(eventsData.events || eventsData || [])
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-celebration-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-energy-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="animate-slide-up">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-energy-500 animate-pulse-soft" />
              <h1 className="text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-brand-600 to-celebration-600 bg-clip-text text-transparent">
                Welcome back, {(session as any)?.user?.name || 'Event Planner'}!
              </h1>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Let's create something amazing today ✨
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Total Events */}
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-brand transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-brand-100 dark:border-brand-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl shadow-brand">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 rounded-full">
                  <TrendingUp className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Events</p>
                <p className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
                  {stats.totalEvents}
                </p>
              </div>
            </div>
          </div>

          {/* Active Events */}
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-celebration transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-celebration-100 dark:border-celebration-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-celebration-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-celebration-500 to-celebration-600 rounded-xl shadow-celebration">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 bg-celebration-50 dark:bg-celebration-900/30 rounded-full">
                  <span className="text-xs font-semibold text-celebration-600 dark:text-celebration-400">LIVE</span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Events</p>
                <p className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
                  {stats.activeEvents}
                </p>
              </div>
            </div>
          </div>

          {/* Total Registrations */}
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-energy transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-energy-100 dark:border-energy-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-energy-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-energy-500 to-energy-600 rounded-xl shadow-energy">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 bg-energy-50 dark:bg-energy-900/30 rounded-full">
                  <Award className="w-4 h-4 text-energy-600 dark:text-energy-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Registrations</p>
                <p className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
                  {stats.totalRegistrations}
                </p>
              </div>
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-emerald-100 dark:border-emerald-900/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full">
                  <Star className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upcoming</p>
                <p className="text-3xl font-bold font-heading text-slate-900 dark:text-white">
                  {stats.upcomingEvents}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Create New Event CTA */}
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link href="/events/create">
            <div className="group relative bg-gradient-to-r from-brand-500 via-celebration-500 to-energy-500 rounded-2xl p-8 shadow-large hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden">
              {/* Animated Background */}
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center gap-3 mb-3 justify-center md:justify-start">
                    <PartyPopper className="w-8 h-8 text-white animate-bounce-soft" />
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-white">
                      Create Your Next Event
                    </h2>
                  </div>
                  <p className="text-white/90 text-lg">
                    Start planning something extraordinary. Your audience is waiting! 🎉
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <button className="group/btn px-8 py-4 bg-white text-brand-600 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center gap-3">
                    <Plus className="w-6 h-6 group-hover/btn:rotate-90 transition-transform duration-300" />
                    Create Event
                  </button>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Events */}
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
              Recent Events
            </h2>
            <Link href="/events" className="text-brand-600 dark:text-brand-400 font-semibold hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-2 group">
              View all
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft animate-pulse">
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : recentEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 shadow-soft text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
              <Calendar className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No events yet</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Create your first event to get started!</p>
              <Link href="/events/create">
                <button className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-semibold shadow-brand hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Create First Event
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentEvents.map((event, index) => (
                <Link key={event.id} href={`/events/${event.id}`}>
                  <div 
                    className="group bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-large transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-slate-100 dark:border-slate-700 animate-slide-up"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mb-2 line-clamp-1">
                          {event.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.city}, {event.venue}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(event.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'LIVE' 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                          {event.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{event.registrationCount} registered</span>
                      </div>
                      <div className="text-brand-600 dark:text-brand-400 font-semibold text-sm group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        View details
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
