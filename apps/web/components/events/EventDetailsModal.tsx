'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Calendar, MapPin, Users, Clock, Ticket, DollarSign, Info, List, CheckCircle, Globe, Video, Building } from 'lucide-react'

interface EventDetailsModalProps {
  eventId: string | number
  isOpen: boolean
  onClose: () => void
}

export default function EventDetailsModal({ eventId, isOpen, onClose }: EventDetailsModalProps) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'agenda' | 'details' | 'route' | 'faq'>('overview')
  const router = useRouter()

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventDetails()
    }
  }, [isOpen, eventId])

  const fetchEventDetails = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Failed to fetch event details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDateRange = (start?: string, end?: string) => {
    try {
      if (!start || !end) return 'Date TBD'
      const s = new Date(start)
      const e = new Date(end)
      const dateOptions: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }
      const timeOptions: Intl.DateTimeFormatOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
      }
      return `${s.toLocaleDateString(undefined, dateOptions)} at ${s.toLocaleTimeString(undefined, timeOptions)} - ${e.toLocaleDateString(undefined, dateOptions)} at ${e.toLocaleTimeString(undefined, timeOptions)}`
    } catch {
      return 'Date TBD'
    }
  }

  const formatPrice = (amount?: number) => {
    if (amount === undefined || amount === null || isNaN(amount) || amount <= 0) return 'Free'
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
  }

  const isEventEnded = event?.endsAt && new Date(event.endsAt) < new Date()

  const handleRegister = () => {
    if (isEventEnded) {
      return // Don't allow registration for ended events
    }
    onClose()
    router.push(`/events/${eventId}/register`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative">
          {event?.bannerUrl ? (
            <div className="h-48 w-full overflow-hidden">
              <img 
                src={event.bannerUrl} 
                alt={event.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          ) : (
            <div className="h-48 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" />
          )}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-lg"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-6 right-6">
            <h2 className="text-3xl font-bold text-white drop-shadow-lg">
              {loading ? 'Loading...' : event?.name || 'Event Details'}
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Info className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'agenda'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Agenda
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'details'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'route'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-2" />
            Route
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all ${
              activeTab === 'faq'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            <Info className="w-4 h-4 inline mr-2" />
            FAQ
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                      <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-2" />
                      <div className="text-xs text-gray-600 dark:text-gray-400">Date</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {event?.startsAt ? new Date(event.startsAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                      <Users className="w-6 h-6 text-green-600 dark:text-green-400 mb-2" />
                      <div className="text-xs text-gray-600 dark:text-gray-400">Registered</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {event?.registrationCount || 0} / {event?.capacity || '∞'}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                      <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400 mb-2" />
                      <div className="text-xs text-gray-600 dark:text-gray-400">Price</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {formatPrice(event?.priceInr)}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                      <Ticket className="w-6 h-6 text-purple-600 dark:text-purple-400 mb-2" />
                      <div className="text-xs text-gray-600 dark:text-gray-400">Available</div>
                      <div className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                        {Math.max(0, (event?.capacity || 0) - (event?.registrationCount || 0))} tickets
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About This Event</h3>
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {event?.description || 'No description available for this event.'}
                      </p>
                    </div>
                  </div>

                  {/* Event Mode & Location */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-2">
                        {event?.eventMode === 'VIRTUAL' ? (
                          <Video className="w-5 h-5 text-indigo-600" />
                        ) : event?.eventMode === 'HYBRID' ? (
                          <Globe className="w-5 h-5 text-indigo-600" />
                        ) : (
                          <Building className="w-5 h-5 text-indigo-600" />
                        )}
                        <h4 className="font-semibold text-gray-900 dark:text-white">Event Mode</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event?.eventMode === 'VIRTUAL' ? '🌐 Virtual Event' : 
                         event?.eventMode === 'HYBRID' ? '🔄 Hybrid Event' : 
                         '📍 In-Person Event'}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-white">Location</h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {event?.venue || event?.city || 'Location to be announced'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Agenda Tab */}
              {activeTab === 'agenda' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Event Schedule</h3>
                  
                  {event?.sessions && event.sessions.length > 0 ? (
                    <div className="space-y-3">
                      {event.sessions.map((session: any, index: number) => (
                        <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                          <div className="flex-shrink-0 w-20 text-center">
                            <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                              {session.startTime || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {session.duration || ''}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {session.title || session.name || 'Session'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {session.description || 'No description available'}
                            </p>
                            {session.speaker && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Speaker: {session.speaker}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Event agenda will be published soon
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {isEventEnded && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold">
                        <Clock className="w-5 h-5" />
                        This event has ended
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                        Registration is no longer available for this event.
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <Calendar className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Date & Time</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDateRange(event?.startsAt, event?.endsAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Venue</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event?.venue || event?.city || 'Venue details to be announced'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                      <Users className="w-5 h-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Capacity</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {event?.capacity ? `${event.capacity} attendees` : 'Unlimited capacity'}
                        </p>
                      </div>
                    </div>

                    {event?.category && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Category</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.category}
                          </p>
                        </div>
                      </div>
                    )}

                    {event?.organizer && (
                      <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl">
                        <Users className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Organizer</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event.organizer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Route Tab */}
              {activeTab === 'route' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">How to Reach</h3>
                  
                  {event?.venue || event?.city ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-3">
                          <MapPin className="w-5 h-5 text-red-600" />
                          <h4 className="font-semibold text-gray-900 dark:text-white">Venue Address</h4>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {event?.venue || event?.city}
                        </p>
                        {(event?.latitude && event?.longitude) && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-all"
                          >
                            <MapPin className="w-4 h-4" />
                            Open in Google Maps
                          </a>
                        )}
                      </div>

                      {event?.directions && (
                        <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Directions</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                            {event.directions}
                          </p>
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">Transportation Tips</h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                          <li>• Parking available on-site</li>
                          <li>• Public transport accessible</li>
                          <li>• Ride-sharing services recommended</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">
                        Location details will be shared soon
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h3>
                  
                  {event?.faqs && event.faqs.length > 0 ? (
                    <div className="space-y-3">
                      {event.faqs.map((faq: any, index: number) => (
                        <details key={index} className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                          <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                            {faq.question}
                          </summary>
                          <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                            {faq.answer}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <details className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          What should I bring to the event?
                        </summary>
                        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                          Please bring a valid ID and your registration confirmation. Additional requirements will be communicated via email.
                        </div>
                      </details>

                      <details className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          Is parking available?
                        </summary>
                        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                          Yes, free parking is available at the venue. Please arrive early as spaces are limited.
                        </div>
                      </details>

                      <details className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          Can I get a refund?
                        </summary>
                        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                          Refund policy varies by event. Please contact the organizer for specific refund terms.
                        </div>
                      </details>

                      <details className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <summary className="p-4 cursor-pointer font-semibold text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                          Is food provided?
                        </summary>
                        <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-400">
                          Refreshments and meals will be provided as per the event schedule. Dietary preferences can be specified during registration.
                        </div>
                      </details>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-6 bg-gray-50 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(event?.priceInr)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">per ticket</div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-slate-700 transition-all">
                Close
              </button>
              {isEventEnded ? (
                <button
                  disabled
                  className="px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed flex items-center gap-2 opacity-60"
                >
                  <Clock className="w-5 h-5" />
                  Event Ended
                </button>
              ) : (
                <button
                  onClick={handleRegister}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Users className="w-5 h-5" />
                  Register Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
