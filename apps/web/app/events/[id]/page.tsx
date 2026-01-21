"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import AvatarIcon from '@/components/ui/AvatarIcon'

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-white dark:bg-slate-900 motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:shadow-sm motion-safe:hover:-translate-y-0.5 ${className}`}>
      {children}
    </div>
  )
}

export default function EventWorkspaceDashboard({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const [stats, setStats] = useState<{ ticketSalesInr: number; registrations: number; daysToEvent: number; counts: Record<string, number> } | null>(null)
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  // Use internal Next API proxies so server can attach auth

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes] = await Promise.all([
          fetch(`/api/events/${params?.id}/stats`),
          fetch(`/api/events/${params?.id}/registrations/trend`)
        ])
        if (sRes.ok) setStats(await sRes.json())
        if (tRes.ok) setTrend(await tRes.json())
      } catch (e) {
        // noop fail-soft
      } finally { setLoading(false) }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.id])

  if (status === 'loading') return <div className="p-6">Loading...</div>
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <AvatarIcon seed={`event:${params?.id || ''}`} size={28} />
          <h1 className="text-2xl font-semibold">Overview</h1>
        </div>
        <p className="text-sm text-muted-foreground">Event ID: {params?.id}</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 motion-safe:hover:scale-[1.01]">
          <div className="text-sm text-muted-foreground">Ticket Sales</div>
          {loading ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-6 w-24 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
              <lottie-player autoplay loop background="transparent" mode="normal" src="https://assets4.lottiefiles.com/packages/lf20_usmfx6bp.json" style={{ width: 20, height: 20 }} />
            </div>
          ) : (
            <div className="mt-2 text-2xl font-semibold">₹{(stats?.ticketSalesInr ?? 0).toLocaleString()}</div>
          )}
        </Card>
        <Card className="p-4 motion-safe:hover:scale-[1.01]">
          <div className="text-sm text-muted-foreground">Registrations</div>
          {loading ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{stats?.registrations ?? 0}</div>
          )}
        </Card>
        <Card className="p-4 motion-safe:hover:scale-[1.01]">
          <div className="text-sm text-muted-foreground">Days to Event</div>
          {loading ? (
            <div className="mt-2 h-6 w-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ) : (
            <div className="mt-2 text-2xl font-semibold">{stats?.daysToEvent ?? '—'}</div>
          )}
        </Card>
      </div>


      {/* Main Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Registration Trend - Spans 2 columns */}
        <Card className="p-4 flex flex-col justify-between md:col-span-2">
          <div>
            <div className="font-medium">Registration Trend</div>
            <div className="mt-4">
              {loading ? (
                <div className="h-48 w-full rounded-md bg-slate-50 dark:bg-slate-800 relative overflow-hidden">
                  <div className="absolute inset-0 animate-pulse" />
                  <div className="absolute right-2 top-2">
                    <lottie-player autoplay loop background="transparent" mode="normal" src="https://assets4.lottiefiles.com/packages/lf20_usmfx6bp.json" style={{ width: 24, height: 24 }} />
                  </div>
                </div>
              ) : (
                <svg viewBox="0 0 400 120" className="w-full h-48">
                  <polyline fill="none" stroke="#6366f1" strokeWidth="2"
                    points={(() => {
                      const data = trend.length ? trend : Array.from({ length: 14 }, (_, i) => ({ count: 0 }))
                      const max = Math.max(1, ...data.map(d => d.count))
                      const divisor = Math.max(1, data.length - 1)
                      return data.map((d, i) => {
                        const x = (i / divisor) * 400
                        const y = 120 - ((d.count || 0) / max) * 100 - 10
                        return `${x.toFixed(1)},${y.toFixed(1)}`
                      }).join(' ')
                    })()} />
                </svg>
              )}
            </div>
            {(!trend.length || trend.every(t => t.count === 0)) && (
              <div className="mt-4 flex items-center justify-center gap-3 bg-slate-50 p-4 rounded-lg">
                <lottie-player
                  autoplay
                  loop
                  mode="normal"
                  background="transparent"
                  src="https://assets9.lottiefiles.com/packages/lf20_2omr5gpu.json"
                  style={{ width: 40, height: 40 }}
                />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No attendees yet</p>
                  <p className="text-xs text-muted-foreground">Promote your event to start seeing data here.</p>
                </div>
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end">
            <Link href={`/events/${params.id}/reports/ticket-sales`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">View Detailed Report &rarr;</Link>
          </div>
        </Card>

        {/* Event Numbers - Spans 1 column */}
        <Card className="p-4">
          <div className="font-medium mb-4">Event Numbers</div>
          <div className="grid grid-cols-2 gap-3 text-center">
            {[
              { label: 'Sessions', value: stats?.counts?.sessions ?? 0 },
              { label: 'Speakers', value: stats?.counts?.speakers ?? 0 },
              { label: 'Team', value: stats?.counts?.team ?? 0 },
              { label: 'Promos', value: stats?.counts?.promos ?? 0 },
            ].map((it) => (
              <div key={it.label} className="rounded-md bg-indigo-50/60 dark:bg-indigo-950/20 p-3">
                <div className="text-xl font-semibold">{it.value}</div>
                <div className="text-xs text-indigo-700 dark:text-indigo-300">{it.label}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Attendance / Promotion - Spans full width */}
        <Card className="p-4 md:col-span-3 flex items-center justify-between">
          <div>
            <div className="font-medium">Ready to grow?</div>
            <p className="text-sm text-muted-foreground mt-1">Promote your event across social media and email to boost registrations.</p>
          </div>
          <Link href={`/events/${params.id}/promote`} className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-600/90 shadow-sm">
            Promote Event
          </Link>
        </Card>
      </div>
    </div>
  )
}
