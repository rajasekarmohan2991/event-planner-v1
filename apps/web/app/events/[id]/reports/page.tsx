"use client"
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import { toast } from '@/components/ui/use-toast'
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download } from 'lucide-react'

interface Stats {
  registrations: { total: number; checkedIn: number; pending: number }
  orders: { total: number; revenue: number }
  rsvp: { going: number; interested: number; notGoing: number }
  exhibitors: { total: number; booths: number }
}

interface TrendData {
  registrations: Array<{ date: string; count: number }>
  orders: Array<{ date: string; count: number; revenue: number }>
}

export default function EventReportsPage() {
  const { status } = useSession()
  const params = useParams<{ id: string }>()
  const eventId = String(params?.id || '')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trends, setTrends] = useState<TrendData | null>(null)
  const [granularity, setGranularity] = useState<'daily'|'weekly'>('daily')
  const [exporting, setExporting] = useState<string | null>(null)

  useEffect(() => {
    let aborted = false
    ;(async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          fetch(`/api/events/${eventId}/reports/stats`, { cache: 'no-store' }),
          fetch(`/api/events/${eventId}/reports/trends?granularity=${granularity}`, { cache: 'no-store' })
        ])
        if (!aborted) {
          if (statsRes.ok) setStats(await statsRes.json())
          if (trendsRes.ok) setTrends(await trendsRes.json())
        }
      } catch (e) {
        console.error('Failed to load reports:', e)
      } finally {
        if (!aborted) setLoading(false)
      }
    })()
    return () => { aborted = true }
  }, [eventId, granularity])

  const exportData = async (type: string, format: string = 'csv') => {
    try {
      setExporting(`${type}-${format}`)
      const res = await fetch(`/api/events/${eventId}/reports/export?type=${type}&format=${format}`)
      if (!res.ok) throw new Error('Export failed')
      
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${eventId}-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      toast({ title: 'Export completed' })
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Unable to export', variant: 'destructive' as any })
    } finally {
      setExporting(null)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-6 bg-gray-200 rounded w-32" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse h-24 bg-gray-200 rounded" />
          ))}
        </div>
        <div className="animate-pulse h-64 bg-gray-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
          <select 
            className="rounded-md border px-3 py-1.5 text-sm"
            value={granularity}
            onChange={e => setGranularity(e.target.value as any)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Registrations</span>
            </div>
            <div className="text-2xl font-bold">{stats.registrations.total}</div>
            <div className="text-xs text-muted-foreground">
              {stats.registrations.checkedIn} checked in, {stats.registrations.pending} pending
            </div>
          </div>
          
          <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
            <div className="text-2xl font-bold">₹{(stats.orders.revenue || 0).toLocaleString('en-IN')}</div>
            <div className="text-xs text-muted-foreground">{stats.orders.total} orders</div>
          </div>

          <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">RSVPs</span>
            </div>
            <div className="text-2xl font-bold">{stats.rsvp.going}</div>
            <div className="text-xs text-muted-foreground">
              {stats.rsvp.interested} interested, {stats.rsvp.notGoing} declined
            </div>
          </div>

          <div className="rounded-lg border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Exhibitors</span>
            </div>
            <div className="text-2xl font-bold">{stats.exhibitors.total}</div>
            <div className="text-xs text-muted-foreground">{stats.exhibitors.booths} booths</div>
          </div>
        </div>
      )}

      {/* Simple Trends Display */}
      {trends && (
        <div className="rounded-lg border p-4">
          <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends ({granularity})
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Registrations</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {trends.registrations.slice(-7).map(item => (
                  <div key={item.date} className="flex justify-between text-xs">
                    <span>{item.date}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Orders</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {trends.orders.slice(-7).map(item => (
                  <div key={item.date} className="flex justify-between text-xs">
                    <span>{item.date}</span>
                    <span className="font-medium">{item.count} (₹{item.revenue.toLocaleString('en-IN')})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Section */}
      <div className="rounded-lg border p-4">
        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </h2>
        <div className="grid md:grid-cols-4 gap-2">
          {['registrations', 'orders', 'rsvps', 'exhibitors'].map(type => (
            <button
              key={type}
              onClick={() => exportData(type, 'csv')}
              disabled={!!exporting}
              className={`px-3 py-2 text-sm rounded border transition-colors ${
                exporting === `${type}-csv` 
                  ? 'bg-indigo-100 text-indigo-700 animate-pulse' 
                  : 'hover:bg-slate-50'
              }`}
            >
              {exporting === `${type}-csv` ? 'Exporting...' : `Export ${type}`}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
