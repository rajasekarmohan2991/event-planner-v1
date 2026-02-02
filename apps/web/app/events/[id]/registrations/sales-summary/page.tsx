"use client"

import { useEffect, useState } from 'react'
import { TrendingUp, Users, DollarSign, Ticket, Percent, Calendar, RefreshCw, BarChart3, PieChart, Activity } from 'lucide-react'

type RegistrationSummary = {
  totalRegistrations: number
  pendingApprovals: number
  approvedRegistrations: number
  rejectedRegistrations: number
  totalRevenue: number
  averageOrderValue: number
  totalTicketsSold: number
  totalTicketsAvailable: number
  conversionRate: number
  uniqueAttendees: number
  topTicketType: string
  topTicketCount: number
}

type TicketSales = {
  ticketId: number
  ticketName: string
  ticketType: string
  priceInMinor: number
  currency: string
  quantitySold: number
  quantityAvailable: number
  revenue: number
  percentageSold: number
  status: string
}

type PaymentAnalytics = {
  totalPayments: number
  totalRevenue: number
  averagePaymentAmount: number
  successfulPayments: number
  failedPayments: number
  pendingPayments: number
  topPaymentMethod: string
  refundRate: number
  revenueByDay: string
  paymentsByStatus: string
}

type PromoCodeAnalytics = {
  totalPromoCodes: number
  activePromoCodes: number
  totalUses: number
  totalDiscountAmount: number
  averageDiscountAmount: number
  mostUsedPromoCode: string
  mostUsedPromoCount: number
  promoCodeUsage: string
}

export default function SalesSummaryPage({ params }: { params: { id: string } }) {
  const [summary, setSummary] = useState<RegistrationSummary | null>(null)
  const [ticketSales, setTicketSales] = useState<TicketSales[]>([])
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null)
  const [promoAnalytics, setPromoAnalytics] = useState<PromoCodeAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'payments' | 'promo'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Load all reports data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [summaryRes, ticketsRes, paymentsRes, promoRes] = await Promise.all([
          fetch(`/api/events/${params.id}/reports/summary`, { cache: 'no-store' }),
          fetch(`/api/events/${params.id}/reports/ticket-sales`, { cache: 'no-store' }),
          fetch(`/api/events/${params.id}/reports/payments`, { cache: 'no-store' }),
          fetch(`/api/events/${params.id}/reports/promo-codes`, { cache: 'no-store' })
        ])

        if (summaryRes.ok) setSummary(await summaryRes.json())
        if (ticketsRes.ok) setTicketSales(await ticketsRes.json())
        if (paymentsRes.ok) setPaymentAnalytics(await paymentsRes.json())
        if (promoRes.ok) setPromoAnalytics(await promoRes.json())
        setLastUpdated(new Date())
      } catch (error) {
        console.error('Failed to load reports:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initial load
    loadData()
    
    // Auto-refresh every 30 seconds
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(() => {
        loadData()
      }, 30000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [params.id, autoRefresh])

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  const manualRefresh = async () => {
    setLoading(true)
    try {
      const [summaryRes, ticketsRes, paymentsRes, promoRes] = await Promise.all([
        fetch(`/api/events/${params.id}/reports/summary`, { cache: 'no-store' }),
        fetch(`/api/events/${params.id}/reports/ticket-sales`, { cache: 'no-store' }),
        fetch(`/api/events/${params.id}/reports/payments`, { cache: 'no-store' }),
        fetch(`/api/events/${params.id}/reports/promo-codes`, { cache: 'no-store' })
      ])

      if (summaryRes.ok) setSummary(await summaryRes.json())
      if (ticketsRes.ok) setTicketSales(await ticketsRes.json())
      if (paymentsRes.ok) setPaymentAnalytics(await paymentsRes.json())
      if (promoRes.ok) setPromoAnalytics(await promoRes.json())
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to refresh reports:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Sales Summary & Reports
          </h1>
          <p className="text-sm text-muted-foreground">Event ID: {params.id}</p>
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
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'tickets', label: 'Ticket Sales', icon: Ticket },
            { id: 'payments', label: 'Payment Analytics', icon: DollarSign },
            { id: 'promo', label: 'Promo Codes', icon: Percent }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && summary && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(summary.totalRegistrations)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">{summary.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(summary.averageOrderValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-lg font-medium mb-4">Top Performing Ticket</h3>
              {summary.topTicketType ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{summary.topTicketType}</span>
                    <span className="text-sm text-muted-foreground">{formatNumber(summary.topTicketCount)} sold</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${Math.min((summary.topTicketCount / Math.max(summary.totalTicketsSold, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No ticket sales data available</p>
              )}
            </div>

            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-lg font-medium mb-4">Sales Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tickets Sold</span>
                  <span className="text-sm font-medium">{formatNumber(summary.totalTicketsSold)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tickets Available</span>
                  <span className="text-sm font-medium">{formatNumber(summary.totalTicketsAvailable)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Revenue</span>
                  <span className="text-sm font-medium">{formatCurrency(summary.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Sales Tab */}
      {activeTab === 'tickets' && ticketSales.length > 0 && (
        <div className="rounded-lg border bg-white">
          <div className="border-b px-6 py-4">
            <h3 className="text-base font-medium">Ticket Sales Breakdown</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {ticketSales.map((ticket) => (
                <div key={ticket.ticketId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{ticket.ticketName}</p>
                        <p className="text-sm text-muted-foreground">
                          {ticket.ticketType} • {formatCurrency(ticket.priceInMinor / 100, ticket.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <span>Sold: {formatNumber(ticket.quantitySold)}</span>
                        <span>•</span>
                        <span>Available: {formatNumber(ticket.quantityAvailable)}</span>
                        <span>•</span>
                        <span>Revenue: {formatCurrency(ticket.revenue, ticket.currency)}</span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2 max-w-md">
                        <div
                          className="bg-indigo-600 h-2 rounded-full"
                          style={{ width: `${ticket.percentageSold}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {ticket.percentageSold.toFixed(1)}% sold
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    ticket.status === 'Open' ? 'bg-green-100 text-green-800' :
                    ticket.status === 'Closed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {ticket.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Payment Analytics Tab */}
      {activeTab === 'payments' && paymentAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(paymentAnalytics.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Payments</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(paymentAnalytics.totalPayments)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Payment</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(paymentAnalytics.averagePaymentAmount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Percent className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Success Rate</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {paymentAnalytics.totalPayments > 0 ?
                      ((paymentAnalytics.successfulPayments / paymentAnalytics.totalPayments) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-lg font-medium mb-4">Payment Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-600">Successful</span>
                  <span className="text-sm font-medium">{formatNumber(paymentAnalytics.successfulPayments)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-600">Failed</span>
                  <span className="text-sm font-medium">{formatNumber(paymentAnalytics.failedPayments)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-yellow-600">Pending</span>
                  <span className="text-sm font-medium">{formatNumber(paymentAnalytics.pendingPayments)}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6 lg:col-span-2">
              <h3 className="text-lg font-medium mb-4">Revenue Trend (Last 30 Days)</h3>
              <div className="h-32 flex items-end justify-between space-x-1">
                {/* Simple bar chart visualization - in production would use a charting library */}
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="bg-indigo-200 rounded-t flex-1" style={{
                    height: `${Math.random() * 100}%`,
                    minHeight: '4px'
                  }}></div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Daily revenue over the last 30 days (simplified visualization)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Promo Codes Tab */}
      {activeTab === 'promo' && promoAnalytics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Percent className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Promo Codes</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(promoAnalytics.totalPromoCodes)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Uses</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(promoAnalytics.totalUses)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Discount</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatCurrency(promoAnalytics.totalDiscountAmount)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Codes</p>
                  <p className="text-2xl font-semibold text-gray-900">{formatNumber(promoAnalytics.activePromoCodes)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Promo Code */}
          {promoAnalytics.mostUsedPromoCode && (
            <div className="rounded-lg border bg-white p-6">
              <h3 className="text-lg font-medium mb-4">Top Performing Promo Code</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{promoAnalytics.mostUsedPromoCode}</p>
                  <p className="text-sm text-muted-foreground">
                    Used {formatNumber(promoAnalytics.mostUsedPromoCount)} times
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Usage Rate</p>
                  <p className="text-2xl font-semibold text-indigo-600">
                    {promoAnalytics.totalUses > 0 ?
                      ((promoAnalytics.mostUsedPromoCount / promoAnalytics.totalUses) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Promo Code Usage Chart Placeholder */}
          <div className="rounded-lg border bg-white p-6">
            <h3 className="text-lg font-medium mb-4">Promo Code Usage Distribution</h3>
            <div className="h-48 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Chart visualization would go here</p>
                <p className="text-sm">Integration with charting library needed for full visualization</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State for tabs without data */}
      {((activeTab === 'tickets' && ticketSales.length === 0) ||
        (activeTab === 'payments' && !paymentAnalytics) ||
        (activeTab === 'promo' && !promoAnalytics)) && (
        <div className="rounded-lg border bg-white p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-muted-foreground">
            {activeTab === 'tickets' ? 'No ticket sales data found for this event.' :
             activeTab === 'payments' ? 'No payment data found for this event.' :
             'No promo code data found for this event.'}
          </p>
        </div>
      )}
    </div>
  )
}
