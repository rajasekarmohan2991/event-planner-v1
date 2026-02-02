'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Ticket, Calendar, MapPin, DollarSign, 
  Loader2, AlertCircle, CheckCircle, XCircle, Clock 
} from 'lucide-react'
import { format } from 'date-fns'

interface Registration {
  id: string
  eventId: string
  eventName: string
  status: string
  registeredAt: string
  eventDate: string
  venue: string
  city: string
  eventStatus: string
  numberOfAttendees: number
  priceInr: number
  paymentStatus: string
  paymentMethod: string
  email: string
  firstName: string
  lastName: string
  phone: string
}

export default function MyRegistrationsPage() {
  const { data: session } = useSession()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRegistrations()
  }, [])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/registrations/my')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load registrations')
      }
      
      setRegistrations(data.registrations || [])
    } catch (err: any) {
      console.error('Error fetching registrations:', err)
      setError(err.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any; label: string }> = {
      CONFIRMED: { variant: 'default', icon: CheckCircle, label: 'Confirmed' },
      PENDING: { variant: 'secondary', icon: Clock, label: 'Pending' },
      CANCELLED: { variant: 'destructive', icon: XCircle, label: 'Cancelled' },
      WAITLISTED: { variant: 'outline', icon: Clock, label: 'Waitlisted' }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getPaymentBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string }> = {
      PAID: { variant: 'default', label: 'Paid' },
      PENDING: { variant: 'secondary', label: 'Pending' },
      FAILED: { variant: 'destructive', label: 'Failed' },
      REFUNDED: { variant: 'outline', label: 'Refunded' }
    }
    
    const config = statusConfig[status] || statusConfig.PENDING
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading your registrations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Tickets</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchRegistrations}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Ticket className="w-8 h-8" />
          My Registrations
        </h1>
        <p className="text-gray-600 mt-2">
          View and manage your event registrations
        </p>
      </div>

      {registrations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Registrations Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't registered for any events yet.
              </p>
              <Button asChild>
                <a href="/events">Browse Events</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((registration) => (
            <Card key={registration.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">
                      {registration.eventName}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2">
                      {getStatusBadge(registration.status)}
                      {getPaymentBadge(registration.paymentStatus)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{registration.priceInr.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {registration.numberOfAttendees} {registration.numberOfAttendees === 1 ? 'Attendee' : 'Attendees'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">
                      {registration.eventDate 
                        ? format(new Date(registration.eventDate), 'PPP')
                        : 'Date TBD'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">
                      {registration.venue || registration.city || 'Location TBD'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">
                      {registration.paymentMethod || 'Payment method not specified'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      Registered {format(new Date(registration.registeredAt), 'PPP')}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `/events/${registration.eventId}`}
                  >
                    View Event
                  </Button>
                  {registration.status === 'CONFIRMED' && (
                    <Button 
                      size="sm"
                      onClick={() => window.location.href = `/registrations/${registration.id}/ticket`}
                    >
                      View Ticket
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
