"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle, Loader2, Calendar, MapPin } from 'lucide-react'

export default function InviteResponsePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const inviteCode = searchParams?.get('code')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [eventData, setEventData] = useState<any>(null)
  const [inviteData, setInviteData] = useState<any>(null)
  const [response, setResponse] = useState<'INTERESTED' | 'NOT_INTERESTED' | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!inviteCode) {
      setError('Invalid invite link')
      setLoading(false)
      return
    }

    fetchInviteDetails()
  }, [inviteCode])

  const fetchInviteDetails = async () => {
    try {
      // Verify invite
      const res = await fetch(`/api/events/${params.id}/invites/verify?code=${inviteCode}`)
      if (!res.ok) throw new Error('Invalid invite code')
      
      const data = await res.json()
      
      if (!data.valid) {
        setError(data.error || 'Invalid invite')
        setLoading(false)
        return
      }

      setInviteData(data)

      // Fetch event details
      const eventRes = await fetch(`/api/events/${params.id}/public`)
      if (eventRes.ok) {
        const event = await eventRes.json()
        setEventData(event)
      }

      setLoading(false)
    } catch (err: any) {
      setError(err.message || 'Failed to load invite')
      setLoading(false)
    }
  }

  const handleResponse = async (responseType: 'INTERESTED' | 'NOT_INTERESTED') => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/events/${params.id}/invites/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode,
          response: responseType
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit response')
      }

      setResponse(responseType)
      setSubmitted(true)
    } catch (err: any) {
      alert(err.message || 'Failed to submit response')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center">
          {response === 'INTERESTED' ? (
            <>
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
              <p className="text-gray-600 mb-4">
                Your interest has been recorded. Our team will review your response and notify you once approved.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong><br />
                  1. Wait for approval email<br />
                  2. Select your seat<br />
                  3. Complete payment<br />
                  4. Receive QR code
                </p>
              </div>
            </>
          ) : (
            <>
              <ThumbsDown className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">We'll Miss You!</h2>
              <p className="text-gray-600">
                Thank you for letting us know. We hope to see you at future events!
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-8">
            <h1 className="text-3xl font-bold mb-2">You're Invited!</h1>
            <p className="text-indigo-100">
              {inviteData?.inviteeName && `Dear ${inviteData.inviteeName},`}
            </p>
          </div>

          {/* Event Details */}
          {eventData && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{eventData.name}</h2>
              
              <div className="space-y-3 mb-6">
                {eventData.startDate && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>{new Date(eventData.startDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</span>
                  </div>
                )}
                {eventData.venue && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-indigo-600" />
                    <span>{eventData.venue}</span>
                  </div>
                )}
              </div>

              {eventData.description && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-gray-700">{eventData.description}</p>
                </div>
              )}

              {inviteData?.category && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-indigo-800">
                    <strong>Category:</strong> {inviteData.category}
                  </p>
                  {inviteData.organization && (
                    <p className="text-sm text-indigo-800 mt-1">
                      <strong>Organization:</strong> {inviteData.organization}
                    </p>
                  )}
                </div>
              )}

              {/* Response Buttons */}
              <div className="border-t pt-6">
                <p className="text-lg font-semibold text-gray-900 mb-4">
                  Will you be attending this event?
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleResponse('INTERESTED')}
                    disabled={submitting}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <ThumbsUp className="w-12 h-12 text-green-600 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-green-700">Yes, I'm Interested!</span>
                  </button>

                  <button
                    onClick={() => handleResponse('NOT_INTERESTED')}
                    disabled={submitting}
                    className="flex flex-col items-center gap-3 p-6 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <ThumbsDown className="w-12 h-12 text-gray-500 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-gray-700">No, I Can't Make It</span>
                  </button>
                </div>

                {submitting && (
                  <div className="mt-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-sm text-gray-600 mt-2">Submitting your response...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
