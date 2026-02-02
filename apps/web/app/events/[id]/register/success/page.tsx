"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, Calendar, Mail, Share2, ArrowLeft } from "lucide-react"

export default function RegistrationSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${params?.id}`)
        if (response.ok) {
          const eventData = await response.json()
          setEvent(eventData)
        }
      } catch (error) {
        console.error('Error fetching event:', error)
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) {
      fetchEvent()
    }
  }, [params?.id])

  const shareEvent = () => {
    const url = `${window.location.origin}/events/${params?.id}/public`
    const text = `Check out this event: ${event?.name || 'Event'}`
    
    if (navigator.share) {
      navigator.share({
        title: event?.name || 'Event',
        text: text,
        url: url,
      })
    } else {
      navigator.clipboard.writeText(`${text} ${url}`)
      alert('Event link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>
          <p className="text-gray-600 mb-8">
            Thank you for registering for {event?.name || 'the event'}. We've sent a confirmation email with all the details.
          </p>

          {/* Event Details */}
          {event && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-2">{event.name}</h3>
              {event.startsAt && (
                <p className="text-sm text-gray-600 flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(event.startsAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              )}
              {event.venue && (
                <p className="text-sm text-gray-600">📍 {event.venue}</p>
              )}
              {event.address && (
                <p className="text-sm text-gray-600">{event.address}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(`/events/${params?.id}/public`)}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              View Event Details
            </button>

            <button
              onClick={shareEvent}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Event
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              className="w-full text-gray-500 py-2 px-4 rounded-md hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Mail className="h-4 w-4" />
              Check your email for confirmation details
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
