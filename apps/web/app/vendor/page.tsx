'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingPage } from '@/components/ui/loading-spinner'
import { Package, Calendar, DollarSign, Star, Clock, CheckCircle, AlertCircle, Building2, Mail, Phone, MapPin } from 'lucide-react'

interface VendorDashboardData {
  company: {
    id: string
    company_name: string
    email: string
    phone: string
    city: string
    country: string
    status: string
    avg_rating: number
    total_reviews: number
  }
  services: Array<{
    id: string
    name: string
    description: string
    base_price: number
    price_unit: string
    is_active: boolean
  }>
  bookings: Array<{
    id: string
    event_name: string
    service_name: string
    booking_date: string
    amount: number
    status: string
  }>
  payments: {
    total_earned: number
    pending: number
    paid: number
  }
  stats: {
    total_bookings: number
    active_services: number
    pending_bookings: number
    completed_bookings: number
  }
}

export default function VendorDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<VendorDashboardData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    const userRole = (session?.user as any)?.role
    if (!session || userRole !== 'VENDOR') {
      router.push('/auth/login')
      return
    }

    fetchVendorData()
  }, [session, status, router])

  const fetchVendorData = async () => {
    try {
      const res = await fetch('/api/vendor/dashboard')
      if (res.ok) {
        const data = await res.json()
        setData(data)
      } else {
        setError('Failed to load vendor data')
      }
    } catch (err) {
      setError('Failed to load vendor data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <LoadingPage text="Loading vendor dashboard..." />

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Error</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{data.company.company_name}</h1>
            <div className="flex items-center gap-4 text-gray-600 mt-1">
              <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{data.company.email}</span>
              {data.company.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{data.company.phone}</span>}
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{data.company.city}, {data.company.country}</span>
            </div>
          </div>
          <div className="ml-auto">
            <Badge className={data.company.status === 'VERIFIED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
              {data.company.status}
            </Badge>
          </div>
        </div>
        {data.company.avg_rating > 0 && (
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{data.company.avg_rating.toFixed(1)}</span>
            <span className="text-gray-500">({data.company.total_reviews} reviews)</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.total_bookings}</p>
                <p className="text-sm text-gray-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Package className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.active_services}</p>
                <p className="text-sm text-gray-500">Active Services</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.stats.pending_bookings}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${data.payments.total_earned.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              My Services
            </CardTitle>
            <CardDescription>Services you offer to event organizers</CardDescription>
          </CardHeader>
          <CardContent>
            {data.services.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No services added yet</p>
            ) : (
              <div className="space-y-3">
                {data.services.map(service => (
                  <div key={service.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-500">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${service.base_price}</p>
                        <p className="text-xs text-gray-500">{service.price_unit}</p>
                      </div>
                    </div>
                    <Badge className={service.is_active ? 'bg-green-100 text-green-700 mt-2' : 'bg-gray-100 text-gray-700 mt-2'}>
                      {service.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Your latest service bookings</CardDescription>
          </CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-3">
                {data.bookings.slice(0, 5).map(booking => (
                  <div key={booking.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.event_name}</p>
                        <p className="text-sm text-gray-500">{booking.service_name}</p>
                        <p className="text-xs text-gray-400">{new Date(booking.booking_date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${booking.amount}</p>
                        <Badge className={
                          booking.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-emerald-600">${data.payments.paid.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Paid</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-yellow-600">${data.payments.pending.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">${data.payments.total_earned.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
