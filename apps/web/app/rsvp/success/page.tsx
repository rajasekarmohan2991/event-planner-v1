'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar, Mail } from 'lucide-react'

function RSVPSuccessContent() {
  const searchParams = useSearchParams()
  const response = searchParams?.get('response') || 'ATTENDING'
  const eventName = searchParams?.get('eventName') || 'the event'
  const eventDate = searchParams?.get('eventDate') || ''
  const email = searchParams?.get('email') || ''

  const responseMessages = {
    ATTENDING: {
      title: '✓ You\'re Attending!',
      message: 'Thank you for confirming your attendance.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    MAYBE: {
      title: '? Maybe Attending',
      message: 'Thank you for your response. We hope to see you there!',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    NOT_ATTENDING: {
      title: '✗ Not Attending',
      message: 'Thank you for letting us know. We\'ll miss you!',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    }
  }

  const config = responseMessages[response as keyof typeof responseMessages] || responseMessages.ATTENDING

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className={`${config.bgColor} ${config.borderColor} border-2 rounded-xl p-6 mb-6`}>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className={`w-16 h-16 ${config.color}`} />
            </div>
            <h1 className={`text-2xl font-bold text-center mb-2 ${config.color}`}>
              {config.title}
            </h1>
            <p className="text-center text-gray-600">
              {config.message}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">{eventName}</p>
                {eventDate && (
                  <p className="text-sm text-gray-600">{eventDate}</p>
                )}
              </div>
            </div>

            {email && (
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-rose-600 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Confirmation sent to:</p>
                  <p className="font-medium text-gray-900">{email}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              You can close this window now.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-rose-600 hover:text-rose-700 font-medium"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}

export default function RSVPSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    }>
      <RSVPSuccessContent />
    </Suspense>
  )
}
