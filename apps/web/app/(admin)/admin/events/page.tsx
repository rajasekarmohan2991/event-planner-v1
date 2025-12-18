'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, MapPin, Users, Edit, Trash2, Plus, Eye, Ticket } from 'lucide-react'
import dynamicImport from 'next/dynamic'
import BackButton from '@/components/ui/back-button'

const LottieAnimation = dynamicImport(() => import('@/components/animations/LottieAnimation').then(mod => mod.LottieAnimation), { ssr: false })

type Event = {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  location: string
  status: string
  capacity: number
  registrationCount?: number
  bannerImage?: string
}

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all')

  const loadEvents = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/events', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      const res = await fetch(`/api/events/${id}`, { method: 'DELETE' })
      if (res.ok) {
        alert('Event deleted successfully')
        loadEvents()
      } else {
        alert('Failed to delete event')
      }
    } catch (error) {
      alert('Error deleting event')
    }
  }

  const filteredEvents = events.filter(event => {
    // Include Drafts in "All"
    if (filter === 'all') return true
    if (filter === 'draft') return event.status === 'DRAFT'
    if (filter === 'upcoming') {
      const startDate = new Date(event.startDate)
      return startDate > new Date() && event.status !== 'DRAFT'
    }
    if (filter === 'past') {
      const endDate = new Date(event.endDate)
      return endDate < new Date()
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-32 h-32">
          <LottieAnimation
            animationUrl="/animations/loading.json"
            loop={true}
            autoplay={true}
          />
        </div>
        <p className="text-gray-600 mt-4">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackButton fallbackUrl="/admin" />
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12">
            <LottieAnimation
              animationUrl="/animations/success.json"
              loop={true}
              autoplay={true}
            />
          </div>
          <h1 className="text-2xl font-bold">Events Management</h1>
        </div>
        <button
          onClick={() => router.push('/admin/events/create')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" />
          Create Event
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['all', 'upcoming', 'past', 'draft'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium capitalize ${filter === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Events List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
          <p className="text-gray-600 mb-4">
            {filter === 'all'
              ? 'Create your first event to get started'
              : `No ${filter} events at the moment`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => router.push(`/events/${event.id}`)}
              className="bg-white border rounded-lg overflow-hidden hover:shadow-xl hover:border-indigo-400 transition-all cursor-pointer flex flex-col"
            >
              {/* Banner Image */}
              {event.bannerImage && (
                <div className="w-full h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={event.bannerImage}
                    alt={event.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-event.jpg'
                    }}
                  />
                </div>
              )}

              {/* Card Header */}
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                    {event.name}
                  </h3>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${event.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' :
                      event.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                        event.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                    }`}>
                    {event.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {event.description || 'new events to be listed'}
                </p>

                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {event.startDate && event.startDate !== 'Invalid Date'
                        ? new Date(event.startDate).toLocaleDateString()
                        : 'Invalid Date'} - {event.endDate && event.endDate !== 'Invalid Date'
                          ? new Date(event.endDate).toLocaleDateString()
                          : 'Invalid Date'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{event.location || 'No location'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 flex-shrink-0" />
                    <span>{event.registrationCount || 0} / {event.capacity || 0} registered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {Math.max(0, (event.capacity || 0) - (event.registrationCount || 0))} tickets remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <span className="font-semibold text-lg text-indigo-600">
                  {(event as any).priceInr ? `₹${(event as any).priceInr}` : 'Free'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/events/${event.id}`)
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="View Event"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/events/${event.id}/info`)
                    }}
                    className="p-2 text-blue-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Edit Event"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(event.id)
                    }}
                    className="p-2 text-red-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Delete Event"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
