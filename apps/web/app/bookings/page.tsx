'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Package, Users, Store, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react'

interface Booking {
  id: number
  booking_number?: string
  deal_number?: string
  event: { id: number; name: string; start_date: string }
  provider: { id: number; company_name: string; email: string }
  final_amount?: number
  total_amount?: number
  sponsorship_amount?: number
  commission_amount: number
  provider_payout: number
  status: string
  payment_status: string
  created_at: string
}

interface Statistics {
  total_bookings: number
  pending: number
  confirmed: number
  completed?: number
  total_amount: number
  total_commission: number
}

export default function BookingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vendors' | 'sponsors' | 'exhibitors'>('vendors')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)

  useEffect(() => {
    fetchBookings()
  }, [activeTab])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const tenantId = localStorage.getItem('currentTenantId')
      if (!tenantId) return

      const response = await fetch(`/api/companies/${tenantId}/bookings/${activeTab}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings')
      }

      const data = await response.json()
      setBookings(data.bookings || data.deals || [])
      setStatistics(data.statistics)
    } catch (error) {
      console.error('Error fetching bookings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load bookings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; icon: any; label: string }> = {
      PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
      PROPOSED: { variant: 'secondary', icon: Clock, label: 'Proposed' },
      CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
      IN_PROGRESS: { variant: 'default', icon: TrendingUp, label: 'In Progress' },
      ACTIVE: { variant: 'default', icon: CheckCircle, label: 'Active' },
      COMPLETED: { variant: 'outline', icon: CheckCircle, label: 'Completed' },
      CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
      REJECTED: { variant: 'destructive', icon: XCircle, label: 'Rejected' }
    }
    const item = config[status] || config.PENDING
    const Icon = item.icon
    return (
      <Badge variant={item.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, any> = {
      PAID: 'default',
      UNPAID: 'destructive',
      PARTIAL: 'secondary',
      REFUNDED: 'outline'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Booking Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your vendor, sponsor, and exhibitor bookings
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.total_bookings || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(statistics.total_amount || 0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Commission Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(statistics.total_commission || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="vendors">
            <Package className="mr-2 h-4 w-4" />
            Vendors
          </TabsTrigger>
          <TabsTrigger value="sponsors">
            <Users className="mr-2 h-4 w-4" />
            Sponsors
          </TabsTrigger>
          <TabsTrigger value="exhibitors">
            <Store className="mr-2 h-4 w-4" />
            Exhibitors
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first booking to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {booking.booking_number || booking.deal_number}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {booking.provider.company_name}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {getStatusBadge(booking.status)}
                    {getPaymentBadge(booking.payment_status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Event</p>
                    <p className="font-medium">{booking.event.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(booking.event.start_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="font-bold text-lg">
                      {formatCurrency(
                        booking.final_amount || booking.total_amount || booking.sponsorship_amount || 0
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Commission</p>
                    <p className="font-medium text-green-600">
                      {formatCurrency(booking.commission_amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Provider Payout</p>
                    <p className="font-medium">
                      {formatCurrency(booking.provider_payout)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Created: {formatDate(booking.created_at)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/bookings/${booking.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
