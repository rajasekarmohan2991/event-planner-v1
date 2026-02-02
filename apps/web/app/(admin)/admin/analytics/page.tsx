'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, RefreshCw } from 'lucide-react'

// Types
type AnalyticsData = {
  overview: {
    totalEvents: number
    totalRegistrations: number
    totalRevenue: number
    averageAttendance: number
  }
  trends: {
    eventsGrowth: number
    registrationsGrowth: number
    revenueGrowth: number
  }
  topEvents: Array<{
    id: string
    name: string
    registrations: number
    revenue: number
    date: string
  }>
  registrationsByMonth: Array<{
    month: string
    count: number
  }>
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Check authorization
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session || !['SUPER_ADMIN', 'ADMIN', 'EVENT_MANAGER'].includes(session.user?.role as string)) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  // Fetch analytics data
  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to load analytics')
        const data = await res.json()
        setAnalytics(data)
        setLastUpdated(new Date())
        setError(null)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    if (session) {
      // Initial load
      loadAnalytics()
      
      // Auto-refresh every 60 seconds
      let interval: NodeJS.Timeout
      if (autoRefresh) {
        interval = setInterval(() => {
          loadAnalytics()
        }, 60000)
      }
      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [session, autoRefresh])

  const manualRefresh = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/analytics', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load analytics')
      const data = await res.json()
      setAnalytics(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || (loading && !analytics)) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error && !analytics) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-600">Analytics data will appear here once events and registrations are created.</p>
        </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Real-time Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>{autoRefresh ? 'Live Updates' : 'Manual Mode'}</span>
            <span>• Last updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50"
            >
              {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
            </button>
            <button
              onClick={manualRefresh}
              disabled={loading}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalEvents}</p>
              <p className="text-xs text-green-600 mt-1">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +{analytics.trends.eventsGrowth}% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Registrations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalRegistrations}</p>
              <p className="text-xs text-green-600 mt-1">
                 +{analytics.trends.registrationsGrowth}% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.overview.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                 +{analytics.trends.revenueGrowth}% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Avg Attendance */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg. Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.overview.averageAttendance}%</p>
              <p className="text-xs text-gray-600 mt-1">
                Based on registrations vs capacity
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Top Performing Events</h3>
            <p className="text-sm text-gray-600">Events with highest registrations</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{event.registrations} registrations</p>
                    <p className="text-sm text-gray-600">₹{event.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Registration Trends */}
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Registration Trends</h3>
            <p className="text-sm text-gray-600">Monthly registration counts</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.registrationsByMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{item.month}</span>
                  <div className="flex-1 mx-4 bg-gray-100 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ 
                          width: `${Math.min((item.count / Math.max(...analytics.registrationsByMonth.map(r => r.count), 1)) * 100, 100)}%` 
                        }}
                      ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Performance Insights</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">
                {Math.round(analytics.overview.totalRegistrations / (analytics.overview.totalEvents || 1))}
              </div>
              <p className="text-sm text-gray-600">Average registrations per event</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                ₹{Math.round(analytics.overview.totalRevenue / (analytics.overview.totalEvents || 1)).toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">Average revenue per event</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{Math.round(analytics.overview.totalRevenue / (analytics.overview.totalRegistrations || 1))}
              </div>
              <p className="text-sm text-gray-600">Average revenue per registration</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
