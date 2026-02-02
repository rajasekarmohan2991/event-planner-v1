'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function CheckInPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [registrationData, setRegistrationData] = useState<any>(null)

  useEffect(() => {
    if (!code) {
      setStatus('error')
      setMessage('No check-in code provided')
      return
    }

    // Verify check-in code
    fetch(`/api/events/${params.id}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setStatus('error')
          setMessage(data.error)
        } else {
          setStatus('success')
          setMessage('Check-in successful!')
          setRegistrationData(data.registration)
        }
      })
      .catch(err => {
        setStatus('error')
        setMessage('Check-in failed. Please try again.')
        console.error(err)
      })
  }, [code, params.id])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {status === 'loading' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 mx-auto text-purple-600 animate-spin" />
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Verifying...</h2>
            <p className="mt-2 text-gray-600">Please wait while we verify your check-in code</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Check-In Successful!</h2>
            <p className="mt-2 text-gray-600">{message}</p>

            {registrationData && (
              <div className="mt-6 bg-gray-50 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Registration Details:</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Name:</strong> {registrationData.firstName} {registrationData.lastName}</p>
                  <p><strong>Email:</strong> {registrationData.email}</p>
                  <p><strong>Type:</strong> {registrationData.type}</p>
                  <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            )}

            <p className="mt-6 text-sm text-gray-500">Welcome to the event! 🎉</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Check-In Failed</h2>
            <p className="mt-2 text-gray-600">{message}</p>
            <p className="mt-4 text-sm text-gray-500">Please contact event staff for assistance.</p>
          </div>
        )}
      </div>
    </div>
  )
}
