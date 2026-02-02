"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import AvatarIcon from '@/components/ui/AvatarIcon'
import { TrendingUp, Activity, DollarSign, Percent } from 'lucide-react'

type PaymentAnalytics = {
  totalPayments: number
  totalRevenue: number
  averagePaymentAmount: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  revenueByDay: string
  paymentsByStatus: string
}


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
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  // Use internal Next API proxies so server can attach auth

  useEffect(() => {
    const load = async () => {
      try {
        const [sRes, tRes, pRes] = await Promise.all([
          fetch(`/api/events/${params?.id}/stats`),
          fetch(`/api/events/${params?.id}/registrations/trend`),
          fetch(`/api/events/${params?.id}/reports/payments`, { cache: 'no-store' })
        ])
        if (sRes.ok) setStats(await sRes.json())
        if (tRes.ok) setTrend(await tRes.json())
        if (pRes.ok) setPaymentAnalytics(await pRes.json())
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

        {/* Payment Analytics Section - Spans 2 columns */}
        <div className="md:col-span-2 space-y-4">
          {paymentAnalytics ? (
            <>
              {/* Payment KPIs */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Revenue</div>
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paymentAnalytics.totalRevenue)}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Payments</div>
                      <div className="text-lg font-bold">{paymentAnalytics.totalPayments}</div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Payment</div>
                      <div className="text-lg font-bold">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paymentAnalytics.averagePaymentAmount)}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Percent className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Success Rate</div>
                      <div className="text-lg font-bold">
                        {paymentAnalytics.totalPayments > 0 ?
                          ((paymentAnalytics.successfulPayments / paymentAnalytics.totalPayments) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Payment Status & Trend */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="font-medium text-sm mb-3">Payment Status</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Successful</span>
                      <span className="font-medium">{paymentAnalytics.successfulPayments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-600">Failed</span>
                      <span className="font-medium">{paymentAnalytics.failedPayments}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-yellow-600">Pending</span>
                      <span className="font-medium">{paymentAnalytics.pendingPayments}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="font-medium text-sm mb-3">Revenue Trend (30d)</div>
                  <div className="h-24 flex items-end justify-between space-x-1">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div key={i} className="bg-indigo-200 rounded-t flex-1" style={{
                        height: `${20 + Math.random() * 80}%`,
                        minHeight: '4px'
                      }}></div>
                    ))}
                  </div>
                </Card>
              </div>
            </>
          ) : (
            <Card className="p-8 text-center text-muted-foreground md:col-span-2">
              Loading Payment Reports...
            </Card>
          )}
        </div>

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
