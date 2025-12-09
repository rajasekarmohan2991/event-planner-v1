"use client"
import { useEffect, useState } from 'react'
import { BarChart3, Users, Calendar, DollarSign, TrendingUp } from 'lucide-react'

export default function TenantAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    totalRevenue: 0,
    totalMembers: 0
  })
  const [monthlyData, setMonthlyData] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const res = await fetch('/api/tenant/analytics')
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
        setMonthlyData(data.monthlyData || [])
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading analytics...</div>

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Usage Analytics</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <Calendar className="w-8 h-8 text-blue-600 mb-2" />
          <div className="text-2xl font-bold">{analytics.totalEvents}</div>
          <div className="text-sm text-gray-600">Total Events</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <Users className="w-8 h-8 text-green-600 mb-2" />
          <div className="text-2xl font-bold">{analytics.totalRegistrations}</div>
          <div className="text-sm text-gray-600">Registrations</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
          <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Revenue</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
          <div className="text-2xl font-bold">{analytics.totalMembers}</div>
          <div className="text-sm text-gray-600">Team Members</div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Monthly Registration Trends
        </h2>
        <div className="space-y-2">
          {monthlyData.map((item: any) => (
            <div key={item.month} className="flex items-center gap-4">
              <div className="w-24 text-sm font-medium">{item.month}</div>
              <div className="flex-1 bg-gray-200 rounded-full h-6">
                <div className="bg-blue-600 h-6 rounded-full flex items-center justify-end px-2 text-white text-xs"
                  style={{ width: `${Math.min(100, (item.registrations / Math.max(...monthlyData.map((d: any) => d.registrations))) * 100)}%` }}>
                  {item.registrations}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
