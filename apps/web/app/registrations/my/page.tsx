'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Calendar, 
  MapPin, 
  Ticket, 
  Users, 
  Clock, 
  IndianRupee, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  Mail,
  Phone
} from 'lucide-react'

type Registration = {
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
  const router = useRouter()
  const { data: session, status } = useSession()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }
    
    if (session) {
      loadRegistrations()
    }
  }, [session, status])

  const loadRegistrations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/registrations/my', {
        credentials: 'include',
        cache: 'no-store'
      })
      
      if (res.ok) {
        const data = await res.json()
        setRegistrations(data.registrations || [])
      } else if (res.status === 401) {
        router.push('/auth/login')
      }
    } catch (error) {
      console.error('Error loading registrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; icon: JSX.Element; label: string }> = {
      CONFIRMED: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: <CheckCircle className="w-3 h-3" />,
        label: 'Confirmed'
      },
      PENDING: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: <Clock className="w-3 h-3" />,
        label: 'Pending'
      },
      CANCELLED: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: <XCircle className="w-3 h-3" />,
        label: 'Cancelled'
      },
      WAITLISTED: { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        icon: <AlertCircle className="w-3 h-3" />,
        label: 'Waitlisted'
      }
    }

    const statusInfo = statusMap[status] || statusMap.PENDING
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full border ${statusInfo.color}`}>
        {statusInfo.icon}
        {statusInfo.label}
      </span>
    )
  }

  const getPaymentBadge = (paymentStatus: string) => {
    if (paymentStatus === 'PAID') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">
        <CheckCircle className="w-3 h-3" /> Paid
      </span>
    }
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
      <Clock className="w-3 h-3" /> Pending
    </span>
  }

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true
    const eventDate = new Date(reg.eventDate)
    const now = new Date()
    
    if (filter === 'upcoming') {
      return eventDate >= now
    } else {
      return eventDate < now
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Registrations
              </h1>
              <p className="text-gray-600">
                Manage your event registrations and tickets
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Ticket className="w-8 h-8 text-indigo-600" />
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl border shadow-sm p-4">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({registrations.length})
            </button>
            <button
              onClick={() => setFilter('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'upcoming' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Upcoming ({registrations.filter(r => new Date(r.eventDate) >= new Date()).length})
            </button>
            <button
              onClick={() => setFilter('past')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'past' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Past ({registrations.filter(r => new Date(r.eventDate) < new Date()).length})
            </button>
          </div>
        </div>

        {/* Registrations List */}
        {filteredRegistrations.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <Ticket className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations found</h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't registered for any events yet"
                : `No ${filter} events found`}
            </p>
            <button
              onClick={() => router.push('/events/browse')}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 inline-flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRegistrations.map((registration) => (
              <div
                key={registration.id}
                className="bg-white rounded-xl border hover:border-indigo-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
              >
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {registration.eventName}
                        </h3>
                        {getStatusBadge(registration.status)}
                        {getPaymentBadge(registration.paymentStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>{new Date(registration.eventDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          <span>{registration.venue}, {registration.city}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/events/${registration.eventId}`)}
                      className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Event
                    </button>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Registration ID</p>
                      <p className="font-mono text-sm font-medium text-gray-900">#{registration.id.substring(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Attendees</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {registration.numberOfAttendees}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                      <p className="text-sm font-medium text-green-600 flex items-center gap-1">
                        <IndianRupee className="w-4 h-4" />
                        {registration.priceInr || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Registered On</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(registration.registeredAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="flex items-center gap-6 pt-4 border-t border-gray-100 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{registration.email}</span>
                    </div>
                    {registration.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{registration.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {registration.status === 'CONFIRMED' && registration.paymentStatus === 'PAID' && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                      <button
                        onClick={() => router.push(`/events/${registration.eventId}/ticket/${registration.id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                      >
                        <Ticket className="w-4 h-4" />
                        View Ticket & QR Code
                      </button>
                      <button
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
