"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TrendingUp, Users, DollarSign, CheckCircle, Activity } from 'lucide-react'

export default function EventAnalyticsPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<any>(null)
  const [regs, setRegs] = useState<Array<{ date: string; count: number }>>([])
  const [sales, setSales] = useState<Array<{ date: string; amountInr: number }>>([])
  const [audit, setAudit] = useState<Array<any>>([])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    ;(async () => {
      try {
        const [sumRes, regRes, saleRes, audRes] = await Promise.all([
          fetch(`/api/events/${id}/analytics/summary`, { cache: 'no-store' }),
          fetch(`/api/events/${id}/analytics/registrations-by-day?days=30`, { cache: 'no-store' }),
          fetch(`/api/events/${id}/analytics/sales-by-day?days=30`, { cache: 'no-store' }),
          fetch(`/api/events/${id}/audit/recent`, { cache: 'no-store' }),
        ])
        const [sumJ, regJ, saleJ, audJ] = await Promise.all([
          sumRes.ok ? sumRes.json() : null,
          regRes.ok ? regRes.json() : { items: [] },
          saleRes.ok ? saleRes.json() : { items: [] },
          audRes.ok ? audRes.json() : { items: [] },
        ])
        if (!cancelled) {
          setSummary(sumJ)
          setRegs(Array.isArray(regJ?.items) ? regJ.items : [])
          setSales(Array.isArray(saleJ?.items) ? saleJ.items : [])
          setAudit(Array.isArray(audJ?.items) ? audJ.items : [])
        }
      } catch {}
      finally { if (!cancelled) setLoading(false) }
    })()
    return () => { cancelled = true }
  }, [id])

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Analytics & Audit</h1>
        <p className="text-sm text-muted-foreground">Event performance and activity log</p>
      </header>

      {loading ? (
        <div className="grid md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 rounded border bg-slate-50 animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded border bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase">Registrations</div>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold">{summary?.registrations?.total || 0}</div>
              <div className="text-xs text-slate-600">
                Confirmed: {summary?.registrations?.confirmed || 0} | Paid: {summary?.registrations?.paid || 0}
              </div>
            </div>

            <div className="rounded border bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase">Check-ins</div>
                <CheckCircle className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold">{summary?.checkIns?.total || 0}</div>
              <div className="text-xs text-slate-600">Total attendees checked in</div>
            </div>

            <div className="rounded border bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase">Orders</div>
                <TrendingUp className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold">{summary?.orders?.paid || 0}</div>
              <div className="text-xs text-slate-600">Paid orders</div>
            </div>

            <div className="rounded border bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 uppercase">Revenue</div>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold">₹{(summary?.orders?.revenueInr || 0).toLocaleString()}</div>
              <div className="text-xs text-slate-600">Total revenue (INR)</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded border bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                <div className="text-sm font-medium">Registrations (Last 30 days)</div>
              </div>
              {regs.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">No data</div>
              ) : (
                <div className="space-y-1">
                  {regs.slice(-10).map(r => (
                    <div key={r.date} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{r.date}</span>
                      <span className="font-medium">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded border bg-white p-4 space-y-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-500" />
                <div className="text-sm font-medium">Sales (Last 30 days)</div>
              </div>
              {sales.length === 0 ? (
                <div className="text-xs text-slate-500 py-8 text-center">No data</div>
              ) : (
                <div className="space-y-1">
                  {sales.slice(-10).map(s => (
                    <div key={s.date} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{s.date}</span>
                      <span className="font-medium">₹{s.amountInr.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Audit log */}
          <div className="rounded border bg-white p-4 space-y-3">
            <div className="text-sm font-medium">Recent Activity</div>
            {audit.length === 0 ? (
              <div className="text-xs text-slate-500 py-4">No recent activity</div>
            ) : (
              <div className="space-y-2">
                {audit.slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-start gap-3 text-xs border-b pb-2 last:border-0">
                    <div className="text-slate-500 w-32 shrink-0">{a.timestamp ? new Date(a.timestamp).toLocaleString() : '—'}</div>
                    <div className="flex-1">
                      <div className="font-medium">{a.action || 'Action'}</div>
                      {a.details && <div className="text-slate-600">{a.details}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
