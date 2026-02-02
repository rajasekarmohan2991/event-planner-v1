'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function ExhibitorConfirmPage() {
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const eventId = params.id as string

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [exhibitorData, setExhibitorData] = useState<any>(null)

  useEffect(() => {
    if (!token || !eventId) {
      setStatus('error')
      setMessage('Invalid confirmation link')
      return
    }

    confirmEmail()
  }, [token, eventId])

  const confirmEmail = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/exhibitors/confirm-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message || 'Email confirmed successfully!')
        setExhibitorData(data.exhibitor)
      } else {
        setStatus('error')
        setMessage(data.error || 'Confirmation failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An error occurred during confirmation')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirming Email...</h2>
            <p className="text-gray-600">Please wait while we verify your email address</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Confirmed!</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            
            {exhibitorData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-900 mb-2">Registration Details</h3>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Company:</strong> {exhibitorData.company}</p>
                  <p><strong>Contact:</strong> {exhibitorData.contactName}</p>
                  <p><strong>Email:</strong> {exhibitorData.contactEmail}</p>
                  {exhibitorData.totalAmount && (
                    <p><strong>Total Amount:</strong> ₹{exhibitorData.totalAmount.toLocaleString()}</p>
                  )}
                  {exhibitorData.paymentLink && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <p className="font-semibold mb-2">Next Steps:</p>
                      <a 
                        href={exhibitorData.paymentLink}
                        className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Complete Payment
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              View Event Details
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirmation Failed</h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push(`/events/${eventId}`)}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back to Event
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
