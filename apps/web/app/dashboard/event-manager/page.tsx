'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Calendar, Users, TrendingUp, BarChart3, Plus, Settings } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function EventManagerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalRegistrations: 0,
    activePromos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    const userRole = (session?.user as any)?.role
    if (status === 'authenticated' && userRole !== 'EVENT_MANAGER' && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    loadStats()
  }, [session, status, router])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard/stats', {
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalEvents: data.totalEvents || 0,
          upcomingEvents: data.upcomingEvents || 0,
          totalRegistrations: data.recentRegistrations || 0,
          activePromos: data.activePromos || 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage your events and track performance</p>
          </div>
          <Link
            href="/admin/events/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Events</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalEvents}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-green-50/30 rounded-lg shadow-sm border border-green-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.upcomingEvents}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-lg shadow-sm border border-purple-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Registrations</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalRegistrations}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50/30 rounded-lg shadow-sm border border-orange-100/50 p-6 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Promos</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activePromos}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/events"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-rose-500 hover:bg-rose-50 transition-all"
            >
              <Calendar className="w-8 h-8 text-rose-600 mb-2" />
              <h3 className="font-semibold">Manage Events</h3>
              <p className="text-sm text-gray-600 mt-1">View and edit all events</p>
            </Link>

            <Link
              href="/admin/settings/promo-codes"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
            >
              <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
              <h3 className="font-semibold">Promo Codes</h3>
              <p className="text-sm text-gray-600 mt-1">Create and manage discounts</p>
            </Link>

            <Link
              href="/registrations"
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
            >
              <Users className="w-8 h-8 text-purple-600 mb-2" />
              <h3 className="font-semibold">Ticket Sales</h3>
              <p className="text-sm text-gray-600 mt-1">View registrations and sales</p>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-4">Your Permissions</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>✅ View, Create, and Edit Events</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>✅ Manage Promo Codes</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>✅ View Analytics and Reports</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>✅ Send Communications</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>❌ User Management (Admin only)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>❌ Delete Events (Super Admin only)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
