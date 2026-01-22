'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { DollarSign, TrendingUp, TrendingDown, Package, Users, Store, Clock, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/ui/loading-spinner'

interface DashboardData {
  overview: {
    total_transactions: number
    total_bookings_value: number
    total_commission: number
    total_payouts: number
    avg_commission_rate: number
    paid_count: number
    pending_count: number
    paid_commission: number
    pending_commission: number
  }
  byProviderType: Array<{
    booking_type: string
    count: number
    total_amount: number
    commission: number
    avg_rate: number
  }>
  monthlyTrend: Array<{
    month: string
    transactions: number
    bookings_value: number
    commission: number
  }>
  topProviders: Array<{
    id: number
    company_name: string
    provider_type: string
    transaction_count: number
    total_commission: number
    total_bookings: number
  }>
  recentTransactions: Array<any>
  paymentStatus: Array<{
    status: string
    count: number
    amount: number
  }>
}

export default function CommissionDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    fetchDashboard()
  }, [period])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const tenantId = localStorage.getItem('currentTenantId')
      if (!tenantId) return

      const response = await fetch(`/api/companies/${tenantId}/commissions/dashboard?period=${period}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard')
      }

      const dashboardData = await response.json()
      setData(dashboardData)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to load commission dashboard',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0)
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'VENDOR': return <Package className="h-4 w-4" />
      case 'SPONSOR': return <Users className="h-4 w-4" />
      case 'EXHIBITOR': return <Store className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  if (loading) {
    return <LoadingPage text="Loading dashboard..." />
  }

  if (!data) return null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Commission Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Track and analyze your commission earnings
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(data.overview.total_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From {data.overview.total_transactions} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bookings Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.overview.total_bookings_value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg rate: {(data.overview.avg_commission_rate || 0).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Paid Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.overview.paid_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.paid_count} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(data.overview.pending_commission)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.pending_count} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* By Provider Type */}
        <Card>
          <CardHeader>
            <CardTitle>Commission by Provider Type</CardTitle>
            <CardDescription>Breakdown of earnings by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.byProviderType.map((item) => (
                <div key={item.booking_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getProviderIcon(item.booking_type)}
                    <div>
                      <p className="font-medium">{item.booking_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.count} bookings · {item.avg_rate.toFixed(1)}% avg rate
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      {formatCurrency(item.commission)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatCurrency(item.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Providers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Providers</CardTitle>
            <CardDescription>Highest commission generators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topProviders.slice(0, 5).map((provider, index) => (
                <div key={provider.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{provider.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {provider.transaction_count} bookings
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {formatCurrency(provider.total_commission)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monthly Trend</CardTitle>
          <CardDescription>Commission earnings over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.monthlyTrend.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{month.month}</p>
                  <p className="text-xs text-muted-foreground">
                    {month.transactions} transactions
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(month.commission)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    from {formatCurrency(month.bookings_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Latest commission transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{transaction.transaction_number}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.provider?.company_name} · {transaction.event?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">
                    {formatCurrency(transaction.commission_amount)}
                  </p>
                  <Badge variant={transaction.status === 'PAID' ? 'default' : 'secondary'}>
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
